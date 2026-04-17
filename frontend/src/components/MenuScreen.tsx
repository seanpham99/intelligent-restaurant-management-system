import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu as MenuIcon, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';
import Layout from './Layout';
import { Category, MenuItem, CartItem } from '../types';
import { MENU_ITEMS } from '../constants';

interface MenuScreenProps {
  cart: CartItem[];
  onUpdateCart: (item: MenuItem, delta: number) => void;
  onNext: () => void;
}

const CATEGORIES: Category[] = ['Appetizers', 'Main Course', 'Drinks', 'Desserts'];

export default function MenuScreen({ cart, onUpdateCart, onNext }: MenuScreenProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('Appetizers');

  const filteredItems = MENU_ITEMS.filter(item => item.category === activeCategory);
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getQuantity = (id: string) => {
    return cart.find(item => item.id === id)?.quantity || 0;
  };

  return (
    <Layout className="bg-background">
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-md flex justify-between items-center px-6 md:px-12 py-6 border-b border-border-subtle">
        <button className="text-primary hover:opacity-80 transition-opacity">
          <MenuIcon className="w-4 h-4" />
        </button>
        <span className="font-display font-bold text-xl tracking-tighter text-ink">
          E.
        </span>
        <button className="text-primary hover:opacity-80 transition-opacity relative">
          <ShoppingBag className="w-4 h-4" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-background text-[8px] font-bold w-3 h-3 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="px-6 md:px-12 pb-32">
        {/* Category Tabs */}
        <nav className="flex overflow-x-auto no-scrollbar py-8 gap-6 sticky top-[72px] bg-background z-40">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap font-body font-bold text-[10px] uppercase tracking-[0.2em] transition-all relative ${
                activeCategory === category
                  ? 'text-primary after:absolute after:-bottom-2 after:left-0 after:w-full after:h-px after:bg-primary'
                  : 'text-ink/40 hover:text-ink/60'
              }`}
            >
              {category}
            </button>
          ))}
        </nav>

        {/* Category Title */}
        <div className="mb-10">
          <span className="meta-tag text-primary block mb-2">Category</span>
          <h2 className="editorial-header text-5xl text-ink">
            {activeCategory}
          </h2>
        </div>

        {/* Items List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map(item => {
            const quantity = getQuantity(item.id);
            return (
              <motion.div
                layout
                key={item.id}
                className={`group p-6 flex flex-col gap-6 transition-all border border-border-subtle hover:border-primary/30 relative ${
                  item.soldOut ? 'opacity-40 grayscale' : ''
                }`}
              >
                {item.popular && (
                  <span className="absolute top-4 left-4 meta-tag text-[8px] text-primary">Popular Selection</span>
                )}
                
                <div className="flex justify-between items-start gap-6 pt-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="font-display font-medium text-xl text-ink italic leading-tight">
                      {item.name}
                    </h3>
                    <p className="font-body text-xs text-ink/50 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  {item.image && (
                    <div className="w-20 h-28 bg-surface-variant rounded-sm shrink-0 overflow-hidden border border-border-subtle relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex justify-between items-center">
                  <span className="font-display italic text-lg text-primary">
                    {item.price.toLocaleString()} <span className="text-[10px] non-italic uppercase tracking-widest text-ink/40 font-body ml-1">{item.currency}</span>
                  </span>

                  {item.soldOut ? (
                    <span className="font-body text-[10px] uppercase tracking-widest text-ink/40 font-bold">
                      Sold Out
                    </span>
                  ) : quantity > 0 ? (
                    <div className="flex items-center border border-primary/20 rounded-full h-8 overflow-hidden bg-surface">
                      <button 
                        onClick={() => onUpdateCart(item, -1)}
                        className="w-8 h-full flex items-center justify-center text-ink hover:text-primary transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-body font-bold text-[10px] w-6 text-center text-ink">
                        {quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateCart(item, 1)}
                        className="w-8 h-full flex items-center justify-center text-ink hover:text-primary transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onUpdateCart(item, 1)}
                      className="text-[10px] uppercase tracking-[0.2em] font-bold underline underline-offset-4 decoration-primary/30 hover:decoration-primary/100 transition-all text-ink"
                    >
                      + Select
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Sticky Checkout Strip */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[400px] z-50"
          >
            <button 
              onClick={onNext}
              className="w-full bg-primary text-background rounded-full h-14 flex items-center justify-between px-8 shadow-2xl active:scale-[0.98] transition-all"
            >
              <div className="flex flex-col items-start">
                <span className="font-body text-[8px] uppercase tracking-widest font-bold opacity-80">
                  {totalItems} items selected
                </span>
                <span className="font-display font-medium italic text-sm">
                  Review Collection — {totalPrice.toLocaleString()} VND
                </span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
