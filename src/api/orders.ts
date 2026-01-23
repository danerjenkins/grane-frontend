import { supabase } from './supabaseClient';

export interface OrderProduct {
  id: string;
  name: string;
  image_url: string;
  price: number;
  description: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  item_price: number | null;
  product: OrderProduct | null;
}

export interface Order {
  id: string;
  created_at: string;
  bake_day_id?: string | null;
  bake_days: { date: string }[] | null;
  customer_note: string | null;
  total_price: number | null;
  price_with_tax?: number | null;
  stripe_status: string | null;
  status: string | null;
  stripe_session_id?: string | null;
  order_items: OrderItem[] | null;
  user?: { id: string; name: string | null };
}

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      created_at,
      bake_day_id,
      customer_note,
      total_price,
      price_with_tax,
      stripe_status,
      status,
      stripe_session_id,
      bake_days (date),
      user:users (
        id,
        name
      ),
      order_items (
        id,
        quantity,
        item_price,
        product:product_id (
          id,
          name,
          image_url,
          price,
          description
        )
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((order: any) => ({
    ...order,
    bake_days: order.bake_days ?? null,
    user: Array.isArray(order.user) ? order.user[0] ?? null : order.user ?? null,
    order_items: Array.isArray(order.order_items)
      ? order.order_items.map((item: any) => ({
          ...item,
          product: Array.isArray(item.product) ? item.product[0] ?? null : item.product ?? null,
        }))
      : null,
  }));
}

export async function markOrderCompleted(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
