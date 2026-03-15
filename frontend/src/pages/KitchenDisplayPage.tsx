import { useCallback } from 'react';
import { OrderCard } from '../components/OrderCard';
import { usePolling } from '../hooks/usePolling';
import { fetchOrderQueue, updateOrderStatus } from '../services/api';
import type { OrderStatus } from '../types';

export function KitchenDisplayPage() {
  const queueFetcher = useCallback(() => fetchOrderQueue(), []);
  const { data: orders, loading, error, refresh } = usePolling(queueFetcher, 3000);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      refresh();
    } catch (e) {
      console.error('Failed to update order status', e);
    }
  };

  const pending = (orders ?? []).filter((o) => o.status === 'pending');
  const inProgress = (orders ?? []).filter((o) => o.status === 'in_progress');
  const ready = (orders ?? []).filter((o) => o.status === 'ready');

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, background: '#111', minHeight: '100vh', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>🖥️ Kitchen Display System</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
          <span style={{ color: '#f5a623' }}>⏳ Pending: {pending.length}</span>
          <span style={{ color: '#4a90e2' }}>🔥 In Progress: {inProgress.length}</span>
          <span style={{ color: '#1a7f37' }}>✅ Ready: {ready.length}</span>
        </div>
      </div>

      {loading && <p style={{ color: '#aaa' }}>Loading orders…</p>}
      {error && <p style={{ color: '#e74c3c' }}>Error: {error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {/* Pending column */}
        <div>
          <h2
            style={{
              background: '#f5a623',
              color: '#fff',
              margin: '0 0 12px',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 16,
            }}
          >
            ⏳ Pending ({pending.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                showActions
              />
            ))}
            {pending.length === 0 && (
              <p style={{ color: '#555', fontSize: 13 }}>No pending orders</p>
            )}
          </div>
        </div>

        {/* In Progress column */}
        <div>
          <h2
            style={{
              background: '#4a90e2',
              color: '#fff',
              margin: '0 0 12px',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 16,
            }}
          >
            🔥 In Progress ({inProgress.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inProgress.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                showActions
              />
            ))}
            {inProgress.length === 0 && (
              <p style={{ color: '#555', fontSize: 13 }}>No orders in progress</p>
            )}
          </div>
        </div>

        {/* Ready column */}
        <div>
          <h2
            style={{
              background: '#1a7f37',
              color: '#fff',
              margin: '0 0 12px',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 16,
            }}
          >
            ✅ Ready ({ready.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ready.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                showActions
              />
            ))}
            {ready.length === 0 && (
              <p style={{ color: '#555', fontSize: 13 }}>No orders ready</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
