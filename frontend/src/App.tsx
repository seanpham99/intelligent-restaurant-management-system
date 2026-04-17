/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MenuItem, CartItem, Screen } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import MenuScreen from './components/MenuScreen';
import ConfirmationScreen from './components/ConfirmationScreen';
import SuccessScreen from './components/SuccessScreen';
import PaymentScreen from './components/PaymentScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Welcome');
  const [cart, setCart] = useState<CartItem[]>([]);

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

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Welcome':
        return <WelcomeScreen onNext={() => setCurrentScreen('Menu')} />;
      case 'Menu':
        return (
          <MenuScreen 
            cart={cart} 
            onUpdateCart={handleUpdateCart} 
            onNext={() => setCurrentScreen('Confirmation')} 
          />
        );
      case 'Confirmation':
        return (
          <ConfirmationScreen 
            cart={cart} 
            onBack={() => setCurrentScreen('Menu')} 
            onNext={() => setCurrentScreen('Success')} 
          />
        );
      case 'Success':
        return (
          <SuccessScreen 
            cart={cart} 
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
