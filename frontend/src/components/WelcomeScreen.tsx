import { motion } from 'motion/react';
import { Utensils, ArrowRight } from 'lucide-react';
import Layout from './Layout';

interface WelcomeScreenProps {
  onNext: () => void;
  onActivity?: () => void;
}

export default function WelcomeScreen({ onNext, onActivity }: WelcomeScreenProps) {
  return (
    <Layout className="justify-center items-center text-center p-6 bg-background overflow-hidden">
      {/* Ambient Decorative Element */}
      <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
      
      <main className="w-full h-full flex flex-col items-center md:items-start justify-center flex-grow z-10 px-6 md:px-20 space-y-12">
        {/* Meta Tag */}
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="meta-tag text-primary"
        >
          Table 1
        </motion.span>

        {/* Typography Cluster */}
        <div className="space-y-6 text-center md:text-left">
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="editorial-header text-6xl md:text-[100px] text-ink"
          >
            Restaurant<br />
            ABC
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-body text-base md:text-lg text-ink/70 max-w-[380px] leading-relaxed"
          >
            A curated selection of sensory experiences. Scan confirmed. 
            You're ready to explore the menu.
          </motion.p>
        </div>

        {/* CTA Action */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full md:w-auto pt-4 flex flex-col md:flex-row gap-6 items-center"
        >
          <button 
            onClick={() => {
              onActivity?.();
              onNext();
            }}
            className="w-full md:w-auto px-10 h-14 bg-primary text-background rounded-full font-body font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
          >
            <span>View Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onActivity}
            className="text-xs uppercase tracking-widest font-bold underline underline-offset-8 decoration-primary/30 hover:decoration-primary/100 transition-all"
          >
            Find Out More
          </button>
        </motion.div>
      </main>

      {/* Footer / Bottom Bar */}
      <footer className="w-full mt-auto px-6 md:px-20 py-10 flex justify-between items-center z-10 border-t border-border-subtle">
        <div className="flex gap-10">
          <div className="text-[10px] uppercase tracking-widest opacity-60">
            <span className="block text-sm font-display italic text-primary mb-1">12</span> Appetizers
          </div>
          <div className="text-[10px] uppercase tracking-widest opacity-60">
            <span className="block text-sm font-display italic text-primary mb-1">08</span> Mains
          </div>
        </div>
        <div className="hidden md:block text-[10px] uppercase tracking-widest opacity-40">
          Powered by IRMS — Discovery →
        </div>
      </footer>
    </Layout>
  );
}
