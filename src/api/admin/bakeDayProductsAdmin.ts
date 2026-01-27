import { supabase } from '../supabaseClient';
import type { BakeDayProduct, BakeDayProductWithProduct } from './types';

/**
 * Bake Day Products CRUD operations
 */

export async function listBakeDayProducts(): Promise<BakeDayProduct[]> {
  const { data, error } = await supabase
    .from('bake_day_products')
    .select('*')
    .order('bake_day_id', { ascending: false });

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied');

    if (isRLSError) {
      throw new Error(
        'Access denied: You may not have admin permissions for bake day products. Please check your account permissions.'
      );
    }
    throw new Error(`Failed to list bake day products: ${error.message}`);
  }

  return data || [];
}

export async function getBakeDayProductById(id: string): Promise<BakeDayProduct> {
  const { data, error } = await supabase
    .from('bake_day_products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to get bake day product: ${error.message}`);
  }

  if (!data) {
    throw new Error('Bake day product not found');
  }

  return data;
}

export async function createBakeDayProduct(
  payload: Omit<BakeDayProduct, 'id'>
): Promise<BakeDayProduct> {
  const { data, error } = await supabase
    .from('bake_day_products')
    .insert([payload])
    .select()
    .single();

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied') ||
      error.code === '42501';

    if (isRLSError) {
      throw new Error(
        'Access denied: You may not have admin permissions to create bake day products.'
      );
    }
    throw new Error(`Failed to create bake day product: ${error.message}`);
  }

  if (!data) {
    throw new Error('Bake day product creation returned no data');
  }

  return data;
}

export async function updateBakeDayProduct(
  id: string,
  patch: Partial<Omit<BakeDayProduct, 'id'>>
): Promise<BakeDayProduct> {
  const { data, error } = await supabase
    .from('bake_day_products')
    .update(patch)
    .eq('id', id)
    .select();

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied') ||
      error.code === '42501';

    if (isRLSError) {
      throw new Error(
        'Access denied: You may not have admin permissions to update bake day products.'
      );
    }

    // Handle "cannot coerce to single object" error which often indicates RLS blocking the update
    if (error.message?.toLowerCase().includes('cannot coerce')) {
      throw new Error(
        'Access denied: Unable to update this bake day product. Please check your admin permissions.'
      );
    }

    throw new Error(`Failed to update bake day product: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(
      'Bake day product not found or access denied. The update may have been blocked by permissions.'
    );
  }

  return data[0];
}

export async function removeBakeDayProduct(id: string): Promise<void> {
  const { error } = await supabase.from('bake_day_products').delete().eq('id', id);

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied') ||
      error.code === '42501';

    if (isRLSError) {
      throw new Error(
        'Access denied: You may not have admin permissions to delete bake day products.'
      );
    }
    throw new Error(`Failed to delete bake day product: ${error.message}`);
  }
}

/**
 * Get bake day products with product details
 */
export async function listBakeDayProductsWithProduct(): Promise<BakeDayProductWithProduct[]> {
  const { data, error } = await supabase
    .from('bake_day_products')
    .select(
      `
      id,
      bake_day_id,
      product_id,
      quantity_limit,
      quantity_sold,
      available,
      product:products (
        id,
        name,
        price,
        cost_to_make,
        image_url,
        description,
        available
      )
      `
    )
    .order('bake_day_id', { ascending: false });

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied');

    if (isRLSError) {
      throw new Error(
        'Access denied: You may not have admin permissions to view bake day products with product details.'
      );
    }
    throw new Error(`Failed to list bake day products with product: ${error.message}`);
  }

  return (data || []) as unknown as BakeDayProductWithProduct[];
}

/**
 * Get bake day products for a specific bake day with product details
 */
export async function listBakeDayProductsByBakeDayId(
  bakeDayId: string
): Promise<BakeDayProductWithProduct[]> {
  const { data, error } = await supabase
    .from('bake_day_products')
    .select(
      `
      id,
      bake_day_id,
      product_id,
      quantity_limit,
      quantity_sold,
      available,
      product:products (
        id,
        name,
        price,
        cost_to_make,
        image_url,
        description,
        available
      )
      `
    )
    .eq('bake_day_id', bakeDayId)
    .order('product_id', { ascending: true });

  if (error) {
    const isRLSError =
      error.message?.toLowerCase().includes('row-level security') ||
      error.code === 'PGRST301' ||
      error.message?.toLowerCase().includes('permission denied');

    if (isRLSError) {
      throw new Error(
        'Access denied: You may not have admin permissions to view products for this bake day.'
      );
    }
    throw new Error(`Failed to list bake day products: ${error.message}`);
  }

  return (data || []) as unknown as BakeDayProductWithProduct[];
}

export default {
  listBakeDayProducts,
  getBakeDayProductById,
  createBakeDayProduct,
  updateBakeDayProduct,
  removeBakeDayProduct,
  listBakeDayProductsWithProduct,
  listBakeDayProductsByBakeDayId,
};
