/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { canFinalizeSettlement } from './flow/payment-guards';
import {
  STATUS_STREAM_UNAVAILABLE_MESSAGE,
  canRetryStatusStream,
  planStatusRetry,
} from './flow/status-connection';
import { isSessionExpired, shouldApplySessionEpochUpdate } from './flow/session-timeout';
import { canLeaveConfirmation } from './flow/confirmation-navigation';

type StatusConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'completed'
  | 'disconnected'
  | 'error';
type OrderSocketState = 'connecting' | 'open' | 'closed' | 'disconnected' | 'error';

const DEFAULT_TABLE_ID = 0;
const TIMEOUT_MS = 5 * 60 * 1000;

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

function getSettlementGuardMessage(reason: 'EMPTY_ORDER' | 'ALREADY_SETTLED'): string {
  switch (reason) {
    case 'EMPTY_ORDER':
      return 'No submitted order available for settlement.';
    case 'ALREADY_SETTLED':
      return 'This session has already been settled.';
    default:
      return 'Unable to finalize settlement.';
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
  const [lastActivityAt, setLastActivityAt] = useState(() => Date.now());
  const sessionEpochRef = useRef(0);
  const pendingSubmissionFingerprintsRef = useRef<Set<string>>(new Set());
  const statusRetryTimeoutRef = useRef<number | null>(null);
  const currentScreen = flowState.screen;

  const clearStatusRetryTimeout = useCallback(() => {
    if (statusRetryTimeoutRef.current === null) {
      return;
    }
    window.clearTimeout(statusRetryTimeoutRef.current);
    statusRetryTimeoutRef.current = null;
  }, []);

  const refreshLastActivity = useCallback(() => {
    setLastActivityAt(Date.now());
  }, []);

  const resetSessionArtifacts = useCallback((options?: { bumpEpoch?: boolean }) => {
    if (options?.bumpEpoch === true) {
      sessionEpochRef.current += 1;
    }
    clearStatusRetryTimeout();
    pendingSubmissionFingerprintsRef.current.clear();
    setCart([]);
    setSubmittedCart([]);
    setCreatedOrders([]);
    setOrderStatusById({});
    setIsCreatingOrder(false);
    setCreateOrderError(null);
    setStatusConnectionState('idle');
    setStatusConnectionMessage(null);
    setStatusRetryAttempt(0);
  }, [clearStatusRetryTimeout]);

  const resetSessionToWelcome = useCallback(() => {
    resetSessionArtifacts({ bumpEpoch: true });
    setFlowState({ screen: 'Welcome', paymentSettled: false });
    setLastActivityAt(Date.now());
  }, [resetSessionArtifacts]);

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
    refreshLastActivity();
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
    const intervalId = window.setInterval(() => {
      if (isSessionExpired(lastActivityAt, Date.now(), TIMEOUT_MS)) {
        resetSessionToWelcome();
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lastActivityAt, resetSessionToWelcome]);

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
    refreshLastActivity();
    setMenuRefreshKey(prev => prev + 1);
  };

  const handleSubmitOrder = async () => {
    refreshLastActivity();
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
    const submitEpoch = sessionEpochRef.current;

    try {
      const created = await createOrder(payload);
      if (!shouldApplySessionEpochUpdate(sessionEpochRef.current, submitEpoch)) {
        return;
      }
      setCreatedOrders(created);
      setSubmittedCart(cart);
      setCart([]);
      setOrderStatusById({});
      setStatusConnectionState('idle');
      setStatusConnectionMessage(null);
      setStatusRetryAttempt(0);
      handleFlowEvent({ type: 'SUBMIT_SUCCESS' });
    } catch (error: unknown) {
      if (!shouldApplySessionEpochUpdate(sessionEpochRef.current, submitEpoch)) {
        return;
      }
      setCreateOrderError(
        error instanceof Error
          ? `Order submission failed: ${error.message}`
          : 'Order submission failed. Please check your connection and try again.',
      );
    } finally {
      if (!shouldApplySessionEpochUpdate(sessionEpochRef.current, submitEpoch)) {
        return;
      }
      pendingSubmissionFingerprintsRef.current.delete(fingerprint);
      setIsCreatingOrder(false);
    }
  };

  const handleRetryStatus = () => {
    refreshLastActivity();
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
        return (
          <WelcomeScreen
            onActivity={refreshLastActivity}
            onNext={() => {
              handleFlowEvent({ type: 'VIEW_MENU' });
            }}
          />
        );
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
              refreshLastActivity();
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
              if (!canLeaveConfirmation(isCreatingOrder)) {
                return;
              }
              refreshLastActivity();
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
            onAddMore={() => {
              refreshLastActivity();
              handleFlowEvent({ type: 'SUPPLEMENT_ORDER' });
            }}
            onPay={() => {
              refreshLastActivity();
              handleFlowEvent({ type: 'GO_PAYMENT' });
            }}
          />
        );
      case 'Payment':
        const settlementGuard = canFinalizeSettlement({
          submittedItems: submittedCart.length,
          paymentSettled: flowState.paymentSettled,
        });
        const settlementGuardMessage = settlementGuard.ok === false
          ? getSettlementGuardMessage(settlementGuard.reason)
          : null;

        return (
          <PaymentScreen
            cart={submittedCart}
            createdOrders={createdOrders}
            settlementGuard={settlementGuard}
            settlementGuardMessage={settlementGuardMessage}
            onBack={() => {
              refreshLastActivity();
              handleFlowEvent({ type: 'BACK_TO_SUCCESS' });
            }}
            onConfirm={() => {
              refreshLastActivity();
              const finalizeGuard = canFinalizeSettlement({
                submittedItems: submittedCart.length,
                paymentSettled: flowState.paymentSettled,
              });
              if (finalizeGuard.ok === false) {
                return;
              }
              handleFlowEvent({ type: 'SETTLE_PAYMENT' });
              resetSessionArtifacts({ bumpEpoch: true });
            }}
          />
        );
      default:
        return (
          <WelcomeScreen
            onActivity={refreshLastActivity}
            onNext={() => {
              handleFlowEvent({ type: 'VIEW_MENU' });
            }}
          />
        );
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
