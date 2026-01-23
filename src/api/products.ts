import { supabase } from './supabaseClient';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  available: boolean;
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*');

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();

  if (error) {
    console.error('Product lookup failed:', error);
    return null;
  }

  return data;
}
