import { useCallback } from 'react';
import { usePolling } from '../hooks/usePolling';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { InventoryAlertCard } from '../components/InventoryAlertCard';
import type { InventoryAlert } from '../types';
import {
  fetchOrderFlow,
  fetchKitchenLoad,
  fetchInventorySummary,
  fetchAlerts,
  resolveAlert,
} from '../services/api';

export function ManagerDashboardPage() {
  const orderFlowFetcher = useCallback(() => fetchOrderFlow(), []);
  const kitchenLoadFetcher = useCallback(() => fetchKitchenLoad(), []);
  const inventorySummaryFetcher = useCallback(() => fetchInventorySummary(), []);
  // Alerts use Supabase Realtime for instant push updates (new alert = manager
  // is notified immediately), with a 10s polling fallback for environments
  // where Supabase credentials are not configured.
  const alertsFetcher = useCallback(() => fetchAlerts(false), []);

  const { data: orderFlow } = usePolling(orderFlowFetcher, 5000);
  const { data: kitchenLoad } = usePolling(kitchenLoadFetcher, 5000);
  const { data: inventorySummary } = usePolling(inventorySummaryFetcher, 10000);
  const { data: alerts, refresh: refreshAlerts } = useRealtimeTable<InventoryAlert>(
    'inventory_alerts',
    alertsFetcher,
    10000
  );

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      refreshAlerts();
    } catch (e) {
      console.error('Failed to resolve alert', e);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 24 }}>📊 Manager Dashboard</h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Orders" value={orderFlow?.total ?? 0} color="#4a90e2" />
        <StatCard label="Pending" value={orderFlow?.pending ?? 0} color="#f5a623" />
        <StatCard label="In Progress" value={orderFlow?.in_progress ?? 0} color="#9b59b6" />
        <StatCard label="Ready" value={orderFlow?.ready ?? 0} color="#1a7f37" />
        <StatCard label="Delivered" value={orderFlow?.delivered ?? 0} color="#888" />
        <StatCard label="Active Alerts" value={inventorySummary?.active_alerts ?? 0} color="#e74c3c" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Kitchen load */}
        <Section title="🔥 Kitchen Station Load">
          {kitchenLoad && Object.keys(kitchenLoad).length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Station</th>
                  <th style={thStyle}>Active Items</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(kitchenLoad).map(([station, count]) => (
                  <tr key={station}>
                    <td style={tdStyle}>{station.charAt(0).toUpperCase() + station.slice(1)}</td>
                    <td style={tdStyle}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#888' }}>No active orders at any station.</p>
          )}
        </Section>

        {/* Inventory summary */}
        <Section title="📦 Inventory Summary">
          {inventorySummary ? (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <SmallStat label="Ingredients" value={inventorySummary.total_ingredients} />
                <SmallStat label="Low Stock" value={inventorySummary.low_stock_count} color="#f5a623" />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Ingredient</th>
                    <th style={thStyle}>Qty</th>
                    <th style={thStyle}>Unit</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventorySummary.ingredients.map((ing) => (
                    <tr key={ing.id} style={{ background: ing.low_stock ? '#fff3cd' : undefined }}>
                      <td style={tdStyle}>{ing.name}</td>
                      <td style={tdStyle}>{ing.quantity}</td>
                      <td style={tdStyle}>{ing.unit}</td>
                      <td style={tdStyle}>
                        {ing.low_stock ? (
                          <span style={{ color: '#f5a623', fontWeight: 700 }}>⚠ Low</span>
                        ) : (
                          <span style={{ color: '#1a7f37' }}>OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p style={{ color: '#888' }}>Loading inventory…</p>
          )}
        </Section>
      </div>

      {/* Alerts */}
      <Section title="🚨 Active Alerts" style={{ marginTop: 24 }}>
        {(alerts ?? []).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts!.map((alert) => (
              <InventoryAlertCard key={alert.id} alert={alert} onResolve={handleResolveAlert} />
            ))}
          </div>
        ) : (
          <p style={{ color: '#1a7f37' }}>✅ No active alerts.</p>
        )}
      </Section>
    </div>
  );
}

function StatCard({ label, value, color = '#333' }: { label: string; value: number; color?: string }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function SmallStat({ label, value, color = '#333' }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontSize: 22, fontWeight: 700, color }}>{value}</span>
      <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
    </div>
  );
}

function Section({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        ...style,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  borderBottom: '2px solid #eee',
  fontWeight: 600,
  fontSize: 13,
  color: '#555',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #f0f0f0',
};
