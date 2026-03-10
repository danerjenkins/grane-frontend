import { supabase } from './supabaseClient';

export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
}

export interface BakeDayProduct {
  id: string;
  quantity_limit: number;
  quantity_sold: number;
  available: boolean;
  product: Product;
}

export interface BakeDay {
  id: string;
  date: string;
  is_published: boolean;
  bake_day_products: BakeDayProduct[];
}

export async function getBakeDays(): Promise<BakeDay[]> {
  const { data, error } = await supabase
    .from('bake_days')
    .select(
      `
      id,
      date,
      is_published,
      bake_day_products (
        id,
        quantity_limit,
        quantity_sold,
        available,
        product:product_id (
          id,
          name,
          price,
          image_url,
          description
        )
      )
    `
    )
    .eq('is_published', true)
    .order('date', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((day: any) => ({
    ...day,
    bake_day_products: Array.isArray(day.bake_day_products)
      ? day.bake_day_products.map((p: any) => ({
          ...p,
          product: Array.isArray(p.product) ? (p.product[0] ?? null) : p.product,
        }))
      : [],
  }));
}
