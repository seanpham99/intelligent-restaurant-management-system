import { useState } from 'react';
import { X, CreditCard, Banknote, Landmark } from 'lucide-react';
import Layout from './Layout';
import { CartItem, OrderCreateResponse } from '../types';
import { TAX_RATE, SERVICE_CHARGE_RATE } from '../constants';
import { SettlementResult } from '../flow/payment-guards';

interface PaymentScreenProps {
  cart: CartItem[];
  createdOrders: OrderCreateResponse[];
  settlementGuard: SettlementResult;
  settlementGuardMessage: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD';

export default function PaymentScreen({
  cart,
  createdOrders,
  settlementGuard,
  settlementGuardMessage,
  onBack,
  onConfirm,
}: PaymentScreenProps) {
  const [method, setMethod] = useState<PaymentMethod>('TRANSFER');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
  const total = subtotal + tax + serviceCharge;
  const hasMixedCurrencies = new Set(cart.map(item => item.currency)).size > 1;
  const currency = cart[0]?.currency ?? 'VND';
  const currencySuffix = hasMixedCurrencies ? '' : ` ${currency}`;
  const orderReference = createdOrders.length > 0
    ? `#${createdOrders[0].id.slice(0, 8).toUpperCase()}`
    : 'N/A';

  const formatAmount = (value: number) => value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <Layout className="bg-background">
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-md flex justify-between items-center px-6 md:px-12 py-6 border-b border-border-subtle">
        <button onClick={onBack} className="text-ink/60 hover:text-primary transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="font-display font-bold text-xl tracking-tighter text-ink italic">
          Settlement
        </div>
        <div className="w-4 h-4"></div>
      </header>

      <main className="flex-grow pt-10 px-6 md:px-12 pb-32 space-y-12">
        {/* Bill Overview */}
        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <span className="meta-tag text-primary block mb-1">Final Summary</span>
              <h2 className="editorial-header text-4xl text-ink">Bill Overview</h2>
            </div>
          </div>

          <div className="space-y-4 font-body text-sm">
            {cart.length === 0 ? (
              <div className="border border-border-subtle p-4 text-center">
                <p className="font-body text-xs text-ink/50">No submitted order to settle yet.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-baseline group">
                  <span className="font-display italic text-ink text-lg">x{item.quantity} {item.name}</span>
                  <div className="flex-grow border-b border-dotted border-border-subtle mx-4 opacity-20"></div>
                  <p className="text-ink/60">
                    {formatAmount(item.price * item.quantity)} {item.currency}
                  </p>
                </div>
              ))
            )}

            {/* Spacer */}
            <div className="pt-8">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-ink/30 mb-2">
                <span>Subtotal</span>
                <span>{formatAmount(subtotal)}{currencySuffix}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-ink/30 mb-2">
                <span>Tax (8.5%)</span>
                <span>{formatAmount(tax)}{currencySuffix}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-ink/30">
                <span>Service (18%)</span>
                <span>{formatAmount(serviceCharge)}{currencySuffix}</span>
              </div>
            </div>

            {/* Total */}
            <div className="pt-8 mt-4 border-t border-border-subtle flex justify-between items-end">
              <p className="editorial-header text-4xl text-ink">Total Due</p>
              <p className="font-display italic text-4xl text-primary">{formatAmount(total)}{currencySuffix}</p>
            </div>
          </div>
        </section>

        {/* Payment Method Selector */}
        <section className="space-y-6">
          <h2 className="meta-tag text-ink/40">Select Method</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cash */}
            <button 
              onClick={() => setMethod('CASH')}
              className={`py-6 px-4 flex justify-between items-center transition-all border ${
                method === 'CASH' ? 'bg-primary/5 border-primary' : 'bg-surface border-border-subtle'
              }`}
            >
              <div className="flex items-center gap-4">
                <Banknote className={`w-4 h-4 ${method === 'CASH' ? 'text-primary' : 'text-ink/40'}`} />
                <span className={`text-[10px] uppercase tracking-widest font-bold ${method === 'CASH' ? 'text-ink' : 'text-ink/40'}`}>
                  Cash
                </span>
              </div>
              {method === 'CASH' && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]"></div>}
            </button>
            {/* Bank Transfer */}
            <button 
              onClick={() => setMethod('TRANSFER')}
              className={`py-6 px-4 flex justify-between items-center transition-all border ${
                method === 'TRANSFER' ? 'bg-primary/5 border-primary' : 'bg-surface border-border-subtle'
              }`}
            >
              <div className="flex items-center gap-4">
                <Landmark className={`w-4 h-4 ${method === 'TRANSFER' ? 'text-primary' : 'text-ink/40'}`} />
                <span className={`text-[10px] uppercase tracking-widest font-bold ${method === 'TRANSFER' ? 'text-ink' : 'text-ink/40'}`}>
                  Transfer
                </span>
              </div>
              {method === 'TRANSFER' && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]"></div>}
            </button>
            {/* Card */}
            <button 
              onClick={() => setMethod('CARD')}
              className={`py-6 px-4 flex justify-between items-center transition-all border ${
                method === 'CARD' ? 'bg-primary/5 border-primary' : 'bg-surface border-border-subtle'
              }`}
            >
              <div className="flex items-center gap-4">
                <CreditCard className={`w-4 h-4 ${method === 'CARD' ? 'text-primary' : 'text-ink/40'}`} />
                <span className={`text-[10px] uppercase tracking-widest font-bold ${method === 'CARD' ? 'text-ink' : 'text-ink/40'}`}>
                  Card
                </span>
              </div>
              {method === 'CARD' && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]"></div>}
            </button>
          </div>
        </section>

        {/* QR Code Block for Bank Transfer */}
        {method === 'TRANSFER' && (
          <section className="bg-surface border border-border-subtle p-10 flex flex-col items-center justify-center text-center space-y-8">
            <div className="space-y-2">
              <h3 className="font-display italic text-xl text-ink">Secure Gateway</h3>
              <p className="font-body text-[10px] uppercase tracking-widest text-ink/40 max-w-[220px]">
                Initiate transfer via your preferred banking platform
              </p>
            </div>
            <div className="relative p-6 bg-background border border-border-subtle">
              <div className="w-40 h-40 bg-white p-2 grayscale contrast-125">
                <img 
                  alt="QR Code" 
                  className="w-full h-full object-contain" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxQKu5Qoat2Ws6_IkEKs1e-0aCq319DCMoIByDcKxNJMG7jgErVE2FwiTk_tLjZEB6WOOonncwjxfJDDf2nnY1PxqNTJR-kBG1TUZCZXVz1LXdbqdzpgwoD5rq9ETecobuK7dUZ1HudSeKK5NrbI2_nuBSfnCwAjPU6YI4YcaQOUJm7uhVUqIoXd5EYlEhnVAwJEuKq8DmWc_L1885DDq-plHzMyHApHU5wD_dnvVsyDDIPFdrZUG4cnfkQSTgNIb6Ofb8lO7fEdg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -top-1 -right-1">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </div>
            </div>
            <div className="border border-border-subtle px-4 py-2">
              <p className="font-body text-[8px] uppercase tracking-[0.3em] text-ink/40">Ref: {orderReference}</p>
            </div>
          </section>
        )}

        <p className="text-center font-body text-[8px] uppercase tracking-widest text-ink/20 mt-12">
          Receipts provided digitally upon verification.
        </p>
      </main>

      {/* Sticky Checkout Strip */}
      <div className="fixed inset-x-0 bottom-0 md:sticky md:bottom-0 backdrop-blur-md px-4 sm:px-6 md:px-12 py-4 z-50 border-t border-border-subtle bg-background/90">
        <div className="mx-auto w-full max-w-5xl">
          {settlementGuardMessage && (
            <p className="mb-3 font-body text-[10px] uppercase tracking-widest text-ink/50">
              {settlementGuardMessage}
            </p>
          )}
          <button 
            onClick={onConfirm}
            disabled={!settlementGuard.ok}
            className="w-full md:w-auto md:px-20 h-14 bg-primary disabled:opacity-60 disabled:cursor-not-allowed text-background font-body font-bold text-xs uppercase tracking-widest rounded-full flex items-center justify-center transition-all shadow-xl hover:brightness-110 active:scale-[0.98]"
          >
            Finalize Settlement
          </button>
        </div>
      </div>
    </Layout>
  );
}
