import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductImage from '../components/ProductImage';
import { getProductById, type Product } from '../api/products';
import { useCart } from '../context/CartContext';
import { parseAppDate } from '../utils/dates';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedBakeDay } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const friendlySelectedBakeDay = selectedBakeDay
    ? (parseAppDate(selectedBakeDay.date)?.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) ?? selectedBakeDay.date)
    : null;

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

  const galleryImages = useMemo(
    () =>
      product
        ? [
            ...(product.image_url
              ? [
                  {
                    id: 'primary-image',
                    image_url: product.image_url,
                    alt_text: product.name,
                    sort_order: -1,
                  },
                ]
              : []),
            ...(product.product_images ?? []).filter(
              (image) => image.image_url !== product.image_url
            ),
          ]
        : [],
    [product]
  );

  useEffect(() => {
    if (!galleryImages.length) {
      setActiveImageUrl(null);
      return;
    }

    setActiveImageUrl((current) =>
      current && galleryImages.some((image) => image.image_url === current)
        ? current
        : galleryImages[0].image_url
    );
  }, [galleryImages]);

  if (loading) {
    return (
      <main className="px-6 py-10 text-center">
        <p className="text-secondary">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-6 py-10 text-center">
        <p className="banner banner-error inline-block">{error}</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="px-6 py-10 text-center">
        <p className="banner banner-error inline-block">Product not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted px-4 py-10">
      <div className="surface-card mx-auto max-w-4xl p-6 md:p-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-secondary transition hover:text-text"
        >
          Back
        </button>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <ProductImage
              imageUrl={activeImageUrl ?? product.image_url}
              alt={product.name}
              className="h-80 w-full rounded-xl object-cover shadow-sm"
              placeholderSize="large"
            />

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {galleryImages.map((image, index) => {
                  const isActive = image.image_url === activeImageUrl;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveImageUrl(image.image_url)}
                      className={`overflow-hidden rounded-xl border bg-surface transition ${
                        isActive
                          ? 'border-brand-strong ring-2 ring-brand-strong/25'
                          : 'border-border hover:border-brand'
                      }`}
                      aria-label={`View ${product.name} photo ${index + 1}`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text || `${product.name} photo ${index + 1}`}
                        className="h-20 w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h1 className="mb-3 text-3xl font-bold">{product.name}</h1>
            <p className="mb-6 leading-relaxed text-secondary">{product.description}</p>
            <p className="mb-8 text-2xl font-semibold text-text">${product.price.toFixed(2)}</p>

            <Link
              to="/bake-days"
              className="btn-neutral block w-full rounded-xl px-6 py-3 text-center"
            >
              Order on Bake Days Page
            </Link>

            <p className="mt-3 text-center text-xs text-secondary">
              {friendlySelectedBakeDay
                ? `Your selected bake day: ${friendlySelectedBakeDay}`
                : 'Choose a bake day to order.'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
