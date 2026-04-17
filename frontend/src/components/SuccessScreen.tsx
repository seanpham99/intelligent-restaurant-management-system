import { motion } from 'motion/react';
import { CheckCircle2, Plus } from 'lucide-react';
import Layout from './Layout';
import { CartItem, OrderCreateResponse, OrderStatusEvent } from '../types';

type StatusConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'completed'
  | 'disconnected'
  | 'error';

interface SuccessScreenProps {
  cart: CartItem[];
  createdOrders: OrderCreateResponse[];
  orderStatusById: Record<string, OrderStatusEvent>;
  statusConnectionState: StatusConnectionState;
  statusConnectionMessage: string | null;
  onRetryStatus: () => void;
  onAddMore: () => void;
  onPay: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  IN_QUEUE: 'text-status-queue border-status-queue-border bg-status-queue-surface',
  PROCESSING: 'text-primary border-primary/30 bg-primary/5',
  DONE: 'text-status-done border-status-done-border bg-status-done-surface',
};

const CONNECTION_LABELS: Record<StatusConnectionState, string> = {
  idle: 'Idle',
  connecting: 'Connecting',
  connected: 'Connected',
  completed: 'Completed',
  disconnected: 'Disconnected',
  error: 'Error',
};

export default function SuccessScreen({
  cart,
  createdOrders,
  orderStatusById,
  statusConnectionState,
  statusConnectionMessage,
  onRetryStatus,
  onAddMore,
  onPay,
}: SuccessScreenProps) {
  const itemNameById = Object.fromEntries(cart.map(item => [item.id, item.name]));
  const canRetryStatus = statusConnectionState === 'disconnected' || statusConnectionState === 'error';

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
        {statusConnectionMessage && (
          <div className="w-full max-w-[360px] mb-8 border border-error-border bg-error-surface p-4 text-left">
            <p className="meta-tag text-error mb-1">Live status issue</p>
            <p className="font-body text-xs text-error/90 mb-3">{statusConnectionMessage}</p>
            {canRetryStatus && (
              <button
                onClick={onRetryStatus}
                className="px-5 h-9 bg-primary text-background font-body font-bold text-[10px] uppercase tracking-widest rounded-full"
              >
                Retry status stream
              </button>
            )}
          </div>
        )}

        {/* Order Summary Summary */}
        <div className="w-full max-w-[360px] border border-border-subtle p-8 transition-all hover:border-primary/20">
          <div className="flex justify-between items-center mb-6">
            <span className="meta-tag text-ink/30">Entries #{createdOrders.length}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 border rounded-full italic text-ink/70">
              {CONNECTION_LABELS[statusConnectionState]}
            </span>
          </div>
          {createdOrders.length === 0 ? (
            <p className="font-body text-sm text-ink/50">No created orders to track.</p>
          ) : (
            <ul className="space-y-4">
              {createdOrders.map(order => {
                const statusEvent = orderStatusById[order.id];
                const status = statusEvent?.status ?? 'IN_QUEUE';
                const statusStyle = STATUS_COLORS[status] ?? 'text-ink/70 border-border-subtle bg-surface';
                const itemName = itemNameById[order.item_id] ?? `Item ${order.item_id}`;

                return (
                  <li key={order.id} className="border border-border-subtle p-4">
                    <div className="flex justify-between items-baseline gap-3 mb-2">
                      <span className="font-display text-lg text-ink italic">{itemName}</span>
                      <span className="text-primary text-xs non-italic">x{order.amount}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-body text-[10px] uppercase tracking-wider text-ink/40">
                        Order {order.id.slice(0, 8)}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-1 border rounded-full ${statusStyle}`}>
                        {status}
                      </span>
                    </div>
                    <p className="font-body text-xs text-ink/55 mt-2">
                      {statusEvent?.description ?? 'Waiting for status update...'}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
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
