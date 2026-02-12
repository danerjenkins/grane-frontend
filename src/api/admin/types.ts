/**
 * TypeScript types/interfaces matching the Supabase database schema.
 * Frontend shapes only - omit fields not needed in admin UI.
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  cost_to_make: number | null;
  image_url: string | null;
  description: string | null;
  available: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  created_at: string;
  status: string | null;
  total_price: number | null;
  price_with_tax: number | null;
  stripe_session_id: string | null;
  stripe_status: string | null;
  customer_note: string | null;
  bake_day_id: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  item_price: number | null;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { product?: Product })[] | null;
  user?: { id: string; name: string | null };
}

export interface UserRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role: string;
  created_at: string;
}

export interface BakeDay {
  id: string;
  date: string;
  is_published: boolean;
  announcement_sent_at: string | null;
}

export interface BakeDayProduct {
  id: string;
  bake_day_id: string;
  product_id: string;
  quantity_limit: number | null;
  quantity_sold: number | null;
  available: boolean | null;
}

export interface BakeDayProductWithProduct extends BakeDayProduct {
  product?: Product;
}
