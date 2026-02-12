/**
 * Customer Orders API
 *
 * Read-only API layer for authenticated customers to view their own orders.
 * Uses Supabase RLS: users can only access orders where user_id = auth.uid().
 */

import { supabase } from './supabaseClient';

export interface MyOrderRow {
  id: string;
  created_at: string;
  status: string | null;
  total_price: number | null;
  price_with_tax: number | null;
  stripe_status: string | null;
  order_items: MyOrderItem[] | null;
}

export interface MyOrderProduct {
  id: string;
  name: string;
  image_url: string | null;
  price: number | null;
  description: string | null;
}

export interface MyOrderItem {
  id: string;
  quantity: number;
  item_price: number | null;
  product: MyOrderProduct | null;
}

interface RawOrderItem extends Omit<MyOrderItem, 'product'> {
  product: MyOrderProduct | MyOrderProduct[] | null;
}

interface RawOrder extends Omit<MyOrderRow, 'order_items'> {
  order_items: RawOrderItem[] | null;
}

/**
 * Fetch orders for the current authenticated user.
 * Returns an empty array if no orders exist.
 */
export async function getMyOrders(): Promise<MyOrderRow[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      created_at,
      status,
      total_price,
      price_with_tax,
      stripe_status,
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
    .eq('user_id', authData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  const rawOrders = (data || []) as RawOrder[];

  return rawOrders.map((order) => ({
    ...order,
    order_items: Array.isArray(order.order_items)
      ? order.order_items.map((item) => ({
          ...item,
          product: Array.isArray(item.product) ? (item.product[0] ?? null) : item.product,
        }))
      : null,
  }));
}

export default {
  getMyOrders,
};
