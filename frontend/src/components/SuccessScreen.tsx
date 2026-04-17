import { motion } from 'motion/react';
import { CheckCircle2, Plus } from 'lucide-react';
import Layout from './Layout';
import { CartItem } from '../types';

interface SuccessScreenProps {
  cart: CartItem[];
  onAddMore: () => void;
  onPay: () => void;
}

export default function SuccessScreen({ cart, onAddMore, onPay }: SuccessScreenProps) {
  return (
    <Layout className="bg-background">
      <div className="flex-grow flex flex-col items-center md:items-start justify-center text-center md:text-left p-6 md:p-20 z-10 transition-all">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full border border-primary flex items-center justify-center mb-10"
        >
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </motion.div>

        <span className="meta-tag text-primary mb-4">Transmission Successful</span>
        <h1 className="editorial-header text-5xl md:text-[80px] text-ink mb-6">
          Order<br />Placed.
        </h1>
        <p className="font-body text-sm text-ink/50 leading-relaxed mb-12 max-w-[320px]">
          Your selection has been dispatched to the culinary team. 
          Please await excellence.
        </p>

        {/* Order Summary Summary */}
        <div className="w-full max-w-[360px] border border-border-subtle p-8 transition-all hover:border-primary/20">
          <div className="flex justify-between items-center mb-6">
            <span className="meta-tag text-ink/30">Entry #142</span>
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest px-3 py-1 border border-primary/20 rounded-full italic">
              Processing
            </span>
          </div>
          <ul className="space-y-4 font-display text-lg text-ink">
            {cart.map(item => (
              <li key={item.id} className="flex justify-between items-baseline italic">
                <span>{item.name}</span>
                <span className="text-primary text-xs non-italic ml-2">x{item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions & Footer */}
      <footer className="mt-auto z-10 w-full p-6 md:px-20 py-10 flex flex-col md:flex-row gap-6 border-t border-border-subtle items-center">
        <button 
          onClick={onAddMore}
          className="w-full md:w-auto px-10 h-14 bg-primary text-background font-body font-bold text-xs uppercase tracking-widest rounded-full flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-background" />
          Supplement Order
        </button>
        <button 
          onClick={onPay}
          className="text-xs uppercase tracking-widest font-bold underline underline-offset-8 decoration-primary/30 hover:decoration-primary/100 transition-all text-ink"
        >
          Finalize Payment
        </button>
      </footer>
    </Layout>
  );
}
