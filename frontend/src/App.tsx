/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MenuItem, CartItem, OrderCreateResponse, OrderStatusEvent } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import MenuScreen from './components/MenuScreen';
import ConfirmationScreen from './components/ConfirmationScreen';
import SuccessScreen from './components/SuccessScreen';
import PaymentScreen from './components/PaymentScreen';
import { fetchMenuItems } from './api/menu';
import { createOrder, subscribeOrderStatus } from './api/order';
import { transition, FlowEvent, FlowState } from './flow/session-machine';
import { buildCartFingerprint, canSubmitCart, isDuplicatePendingSubmission } from './flow/order-guards';
import {
  STATUS_STREAM_UNAVAILABLE_MESSAGE,
  canRetryStatusStream,
  planStatusRetry,
} from './flow/status-connection';

type StatusConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'completed'
  | 'disconnected'
  | 'error';
type OrderSocketState = 'connecting' | 'open' | 'closed' | 'disconnected' | 'error';

const DEFAULT_TABLE_ID = 0;

function deriveAggregateStatusConnectionState(
  statesByOrderId: Record<string, OrderSocketState>,
): StatusConnectionState {
  const states = Object.values(statesByOrderId);
  if (states.length === 0) {
    return 'idle';
  }
  if (states.includes('error')) {
    return 'error';
  }
  if (states.includes('disconnected')) {
    return 'disconnected';
  }
  if (states.every(state => state === 'closed')) {
    return 'completed';
  }
  if (states.every(state => state === 'open' || state === 'closed')) {
    return 'connected';
  }
  return 'connecting';
}

function getStatusConnectionMessage(state: StatusConnectionState): string | null {
  switch (state) {
    case 'error':
      return 'Live status failed to connect. Please retry.';
    case 'disconnected':
      return 'Live status disconnected. Retry to reconnect.';
    default:
      return null;
  }
}

export default function App() {
  const [flowState, setFlowState] = useState<FlowState>({
    screen: 'Welcome',
    paymentSettled: false,
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submittedCart, setSubmittedCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);
  const [menuRefreshKey, setMenuRefreshKey] = useState(0);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [createOrderError, setCreateOrderError] = useState<string | null>(null);
  const [createdOrders, setCreatedOrders] = useState<OrderCreateResponse[]>([]);
  const [orderStatusById, setOrderStatusById] = useState<Record<string, OrderStatusEvent>>({});
  const [statusConnectionState, setStatusConnectionState] = useState<StatusConnectionState>('idle');
  const [statusConnectionMessage, setStatusConnectionMessage] = useState<string | null>(null);
  const [statusRetryAttempt, setStatusRetryAttempt] = useState(0);
  const pendingSubmissionFingerprintsRef = useRef<Set<string>>(new Set());
  const statusRetryTimeoutRef = useRef<number | null>(null);
  const currentScreen = flowState.screen;

  const clearStatusRetryTimeout = () => {
    if (statusRetryTimeoutRef.current === null) {
      return;
    }
    window.clearTimeout(statusRetryTimeoutRef.current);
    statusRetryTimeoutRef.current = null;
  };

  const handleFlowEvent = (event: FlowEvent): void => {
    setFlowState(prev => {
      const result = transition(prev, event);
      if (!result.ok) {
        return prev;
      }
      return result.state;
    });
  };

  const handleUpdateCart = (item: MenuItem, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQuantity = Math.max(0, existing.quantity + delta);
        if (newQuantity === 0) {
          return prev.filter(i => i.id !== item.id);
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i);
      }
      if (delta > 0) {
        return [...prev, { ...item, quantity: delta }];
      }
      return prev;
    });
  };

  useEffect(() => {
    if (currentScreen !== 'Menu') {
      return;
    }

    let cancelled = false;
    setIsMenuLoading(true);
    setMenuLoadError(null);

    fetchMenuItems()
      .then(items => {
        if (cancelled) {
          return;
        }
        setMenuItems(items);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setMenuItems([]);
        setMenuLoadError(
          error instanceof Error ? error.message : 'Unable to load menu. Please try again.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsMenuLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentScreen, menuRefreshKey]);

  useEffect(() => {
    if (currentScreen !== 'Success' || createdOrders.length === 0) {
      clearStatusRetryTimeout();
      return;
    }

    let isCleanedUp = false;
    let isRetryScheduled = false;
    let orderSocketStates: Record<string, OrderSocketState> = Object.fromEntries(
      createdOrders.map(order => [order.id, 'connecting']),
    ) as Record<string, OrderSocketState>;

    const scheduleRetry = (delayMs: number, nextAttempt: number) => {
      if (isCleanedUp || isRetryScheduled) {
        return;
      }
      isRetryScheduled = true;
      clearStatusRetryTimeout();
      statusRetryTimeoutRef.current = window.setTimeout(() => {
        if (isCleanedUp) {
          return;
        }
        setStatusRetryAttempt(nextAttempt);
      }, delayMs);
    };

    const syncAggregateStatus = (nextOrderSocketStates: Record<string, OrderSocketState>) => {
      const aggregateState = deriveAggregateStatusConnectionState(nextOrderSocketStates);
      setStatusConnectionState(aggregateState);
      if (aggregateState === 'error' || aggregateState === 'disconnected') {
        const retryPlan = planStatusRetry(
          statusRetryAttempt,
          getStatusConnectionMessage(aggregateState) ?? STATUS_STREAM_UNAVAILABLE_MESSAGE,
        );
        setStatusConnectionMessage(retryPlan.message);
        if (!retryPlan.shouldSchedule || retryPlan.delayMs === null) {
          clearStatusRetryTimeout();
          return;
        }
        scheduleRetry(retryPlan.delayMs, retryPlan.nextAttempt);
        return;
      }
      setStatusConnectionMessage(getStatusConnectionMessage(aggregateState));
      clearStatusRetryTimeout();
    };

    const updateOrderSocketState = (orderId: string, nextState: OrderSocketState) => {
      if (isCleanedUp) {
        return;
      }
      orderSocketStates = {
        ...orderSocketStates,
        [orderId]: nextState,
      };
      syncAggregateStatus(orderSocketStates);
    };

    syncAggregateStatus(orderSocketStates);

    const sockets = createdOrders.map(order => {
      const socket = subscribeOrderStatus(order.id, event => {
        if (isCleanedUp) {
          return;
        }
        setOrderStatusById(prev => ({ ...prev, [event.order_id]: event }));
      });

      socket.addEventListener('open', () => {
        updateOrderSocketState(order.id, 'open');
      });

      socket.addEventListener('error', () => {
        updateOrderSocketState(order.id, 'error');
      });

      socket.addEventListener('close', closeEvent => {
        if (isCleanedUp) {
          return;
        }
        if (closeEvent.code === 1000) {
          updateOrderSocketState(order.id, 'closed');
          return;
        }
        updateOrderSocketState(order.id, 'disconnected');
      });

      return socket;
    });

    return () => {
      isCleanedUp = true;
      clearStatusRetryTimeout();
      sockets.forEach(socket => {
        if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
          socket.close(1000, 'Switching screen');
        }
      });
    };
  }, [currentScreen, createdOrders, statusRetryAttempt]);

  const handleRetryMenuLoad = () => {
    setMenuRefreshKey(prev => prev + 1);
  };

  const handleSubmitOrder = async () => {
    const cartSnapshot = cart.map(item => ({ id: item.id, quantity: item.quantity }));
    const fingerprint = buildCartFingerprint(cartSnapshot);

    if (isDuplicatePendingSubmission(fingerprint, pendingSubmissionFingerprintsRef.current)) {
      setCreateOrderError('This order is already being submitted. Please wait.');
      return;
    }

    const submitGuard = canSubmitCart(
      cartSnapshot,
      menuItems.map(item => ({ id: item.id, soldOut: item.soldOut })),
    );

    if (submitGuard.ok === false) {
      setCreateOrderError(
        submitGuard.reason === 'EMPTY_CART'
          ? 'Your cart is empty. Please add at least one item before submitting.'
          : 'Some selected items are no longer available. Please review your cart.',
      );
      return;
    }

    pendingSubmissionFingerprintsRef.current.add(fingerprint);
    setIsCreatingOrder(true);
    setCreateOrderError(null);

    const payload = cart.map(item => ({
      item_id: item.id,
      table_id: DEFAULT_TABLE_ID,
      amount: item.quantity,
    }));

    try {
      const created = await createOrder(payload);
      setCreatedOrders(created);
      setSubmittedCart(cart);
      setCart([]);
      setOrderStatusById({});
      setStatusConnectionState('idle');
      setStatusConnectionMessage(null);
      setStatusRetryAttempt(0);
      handleFlowEvent({ type: 'SUBMIT_SUCCESS' });
    } catch (error: unknown) {
      setCreateOrderError(
        error instanceof Error
          ? `Order submission failed: ${error.message}`
          : 'Order submission failed. Please check your connection and try again.',
      );
    } finally {
      pendingSubmissionFingerprintsRef.current.delete(fingerprint);
      setIsCreatingOrder(false);
    }
  };

  const handleRetryStatus = () => {
    const retryPlan = planStatusRetry(
      statusRetryAttempt,
      statusConnectionMessage
        ?? getStatusConnectionMessage(statusConnectionState)
        ?? STATUS_STREAM_UNAVAILABLE_MESSAGE,
    );
    setStatusConnectionMessage(retryPlan.message);
    if (!retryPlan.shouldSchedule || retryPlan.delayMs === null) {
      clearStatusRetryTimeout();
      return;
    }
    clearStatusRetryTimeout();
    statusRetryTimeoutRef.current = window.setTimeout(() => {
      setStatusRetryAttempt(retryPlan.nextAttempt);
    }, retryPlan.delayMs);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Welcome':
        return <WelcomeScreen onNext={() => handleFlowEvent({ type: 'VIEW_MENU' })} />;
      case 'Menu':
        return (
          <MenuScreen
            menuItems={menuItems}
            isLoading={isMenuLoading}
            menuError={menuLoadError}
            onRetryMenuLoad={handleRetryMenuLoad}
            cart={cart}
            onUpdateCart={handleUpdateCart}
            onNext={() => {
              setCreateOrderError(null);
              handleFlowEvent({ type: 'REVIEW_ORDER' });
            }}
          />
        );
      case 'Confirmation':
        return (
          <ConfirmationScreen
            cart={cart}
            isSubmitting={isCreatingOrder}
            submitError={createOrderError}
            onBack={() => {
              setCreateOrderError(null);
              handleFlowEvent({ type: 'VIEW_MENU' });
            }}
            onSubmit={handleSubmitOrder}
          />
        );
      case 'Success':
        return (
          <SuccessScreen
            cart={submittedCart}
            createdOrders={createdOrders}
            orderStatusById={orderStatusById}
            statusConnectionState={statusConnectionState}
            statusConnectionMessage={statusConnectionMessage}
            canRetryStatus={canRetryStatusStream(statusRetryAttempt)}
            onRetryStatus={handleRetryStatus}
            onAddMore={() => handleFlowEvent({ type: 'SUPPLEMENT_ORDER' })}
            onPay={() => handleFlowEvent({ type: 'GO_PAYMENT' })}
          />
        );
      case 'Payment':
        return (
          <PaymentScreen
            cart={submittedCart}
            createdOrders={createdOrders}
            onBack={() => handleFlowEvent({ type: 'BACK_TO_SUCCESS' })}
            onConfirm={() => {
              handleFlowEvent({ type: 'SETTLE_PAYMENT' });
              setCart([]);
              setSubmittedCart([]);
              setCreatedOrders([]);
              setOrderStatusById({});
              setCreateOrderError(null);
              setStatusConnectionState('idle');
              setStatusConnectionMessage(null);
              setStatusRetryAttempt(0);
            }}
          />
        );
      default:
        return <WelcomeScreen onNext={() => handleFlowEvent({ type: 'VIEW_MENU' })} />;
    }
  };

  return (
    <div className="bg-page min-h-screen">
      <AnimatePresence mode="wait">
        <div key={currentScreen}>
          {renderScreen()}
        </div>
      </AnimatePresence>
    </div>
  );
}
