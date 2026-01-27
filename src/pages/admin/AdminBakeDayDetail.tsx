import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const [searchAssigned, setSearchAssigned] = useState('');

  const [formProductId, setFormProductId] = useState('');
  const [formQuantityLimit, setFormQuantityLimit] = useState('');
  const [searchAdd, setSearchAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);

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

  const availableActiveProductsForBulkAdd = useMemo(() => {
    return availableProductsForAdd.filter((p) => p.available);
  }, [availableProductsForAdd]);

  const filteredAvailableProductsForAdd = useMemo(() => {
    if (!searchAdd.trim()) return availableProductsForAdd;
    const query = searchAdd.toLowerCase();
    return availableProductsForAdd.filter((p) => p.name.toLowerCase().includes(query));
  }, [availableProductsForAdd, searchAdd]);

  const filteredDayProducts = useMemo(() => {
    if (!searchAssigned.trim()) return dayProducts;
    const query = searchAssigned.toLowerCase();
    return dayProducts.filter((dp) => dp.product?.name?.toLowerCase().includes(query));
  }, [dayProducts, searchAssigned]);

  const summary = useMemo(() => {
    const total = dayProducts.length;
    const availableCount = dayProducts.filter(
      (dp) => rowEdits[dp.id]?.available ?? dp.available ?? true
    ).length;
    const soldOut = total - availableCount;
    return { total, availableCount, soldOut };
  }, [dayProducts, rowEdits]);

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

  const handleBulkAddAvailable = async () => {
    if (!bakeDayId) return;
    const candidates = availableActiveProductsForBulkAdd;

    if (candidates.length === 0) {
      setSuccess('No available products to add');
      setTimeout(() => setSuccess(null), 2000);
      return;
    }

    const confirmMessage = `Add ${candidates.length} available product${
      candidates.length === 1 ? '' : 's'
    } to this bake day?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setBulkAdding(true);
      setError(null);
      let addedCount = 0;

      for (const product of candidates) {
        try {
          await createBakeDayProduct({
            bake_day_id: bakeDayId,
            product_id: product.id,
            quantity_limit: null,
            quantity_sold: 0,
            available: true,
          });
          addedCount += 1;
        } catch (innerErr) {
          const message =
            innerErr instanceof Error ? innerErr.message : 'Failed to add one of the products';
          throw new Error(message);
        }
      }

      await refreshDayProducts();
      setSuccess(`Added ${addedCount} product${addedCount === 1 ? '' : 's'}`);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk add failed');
    } finally {
      setBulkAdding(false);
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

  const handleMarkSoldOut = async (rowId: string) => {
    const draft = rowEdits[rowId];
    if (!draft) return;

    const parsedLimit = draft.quantity_limit.trim() === '' ? null : Number(draft.quantity_limit);
    const parsedSold = draft.quantity_sold.trim() === '' ? 0 : Number(draft.quantity_sold);

    if (parsedLimit !== null && (Number.isNaN(parsedLimit) || parsedLimit < 0)) {
      setError('Quantity limit must be a non-negative number');
      return;
    }

    if (Number.isNaN(parsedSold) || parsedSold < 0) {
      setError('Sold must be a non-negative number');
      return;
    }

    setRowEdits((prev) => ({
      ...prev,
      [rowId]: {
        quantity_limit: prev[rowId]?.quantity_limit ?? '',
        quantity_sold: prev[rowId]?.quantity_sold ?? '0',
        available: false,
      },
    }));

    try {
      setUpdatingId(rowId);
      setError(null);
      await updateBakeDayProduct(rowId, {
        quantity_limit: parsedLimit,
        quantity_sold: parsedSold,
        available: false,
      });
      setSuccess('Marked sold out');
      await refreshDayProducts();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark sold out');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetSold = async (rowId: string) => {
    if (!window.confirm('Reset sold to 0?')) return;
    const draft = rowEdits[rowId];
    if (!draft) return;

    const parsedLimit = draft.quantity_limit.trim() === '' ? null : Number(draft.quantity_limit);

    if (parsedLimit !== null && (Number.isNaN(parsedLimit) || parsedLimit < 0)) {
      setError('Quantity limit must be a non-negative number');
      return;
    }

    setRowEdits((prev) => ({
      ...prev,
      [rowId]: {
        quantity_limit: prev[rowId]?.quantity_limit ?? '',
        quantity_sold: '0',
        available: prev[rowId]?.available ?? true,
      },
    }));

    try {
      setUpdatingId(rowId);
      setError(null);
      await updateBakeDayProduct(rowId, {
        quantity_limit: parsedLimit,
        quantity_sold: 0,
        available: draft.available,
      });
      setSuccess('Sold reset to 0');
      await refreshDayProducts();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset sold');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10">
        <div className="max-w-6xl mx-auto text-neutral-700">Loading bake day...</div>
      </main>
    );
  }

  if (!bakeDayId || !bakeDay) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10">
        <div className="max-w-6xl mx-auto text-red-700">Bake day not found.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banners */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-600 mb-1">Bake Day ID: {shortId(bakeDay.id)}</p>
            <h1 className="text-3xl font-bold text-neutral-900">Bake Day Inventory</h1>
            <p className="text-neutral-700">{formatDate(bakeDay.date)}</p>
          </div>
          <button
            onClick={() => navigate('/admin/bake-days')}
            className="self-start md:self-auto bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Bake Days
          </button>
        </div>

        {/* Inventory management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Assigned Products</h2>
                  <p className="text-sm text-neutral-600">
                    Adjust limits, sold counts, and availability for this bake day.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full">
                    Total: {summary.total}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                    Available: {summary.availableCount}
                  </span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                    Sold out: {summary.soldOut}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search assigned products..."
                  value={searchAssigned}
                  onChange={(e) => setSearchAssigned(e.target.value)}
                  className="w-full md:w-72 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {filteredDayProducts.length === 0 ? (
              <div className="p-6 text-neutral-600">No products assigned yet.</div>
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredDayProducts.map((dp) => (
                      <tr key={dp.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-neutral-900">
                            {dp.product?.name || 'Unnamed product'}
                          </div>
                          <div className="text-xs text-neutral-500">{shortId(dp.product_id)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            value={rowEdits[dp.id]?.quantity_limit ?? ''}
                            onChange={(e) =>
                              handleRowChange(dp.id, 'quantity_limit', e.target.value)
                            }
                            className="w-24 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-700">
                          <input
                            type="number"
                            min="0"
                            value={rowEdits[dp.id]?.quantity_sold ?? '0'}
                            onChange={(e) =>
                              handleRowChange(dp.id, 'quantity_sold', e.target.value)
                            }
                            className="w-24 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <label className="inline-flex items-center space-x-2 text-sm text-neutral-800">
                            <input
                              type="checkbox"
                              checked={rowEdits[dp.id]?.available ?? true}
                              onChange={(e) =>
                                handleRowChange(dp.id, 'available', e.target.checked)
                              }
                              className="h-4 w-4 text-blue-600"
                            />
                            <span>{rowEdits[dp.id]?.available ? 'Yes' : 'No'}</span>
                          </label>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => handleUpdateRow(dp.id)}
                              disabled={updatingId === dp.id}
                              className={`text-blue-600 hover:text-blue-800 font-medium text-sm ${
                                updatingId === dp.id ? 'opacity-60 cursor-not-allowed' : ''
                              }`}
                            >
                              {updatingId === dp.id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => handleMarkSoldOut(dp.id)}
                              className="text-amber-700 hover:text-amber-900 font-medium text-sm"
                            >
                              Mark sold out
                            </button>
                            <button
                              onClick={() => handleResetSold(dp.id)}
                              className="text-neutral-700 hover:text-neutral-900 font-medium text-sm"
                            >
                              Reset sold
                            </button>
                            <button
                              onClick={() => handleDeleteRow(dp.id)}
                              disabled={deletingId === dp.id}
                              className={`text-red-600 hover:text-red-800 font-medium text-sm ${
                                deletingId === dp.id ? 'opacity-60 cursor-not-allowed' : ''
                              }`}
                            >
                              {deletingId === dp.id ? 'Removing...' : 'Delete'}
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

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 space-y-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Add Product</h2>
                <p className="text-sm text-neutral-600">
                  Attach a product with an optional quantity limit.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBulkAddAvailable}
                disabled={bulkAdding || availableActiveProductsForBulkAdd.length === 0}
                className={`w-full px-3 py-2 rounded-lg font-medium text-sm transition-colors border ${
                  bulkAdding || availableActiveProductsForBulkAdd.length === 0
                    ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {bulkAdding
                  ? 'Adding available products...'
                  : `Add all available products (${availableActiveProductsForBulkAdd.length})`}
              </button>

              <input
                type="text"
                placeholder="Search products to add..."
                value={searchAdd}
                onChange={(e) => setSearchAdd(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    Product
                  </label>
                  <select
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    Quantity limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formQuantityLimit}
                    onChange={(e) => setFormQuantityLimit(e.target.value)}
                    placeholder="Leave blank for no limit"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Enter a cap or keep empty for unlimited.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full py-2 rounded-lg text-white font-medium transition-colors ${
                    saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {saving ? 'Adding...' : 'Add to Bake Day'}
                </button>

                {filteredAvailableProductsForAdd.length === 0 && (
                  <p className="text-xs text-neutral-500">All products are already assigned.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
