import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../api/products';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedBakeDay } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    getProductById(id)
      .then((data) => {
        if (!data) setError('Product not found.');
        setProduct(data);
      })
      .catch(() => setError('Failed to load product.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <main className="px-6 py-10 text-center">
        <p className="text-gray-600">Loading...</p>
      </main>
    );

  if (error)
    return (
      <main className="px-6 py-10 text-center">
        <p className="text-red-500">{error}</p>
      </main>
    );

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-4xl bg-white rounded-2xl shadow p-6 md:p-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-800 mb-6"
        >
          ← Back
        </button>

        {/* Content Layout */}
        <div className="grid md:grid-cols-2 gap-10">
          {/* Product Image */}
          <img
            src={product.image_url}
            alt={product.name}
            className="rounded-xl w-full h-80 object-cover shadow-sm"
          />

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-3">{product.name}</h1>

            <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

            <p className="text-2xl font-semibold text-neutral-900 mb-8">
              ${product.price.toFixed(2)}
            </p>

            {/* CTA */}
            <a
              href="/bake-days"
              className="inline-block bg-black text-white px-6 py-3 rounded-xl text-center font-medium hover:bg-neutral-800 transition w-full"
            >
              Order on Bake Days Page
            </a>

            <p className="text-xs text-gray-500 mt-3 text-center">
              {selectedBakeDay
                ? `Your selected bake day: ${selectedBakeDay}`
                : 'Choose a bake day to order.'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
