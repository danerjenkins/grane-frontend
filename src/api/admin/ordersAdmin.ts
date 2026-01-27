import { supabase } from '../supabaseClient';
import type { Order, OrderWithItems } from './types';

/**
 * Orders CRUD operations
 */

export async function listOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list orders: ${error.message}`);
  }

  return data || [];
}

export async function getOrderById(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to get order: ${error.message}`);
  }

  if (!data) {
    throw new Error('Order not found');
  }

  return data;
}

export async function createOrder(
  payload: Omit<Order, 'id' | 'created_at'>
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  if (!data) {
    throw new Error('Order creation returned no data');
  }

  return data;
}

export async function updateOrder(
  id: string,
  patch: Partial<Omit<Order, 'id' | 'created_at'>>
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }

  if (!data) {
    throw new Error('Order update returned no data');
  }

  return data;
}

export async function removeOrder(id: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete order: ${error.message}`);
  }
}

/**
 * Get orders with their items and product details
 * TODO: Verify if Supabase can join orders -> order_items -> products in one query
 * Currently returns orders with nested order_items; products are joined inline if available.
 */
export async function listOrdersWithItems(): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      user_id,
      created_at,
      status,
      total_price,
      price_with_tax,
      stripe_session_id,
      stripe_status,
      customer_note,
      bake_day_id,
      order_items (
        id,
        order_id,
        product_id,
        quantity,
        item_price,
        product:products (
          id,
          name,
          price,
          cost_to_make,
          image_url,
          description,
          available
        )
      ),
      user:users (
        id,
        name
      )
      `
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list orders with items: ${error.message}`);
  }

  return (data || []) as unknown as OrderWithItems[];
}

export async function getOrderWithItems(id: string): Promise<OrderWithItems> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      user_id,
      created_at,
      status,
      total_price,
      price_with_tax,
      stripe_session_id,
      stripe_status,
      customer_note,
      bake_day_id,
      order_items (
        id,
        order_id,
        product_id,
        quantity,
        item_price,
        product:products (
          id,
          name,
          price,
          cost_to_make,
          image_url,
          description,
          available
        )
      ),
      user:users (
        id,
        name
      )
      `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to get order with items: ${error.message}`);
  }

  if (!data) {
    throw new Error('Order not found');
  }

  return data as unknown as OrderWithItems;
}

export default {
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  removeOrder,
  listOrdersWithItems,
  getOrderWithItems,
};
