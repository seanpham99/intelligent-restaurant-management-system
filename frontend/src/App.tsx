/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MenuItem, CartItem, Screen, OrderCreateResponse, OrderStatusEvent } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import MenuScreen from './components/MenuScreen';
import ConfirmationScreen from './components/ConfirmationScreen';
import SuccessScreen from './components/SuccessScreen';
import PaymentScreen from './components/PaymentScreen';
import { fetchMenuItems } from './api/menu';
import { createOrder, subscribeOrderStatus } from './api/order';

type StatusConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

const DEFAULT_TABLE_ID = 5;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Welcome');
  const [cart, setCart] = useState<CartItem[]>([]);
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
  const [statusRetryKey, setStatusRetryKey] = useState(0);

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
      return;
    }

    let isCleanedUp = false;
    let openedSocketCount = 0;
    setStatusConnectionState('connecting');
    setStatusConnectionMessage(null);

    const sockets = createdOrders.map(order => {
      const socket = subscribeOrderStatus(order.id, event => {
        if (isCleanedUp) {
          return;
        }
        setOrderStatusById(prev => ({ ...prev, [event.order_id]: event }));
      });

      socket.addEventListener('open', () => {
        if (isCleanedUp) {
          return;
        }
        openedSocketCount += 1;
        if (openedSocketCount === createdOrders.length) {
          setStatusConnectionState('connected');
        }
      });

      socket.addEventListener('error', () => {
        if (isCleanedUp) {
          return;
        }
        setStatusConnectionState('error');
        setStatusConnectionMessage('Live status failed to connect. Please retry.');
      });

      socket.addEventListener('close', closeEvent => {
        if (isCleanedUp || closeEvent.code === 1000) {
          return;
        }
        setStatusConnectionState('disconnected');
        setStatusConnectionMessage('Live status disconnected. Retry to reconnect.');
      });

      return socket;
    });

    return () => {
      isCleanedUp = true;
      sockets.forEach(socket => {
        if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
          socket.close(1000, 'Switching screen');
        }
      });
    };
  }, [currentScreen, createdOrders, statusRetryKey]);

  const handleRetryMenuLoad = () => {
    setMenuRefreshKey(prev => prev + 1);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      setCreateOrderError('Your cart is empty. Please add at least one item before submitting.');
      return;
    }

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
      setOrderStatusById({});
      setStatusConnectionState('idle');
      setStatusConnectionMessage(null);
      setStatusRetryKey(0);
      setCurrentScreen('Success');
    } catch (error: unknown) {
      setCreateOrderError(
        error instanceof Error
          ? `Order submission failed: ${error.message}`
          : 'Order submission failed. Please check your connection and try again.',
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleRetryStatus = () => {
    setStatusRetryKey(prev => prev + 1);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Welcome':
        return <WelcomeScreen onNext={() => setCurrentScreen('Menu')} />;
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
              setCurrentScreen('Confirmation');
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
              setCurrentScreen('Menu');
            }}
            onSubmit={handleSubmitOrder}
          />
        );
      case 'Success':
        return (
          <SuccessScreen
            cart={cart}
            createdOrders={createdOrders}
            orderStatusById={orderStatusById}
            statusConnectionState={statusConnectionState}
            statusConnectionMessage={statusConnectionMessage}
            onRetryStatus={handleRetryStatus}
            onAddMore={() => setCurrentScreen('Menu')}
            onPay={() => setCurrentScreen('Payment')}
          />
        );
      case 'Payment':
        return (
          <PaymentScreen
            cart={cart}
            onBack={() => setCurrentScreen('Success')}
            onConfirm={() => {
              setCurrentScreen('Welcome');
              setCart([]);
              setCreatedOrders([]);
              setOrderStatusById({});
              setCreateOrderError(null);
              setStatusConnectionState('idle');
              setStatusConnectionMessage(null);
            }}
          />
        );
      default:
        return <WelcomeScreen onNext={() => setCurrentScreen('Menu')} />;
    }
  };

  return (
    <div className="bg-stone-100 min-h-screen">
      <AnimatePresence mode="wait">
        <div key={currentScreen}>
          {renderScreen()}
        </div>
      </AnimatePresence>
    </div>
  );
}
