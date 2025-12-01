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
  bake_day_products: BakeDayProduct[];
}

export async function getBakeDays(): Promise<BakeDay[]> {
  // TEMP: Simulate slow server for testing
  const res = await fetch(`${import.meta.env.VITE_API_URL}/bake-days`);
  if (!res.ok) {
    throw new Error(`Failed to fetch bake days: ${res.statusText}`);
  }
  return await res.json();
}
