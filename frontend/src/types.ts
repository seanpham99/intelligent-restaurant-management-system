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
  image?: string;
  popular?: boolean;
  soldOut?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type Screen = 'Welcome' | 'Menu' | 'Confirmation' | 'Success' | 'Payment';
