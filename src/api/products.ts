import { supabase } from './supabaseClient';

export interface ProductGalleryImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string | null;
  available: boolean;
  product_images?: ProductGalleryImage[];
}

type ProductRow = Omit<Product, 'product_images'> & {
  product_images?: ProductGalleryImage[] | null;
};

function normalizeProduct(product: ProductRow): Product {
  return {
    ...product,
    product_images: Array.isArray(product.product_images)
      ? [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)
      : [],
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*');

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizeProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        *,
        product_images (
          id,
          image_url,
          alt_text,
          sort_order
        )
      `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Product lookup failed:', error);
    return null;
  }

  return data ? normalizeProduct(data) : null;
}
