import type { Order, OrderStatus } from '../types';

interface Props {
  order: Order;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  showActions?: boolean;
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#f5a623',
  in_progress: '#4a90e2',
  ready: '#1a7f37',
  delivered: '#888',
  cancelled: '#e74c3c',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  ready: '✅ Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'in_progress',
  in_progress: 'ready',
  ready: 'delivered',
};

export function OrderCard({ order, onStatusChange, showActions = false }: Props) {
  const totalPrice = order.items.reduce(
    (sum, i) => sum + i.unit_price * i.quantity,
    0
  );
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div
      style={{
        border: `2px solid ${STATUS_COLOR[order.status]}`,
        borderRadius: 8,
        padding: 16,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>Table {order.table_number}</strong>
        <span
          style={{
            background: STATUS_COLOR[order.status],
            color: '#fff',
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity}× {item.menu_item_name}
            {item.notes && <em style={{ color: '#888' }}> ({item.notes})</em>}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: '#888' }}>
          Priority: {order.priority_score.toFixed(1)}
        </span>
        <span style={{ fontWeight: 700 }}>Total: ${totalPrice.toFixed(2)}</span>
      </div>
      {showActions && nextStatus && onStatusChange && (
        <button
          onClick={() => onStatusChange(order.id, nextStatus)}
          style={{
            marginTop: 4,
            padding: '6px 0',
            background: STATUS_COLOR[nextStatus],
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Mark as {STATUS_LABEL[nextStatus]}
        </button>
      )}
    </div>
  );
}
