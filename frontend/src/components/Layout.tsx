import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export default function Layout({ children, className = '' }: LayoutProps) {
  return (
    <div className="min-h-dvh bg-background flex flex-col md:flex-row items-stretch justify-center p-0">
      {/* Side Nav Rail */}
      <nav className="hidden md:flex w-20 flex-col justify-between items-center py-10 border-r border-border-subtle bg-background shrink-0">
        <div className="font-display font-bold text-2xl tracking-tighter">E.</div>
        <div className="vertical-label text-[10px] uppercase tracking-[0.3em] text-primary whitespace-nowrap opacity-80">
          Restaurant ABC
        </div>
        <div className="w-5 h-px bg-ink/30"></div>
      </nav>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`w-full md:flex-1 min-h-dvh md:min-h-0 md:h-dvh bg-background relative overflow-x-hidden flex flex-col ${className}`}
      >
        {children}
      </motion.main>
    </div>
  );
}
