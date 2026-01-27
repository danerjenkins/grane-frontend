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
    .select('id, created_at, status, total_price, price_with_tax, stripe_status')
    .eq('user_id', authData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  return data || [];
}

export default {
  getMyOrders,
};
