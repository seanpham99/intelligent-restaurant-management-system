import type {
  MenuItem,
  Order,
  OrderCreate,
  Ingredient,
  InventoryAlert,
  OrderFlowAnalytics,
  InventorySummary,
  OrderStatus,
} from '../types';

const BASE_URL = '/api/v1';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Menu ────────────────────────────────────────────────────────────────────

export const fetchMenu = () => apiFetch<MenuItem[]>('/menu/');

// ── Orders ──────────────────────────────────────────────────────────────────

export const fetchOrders = (status?: OrderStatus) =>
  apiFetch<Order[]>(`/orders/${status ? `?order_status=${status}` : ''}`);

export const fetchOrderQueue = () => apiFetch<Order[]>('/orders/queue');

export const createOrder = (payload: OrderCreate) =>
  apiFetch<Order>('/orders/', { method: 'POST', body: JSON.stringify(payload) });

export const updateOrderStatus = (orderId: string, status: OrderStatus) =>
  apiFetch<Order>(`/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// ── Inventory ────────────────────────────────────────────────────────────────

export const fetchIngredients = () => apiFetch<Ingredient[]>('/inventory/ingredients');

export const fetchAlerts = (resolved?: boolean) =>
  apiFetch<InventoryAlert[]>(
    `/inventory/alerts${resolved !== undefined ? `?resolved=${resolved}` : ''}`
  );

export const resolveAlert = (alertId: string) =>
  apiFetch<InventoryAlert>(`/inventory/alerts/${alertId}/resolve`, { method: 'PATCH' });

// ── Analytics ────────────────────────────────────────────────────────────────

export const fetchOrderFlow = () => apiFetch<OrderFlowAnalytics>('/analytics/order-flow');

export const fetchKitchenLoad = () =>
  apiFetch<Record<string, number>>('/analytics/kitchen-load');

export const fetchInventorySummary = () =>
  apiFetch<InventorySummary>('/analytics/inventory-summary');
