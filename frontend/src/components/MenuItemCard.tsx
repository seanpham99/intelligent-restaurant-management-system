import type { MenuItem as MenuItemType } from '../types';

interface Props {
  item: MenuItemType;
  onOrder: (item: MenuItemType) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  drink: '🥤',
  appetizer: '🥗',
  main: '🍽️',
  dessert: '🍰',
};

export function MenuItemCard({ item, onOrder }: Props) {
  const mins = Math.round(item.estimated_cook_time_seconds / 60);
  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: item.is_available ? 1 : 0.5,
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>
          {CATEGORY_EMOJI[item.category]} {item.name}
        </span>
        <span style={{ fontWeight: 700, color: '#1a7f37' }}>${item.price.toFixed(2)}</span>
      </div>
      {item.description && (
        <p style={{ margin: 0, fontSize: 13, color: '#555' }}>{item.description}</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#888' }}>~{mins} min</span>
        <button
          disabled={!item.is_available}
          onClick={() => onOrder(item)}
          style={{
            padding: '6px 16px',
            background: item.is_available ? '#1a7f37' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: item.is_available ? 'pointer' : 'not-allowed',
            fontWeight: 600,
          }}
        >
          {item.is_available ? 'Add to Order' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}
