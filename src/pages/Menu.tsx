import { useEffect, useState } from 'react';
import { getProducts } from '../api/products';
import type { Product } from '../api/products'; // 👈 type-only import
import ProductImage from '../components/ProductImage';

export default function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(data))
      .catch((error) => console.error('Error fetching products:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center bg-neutral-50 px-4 py-10 text-center">
      <h1 className="text-4xl font-bold mb-8">Our Menu</h1>

      {loading ? (
        <p className="text-lg text-gray-600">Loading products...</p>
      ) : (
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md p-4 max-w-xs">
              <ProductImage
                imageUrl={product.image_url}
                alt={product.name}
                className="w-full h-48 object-cover rounded-md mb-4"
                placeholderSize="medium"
              />
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-gray-600 mb-2">{product.description}</p>
              <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
