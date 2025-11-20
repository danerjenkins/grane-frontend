export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  available: boolean;
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch('http://localhost:5000/api/products');

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`);
  }

  const data = await res.json();
  return data;
}

export async function getProductById(id: string) {
  const res = await fetch(`http://localhost:5000/api/products/${id}`);

  if (!res.ok) {
    console.error("Product lookup failed:", res.status, res.statusText);
    return null;
  }

  return res.json();
}

