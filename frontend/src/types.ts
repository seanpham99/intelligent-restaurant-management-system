/**
 * Types for The Culinary Editor
 */

export type Category = 'Appetizers' | 'Main Course' | 'Drinks' | 'Desserts';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: Category;
  imageUrl?: string;
  image?: string;
  popular?: boolean;
  soldOut?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface OrderCreateInput {
  item_id: string;
  table_id: number;
  amount: number;
}

export interface OrderCreateResponse {
  id: string;
  item_id: string;
  table_id: number;
  amount: number;
}

export type OrderStatus = 'IN_QUEUE' | 'PROCESSING' | 'DONE';

export interface OrderStatusEvent {
  order_id: string;
  status: OrderStatus;
  description: string;
}

/**
 * Single-order websocket subscription payload for /order/status.
 */
export interface OrderStatusSubscription {
  order_id: string;
}

export type Screen = 'Welcome' | 'Menu' | 'Confirmation' | 'Success' | 'Payment';
