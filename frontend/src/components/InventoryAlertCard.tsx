import type { InventoryAlert } from '../types';

interface Props {
  alert: InventoryAlert;
  onResolve?: (alertId: string) => void;
}

const ALERT_COLOR: Record<string, string> = {
  low_stock: '#f5a623',
  temperature_breach: '#e74c3c',
};

export function InventoryAlertCard({ alert, onResolve }: Props) {
  return (
    <div
      style={{
        border: `1px solid ${ALERT_COLOR[alert.alert_type] ?? '#ccc'}`,
        borderLeft: `5px solid ${ALERT_COLOR[alert.alert_type] ?? '#ccc'}`,
        borderRadius: 6,
        padding: '10px 14px',
        background: alert.resolved ? '#f9f9f9' : '#fffbe6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        opacity: alert.resolved ? 0.6 : 1,
      }}
    >
      <div>
        <span
          style={{
            fontWeight: 600,
            fontSize: 13,
            textTransform: 'uppercase',
            color: ALERT_COLOR[alert.alert_type] ?? '#333',
          }}
        >
          {alert.alert_type.replace('_', ' ')}
        </span>
        <p style={{ margin: '4px 0 0', fontSize: 13 }}>{alert.message}</p>
      </div>
      {!alert.resolved && onResolve && (
        <button
          onClick={() => onResolve(alert.id)}
          style={{
            padding: '4px 12px',
            background: '#1a7f37',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            whiteSpace: 'nowrap',
          }}
        >
          Resolve
        </button>
      )}
      {alert.resolved && (
        <span style={{ color: '#1a7f37', fontWeight: 600, fontSize: 12 }}>✔ Resolved</span>
      )}
    </div>
  );
}
