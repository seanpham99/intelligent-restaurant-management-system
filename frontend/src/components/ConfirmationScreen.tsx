import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Layout from './Layout';
import { CartItem } from '../types';
import { VAT_RATE } from '../constants';

interface ConfirmationScreenProps {
  cart: CartItem[];
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

export default function ConfirmationScreen({
  cart,
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: ConfirmationScreenProps) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // Assuming VAT included in shown price as per design mocks

  return (
    <Layout className="bg-background">
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-md flex justify-between items-center px-6 md:px-12 py-6 border-b border-border-subtle">
        <button onClick={onBack} className="text-ink/60 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="font-display font-bold text-xl tracking-tighter text-ink italic">
          Review Order
        </div>
        <div className="w-4 h-4"></div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-10 pb-32 px-6 md:px-12 flex flex-col gap-10">
        {/* Table Context Banner */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-6">
          <span className="meta-tag text-primary">Dining Station</span>
          <div className="flex items-center gap-2">
            <span className="font-display italic text-2xl text-ink">Table 05</span>
          </div>
        </div>

        {/* Order Items */}
        <section className="space-y-8">
          <h2 className="meta-tag text-ink/40">Selection</h2>
          
          <div className="space-y-6">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-baseline group">
                <div className="flex items-center gap-6">
                  <span className="font-display italic text-primary text-xl">
                    {item.quantity}
                  </span>
                  <h3 className="font-display text-lg text-ink group-hover:text-primary transition-colors">{item.name}</h3>
                </div>
                <div className="flex-grow border-b border-dotted border-border-subtle mx-4 opacity-30"></div>
                <span className="font-body text-xs text-ink/60 tabular-nums">
                  {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Receipt Summary */}
        <section className="mt-auto space-y-4 pt-10 border-t border-border-subtle">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-ink/40">
            <span>Subtotal</span>
            <span className="text-ink">{subtotal.toLocaleString()} VND</span>
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-ink/40">
            <span>Tax (VAT 10%)</span>
            <span className="italic">Included</span>
          </div>
          <div className="pt-4 flex justify-between items-center">
            <span className="editorial-header text-4xl text-ink">Total</span>
            <span className="font-display italic text-3xl text-primary">{total.toLocaleString()} <span className="text-[10px] non-italic uppercase text-ink/40 tracking-widest font-body">VND</span></span>
          </div>
        </section>

        <p className="text-center font-body text-[10px] uppercase tracking-widest text-ink/30">
          Modifications must be finalized prior to submission.
        </p>
        {submitError && (
          <div className="border border-error-border bg-error-surface p-4 text-center">
            <p className="meta-tag text-error mb-1">Unable to submit order</p>
            <p className="font-body text-xs text-error/90">{submitError}</p>
          </div>
        )}
      </main>

      {/* Sticky Action Area */}
      <div className="fixed inset-x-0 bottom-0 md:sticky md:bottom-0 bg-background/90 backdrop-blur-md z-50 px-4 sm:px-6 md:px-12 py-4 border-t border-border-subtle">
        <div className="mx-auto w-full max-w-5xl flex flex-col md:flex-row gap-4">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full md:flex-1 h-14 bg-primary disabled:opacity-60 disabled:cursor-not-allowed text-background font-body font-bold text-xs uppercase tracking-widest rounded-full flex items-center justify-center transition-all hover:brightness-110 active:scale-[0.98]"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Order'}
          </button>
          <button
            onClick={onBack}
            className="w-full md:flex-1 h-14 border border-border-subtle text-ink font-body font-bold text-xs uppercase tracking-widest rounded-full flex items-center justify-center transition-all hover:bg-ink/5"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </Layout>
  );
}
