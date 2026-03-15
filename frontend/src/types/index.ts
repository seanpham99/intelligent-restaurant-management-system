export type OrderStatus =
  | 'pending'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type MenuCategory = 'drink' | 'appetizer' | 'main' | 'dessert';

export type AlertType = 'low_stock' | 'temperature_breach';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  estimated_cook_time_seconds: number;
  is_available: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  category: MenuCategory;
  quantity: number;
  notes?: string;
  unit_price: number;
  estimated_cook_time_seconds: number;
}

export interface Order {
  id: string;
  table_number: number;
  status: OrderStatus;
  priority_score: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderCreate {
  table_number: number;
  items: { menu_item_id: string; quantity: number; notes?: string }[];
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export interface InventoryAlert {
  id: string;
  alert_type: AlertType;
  message: string;
  ingredient_id?: string;
  sensor_id?: string;
  resolved: boolean;
  created_at: string;
}

export interface OrderFlowAnalytics {
  total: number;
  by_status: Record<string, number>;
  pending: number;
  in_progress: number;
  ready: number;
  delivered: number;
  cancelled: number;
}

export interface InventorySummary {
  total_ingredients: number;
  low_stock_count: number;
  active_alerts: number;
  ingredients: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    low_stock: boolean;
  }[];
}
