import { supabase } from '../supabaseClient';
import type { Product } from './types';

type ProductRow = Omit<Product, 'product_images'> & {
  product_images?: Product['product_images'] | null;
};

function normalizeProduct(product: ProductRow): Product {
  return {
    ...product,
    product_images: Array.isArray(product.product_images)
      ? [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)
      : [],
  };
}

/**
 * Products CRUD operations
 */

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        *,
        product_images (
          id,
          product_id,
          image_url,
          alt_text,
          sort_order
        )
      `
    )
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to list products: ${error.message}`);
  }

  return (data || []).map(normalizeProduct);
}

export async function getProductById(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        *,
        product_images (
          id,
          product_id,
          image_url,
          alt_text,
          sort_order
        )
      `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to get product: ${error.message}`);
  }

  if (!data) {
    throw new Error('Product not found');
  }

  return normalizeProduct(data);
}

export async function createProduct(payload: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  const { data, error } = await supabase.from('products').insert([payload]).select().single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  if (!data) {
    throw new Error('Product creation returned no data');
  }

  return data;
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, 'id'>>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  if (!data) {
    throw new Error('Product update returned no data');
  }

  return data;
}

export async function removeProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}

export default {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  removeProduct,
};
