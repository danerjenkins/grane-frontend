import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { getBakeDayById } from '../../api/admin/bakeDaysAdmin';
import {
  listBakeDayProductsByBakeDayId,
  createBakeDayProduct,
  updateBakeDayProduct,
  removeBakeDayProduct,
} from '../../api/admin/bakeDayProductsAdmin';
import { listProducts } from '../../api/admin/productsAdmin';
import type { BakeDay, BakeDayProductWithProduct, Product } from '../../api/admin/types';

function shortId(id: string) {
  return id.slice(0, 8);
}

function formatDate(dateString: string) {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface RowEditState {
  quantity_limit: string;
  quantity_sold: string;
  available: boolean;
}

export default function AdminBakeDayDetail() {
  const { bakeDayId } = useParams<{ bakeDayId: string }>();
  const navigate = useNavigate();

  const [bakeDay, setBakeDay] = useState<BakeDay | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [dayProducts, setDayProducts] = useState<BakeDayProductWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formProductId, setFormProductId] = useState('');
  const [formQuantityLimit, setFormQuantityLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const [rowEdits, setRowEdits] = useState<Record<string, RowEditState>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!bakeDayId) return;
    try {
      setLoading(true);
      setError(null);
      const [day, productsList, dayProductList] = await Promise.all([
        getBakeDayById(bakeDayId),
        listProducts(),
        listBakeDayProductsByBakeDayId(bakeDayId),
      ]);

      setBakeDay(day);
      setProducts(productsList);
      setDayProducts(dayProductList);
      setRowEdits(
        Object.fromEntries(
          dayProductList.map((dp) => [
            dp.id,
            {
              quantity_limit: dp.quantity_limit !== null ? dp.quantity_limit.toString() : '',
              quantity_sold: dp.quantity_sold !== null ? dp.quantity_sold.toString() : '0',
              available: dp.available ?? true,
            },
          ])
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bake day');
    } finally {
      setLoading(false);
    }
  }, [bakeDayId]);

  const refreshDayProducts = useCallback(async () => {
    if (!bakeDayId) return;
    try {
      const updated = await listBakeDayProductsByBakeDayId(bakeDayId);
      setDayProducts(updated);
      setRowEdits(
        Object.fromEntries(
          updated.map((dp) => [
            dp.id,
            {
              quantity_limit: dp.quantity_limit !== null ? dp.quantity_limit.toString() : '',
              quantity_sold: dp.quantity_sold !== null ? dp.quantity_sold.toString() : '0',
              available: dp.available ?? true,
            },
          ])
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh products');
    }
  }, [bakeDayId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableProductsForAdd = useMemo(() => {
    const existing = new Set(dayProducts.map((dp) => dp.product_id));
    return products.filter((p) => !existing.has(p.id));
  }, [products, dayProducts]);

  const filteredAvailableProductsForAdd = useMemo(() => {
    return availableProductsForAdd;
  }, [availableProductsForAdd]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bakeDayId) return;

    if (!formProductId) {
      setError('Select a product to add');
      return;
    }

    const parsedLimit = formQuantityLimit.trim() === '' ? null : Number(formQuantityLimit);
    if (parsedLimit !== null && (Number.isNaN(parsedLimit) || parsedLimit < 0)) {
      setError('Quantity limit must be a non-negative number');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createBakeDayProduct({
        bake_day_id: bakeDayId,
        product_id: formProductId,
        quantity_limit: parsedLimit,
        quantity_sold: 0,
        available: true,
      });
      setSuccess('Product added to bake day');
      setFormProductId('');
      setFormQuantityLimit('');
      await refreshDayProducts();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  const handleRowChange = (id: string, key: keyof RowEditState, value: string | boolean) => {
    setRowEdits((prev) => ({
      ...prev,
      [id]: {
        quantity_limit: key === 'quantity_limit' ? String(value) : (prev[id]?.quantity_limit ?? ''),
        quantity_sold: key === 'quantity_sold' ? String(value) : (prev[id]?.quantity_sold ?? '0'),
        available: key === 'available' ? Boolean(value) : (prev[id]?.available ?? true),
      },
    }));
  };

  const handleUpdateRow = async (rowId: string) => {
    const draft = rowEdits[rowId];
    if (!draft) return;

    const parsedLimit = draft.quantity_limit.trim() === '' ? null : Number(draft.quantity_limit);
    if (parsedLimit !== null && (Number.isNaN(parsedLimit) || parsedLimit < 0)) {
      setError('Quantity limit must be a non-negative number');
      return;
    }

    const parsedSold = draft.quantity_sold.trim() === '' ? 0 : Number(draft.quantity_sold);
    if (Number.isNaN(parsedSold) || parsedSold < 0) {
      setError('Sold must be a non-negative number');
      return;
    }

    try {
      setUpdatingId(rowId);
      setError(null);
      await updateBakeDayProduct(rowId, {
        quantity_limit: parsedLimit,
        quantity_sold: parsedSold,
        available: draft.available,
      });
      setSuccess('Entry updated');
      await refreshDayProducts();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm('Remove this product from the bake day?')) return;
    try {
      setDeletingId(rowId);
      setError(null);
      await removeBakeDayProduct(rowId);
      setSuccess('Entry removed');
      await refreshDayProducts();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <main className="bg-muted px-6 py-10">
        <div className="max-w-6xl mx-auto text-secondary">Loading bake day...</div>
      </main>
    );
  }

  if (!bakeDayId || !bakeDay) {
    return (
      <main className="bg-muted px-6 py-10">
        <div className="max-w-6xl mx-auto text-red-700">Bake day not found.</div>
      </main>
    );
  }

  return (
    <main className="bg-muted px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banners */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-900 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-secondary mb-1">Bake Day ID: {shortId(bakeDay.id)}</p>
            <h1 className="text-3xl font-bold text">Bake Day Inventory</h1>
            <p className="text-secondary">{formatDate(bakeDay.date)}</p>
          </div>
          <button
            onClick={() => navigate('/admin/bake-days')}
            className="self-start md:self-auto inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Bake Days
          </button>
        </div>

        {/* Inventory management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text">Assigned Products</h2>
                  <p className="text-sm text-secondary">
                    Adjust limits, sold counts, and availability for this bake day.
                  </p>
                </div>
              </div>
            </div>

            {dayProducts.length === 0 ? (
              <div className="p-6 text-secondary">No products assigned yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-100 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Limit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Sold
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {dayProducts.map((dp) => (
                      <tr key={dp.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text">
                            {dp.product?.name || 'Unnamed product'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            value={rowEdits[dp.id]?.quantity_limit ?? ''}
                            onChange={(e) =>
                              handleRowChange(dp.id, 'quantity_limit', e.target.value)
                            }
                            className="w-24 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary">
                          <input
                            type="number"
                            min="0"
                            value={rowEdits[dp.id]?.quantity_sold ?? '0'}
                            onChange={(e) =>
                              handleRowChange(dp.id, 'quantity_sold', e.target.value)
                            }
                            className="w-24 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap justify-center gap-2">
                            <button
                              onClick={() => handleUpdateRow(dp.id)}
                              disabled={updatingId === dp.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                updatingId === dp.id
                                  ? 'bg-brand-soft text-brand cursor-not-allowed'
                                  : 'bg-brand-strong hover:bg-brand text-white'
                              }`}
                              title={updatingId === dp.id ? 'Saving...' : 'Save changes'}
                            >
                              <Save size={14} />
                              <span className="sr-only">
                                {updatingId === dp.id ? 'Saving...' : 'Save'}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteRow(dp.id)}
                              disabled={deletingId === dp.id}
                              className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-md transition-colors ${
                                deletingId === dp.id
                                  ? 'bg-red-100 text-red-300 cursor-not-allowed'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-900'
                              }`}
                              title={deletingId === dp.id ? 'Removing...' : 'Remove product'}
                            >
                              <Trash2 size={14} />
                              <span className="sr-only">Remove product</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-neutral-200 p-6 space-y-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text">Add Product</h2>
                <p className="text-sm text-secondary">
                  Attach a product with an optional quantity limit.
                </p>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-1">Product</label>
                  <select
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong"
                  >
                    <option value="">Select a product</option>
                    {filteredAvailableProductsForAdd.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-1">
                    Quantity limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formQuantityLimit}
                    onChange={(e) => setFormQuantityLimit(e.target.value)}
                    placeholder="Leave blank for no limit"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong"
                  />
                  <p className="text-xs text-secondary mt-1">
                    Enter a cap or keep empty for unlimited.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full py-2 rounded-lg text-white font-medium transition-colors ${
                    saving ? 'bg-brand cursor-not-allowed' : 'bg-brand-strong hover:bg-brand'
                  }`}
                >
                  {saving ? 'Adding...' : 'Add to Bake Day'}
                </button>

                {filteredAvailableProductsForAdd.length === 0 && (
                  <p className="text-xs text-secondary">All products are already assigned.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
