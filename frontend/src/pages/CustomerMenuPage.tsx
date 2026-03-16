import { useState, useCallback } from 'react';
import { MenuItemCard } from '../components/MenuItemCard';
import { usePolling } from '../hooks/usePolling';
import { fetchMenu, createOrder } from '../services/api';
import type { MenuItem, MenuCategory } from '../types';

const CATEGORIES: { label: string; value: MenuCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: '🥤 Drinks', value: 'drink' },
  { label: '🥗 Appetizers', value: 'appetizer' },
  { label: '🍽️ Mains', value: 'main' },
  { label: '🍰 Desserts', value: 'dessert' },
];

export function CustomerMenuPage() {
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'all'>('all');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const menuFetcher = useCallback(() => fetchMenu(), []);
  const { data: menu, loading } = usePolling(menuFetcher, 30000);

  const filtered = (menu ?? []).filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setOrderError(null);
    try {
      await createOrder({
        table_number: tableNumber,
        items: cart.map((c) => ({ menu_item_id: c.item.id, quantity: c.quantity })),
      });
      setOrderPlaced(true);
      setCart([]);
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const cartTotal = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 4 }}>🍴 Restaurant Menu</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <label style={{ fontWeight: 600 }}>Table number:</label>
        <input
          type="number"
          min={1}
          value={tableNumber}
          onChange={(e) => setTableNumber(Number(e.target.value))}
          style={{ width: 60, padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4 }}
        />
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: '1px solid #ccc',
              background: activeCategory === cat.value ? '#1a7f37' : '#f5f5f5',
              color: activeCategory === cat.value ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: activeCategory === cat.value ? 700 : 400,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      {loading ? (
        <p>Loading menu…</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {filtered.map((item) => (
            <MenuItemCard key={item.id} item={item} onOrder={addToCart} />
          ))}
        </div>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: 16,
            background: '#f9f9f9',
          }}
        >
          <h3 style={{ marginTop: 0 }}>🛒 Your Order</h3>
          <ul style={{ paddingLeft: 18 }}>
            {cart.map((c) => (
              <li key={c.item.id} style={{ marginBottom: 6 }}>
                {c.quantity}× {c.item.name} — ${(c.item.price * c.quantity).toFixed(2)}
                <button
                  onClick={() => removeFromCart(c.item.id)}
                  style={{
                    marginLeft: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#e74c3c',
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Total: ${cartTotal.toFixed(2)}</strong>
            <button
              onClick={placeOrder}
              disabled={submitting}
              style={{
                padding: '10px 24px',
                background: '#1a7f37',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {submitting ? 'Placing…' : 'Place Order'}
            </button>
          </div>
          {orderError && <p style={{ color: '#e74c3c', marginTop: 8 }}>{orderError}</p>}
        </div>
      )}

      {orderPlaced && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: '#d4edda',
            borderRadius: 8,
            color: '#155724',
            fontWeight: 600,
          }}
        >
          ✅ Order placed successfully! Our kitchen team will prepare your meal shortly.
          <button
            onClick={() => setOrderPlaced(false)}
            style={{ marginLeft: 12, cursor: 'pointer', background: 'none', border: 'none', color: '#155724', fontWeight: 600 }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
