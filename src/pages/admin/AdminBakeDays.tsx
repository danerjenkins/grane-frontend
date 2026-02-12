import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2 } from 'lucide-react';
import {
  listBakeDays,
  createBakeDay,
  updateBakeDay,
  removeBakeDay,
} from '../../api/admin/bakeDaysAdmin';
import { listBakeDayProductsByBakeDayId } from '../../api/admin/bakeDayProductsAdmin';
import type { BakeDay, BakeDayProductWithProduct } from '../../api/admin/types';

type ModalMode = 'create' | 'edit' | null;
type BakeDayStatus = 'Draft' | 'Published' | 'Announced';

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

function getStatus(day: BakeDay): BakeDayStatus {
  if (day.announcement_sent_at) return 'Announced';
  if (day.is_published) return 'Published';
  return 'Draft';
}

function getStatusStyles(status: BakeDayStatus) {
  if (status === 'Announced') {
    return 'bg-green-50 text-green-800 border border-green-200';
  }

  if (status === 'Published') {
    return 'bg-brand-soft text-brand-strong border border-brand';
  }

  return 'bg-muted text-secondary border border-neutral-200';
}

export default function AdminBakeDays() {
  const [bakeDays, setBakeDays] = useState<BakeDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingBakeDay, setEditingBakeDay] = useState<BakeDay | null>(null);
  const [formDate, setFormDate] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [upcomingProducts, setUpcomingProducts] = useState<BakeDayProductWithProduct[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishingBakeDay, setPublishingBakeDay] = useState<BakeDay | null>(null);
  const [publishModalLoadingProducts, setPublishModalLoadingProducts] = useState(false);
  const [publishModalProductCount, setPublishModalProductCount] = useState<number | null>(null);
  const [publishSaving, setPublishSaving] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadBakeDays();
  }, []);

  const sortedBakeDays = useMemo(() => {
    return [...bakeDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bakeDays]);

  const upcomingBakeDay = useMemo(() => {
    if (bakeDays.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = [...bakeDays]
      .filter((day) => new Date(day.date).getTime() >= today.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] ?? null;
  }, [bakeDays]);

  useEffect(() => {
    let active = true;

    const loadUpcomingProducts = async () => {
      if (!upcomingBakeDay) {
        setUpcomingProducts([]);
        setUpcomingError(null);
        return;
      }

      try {
        setUpcomingLoading(true);
        setUpcomingError(null);
        const data = await listBakeDayProductsByBakeDayId(upcomingBakeDay.id);
        if (!active) return;
        setUpcomingProducts(data);
      } catch (err) {
        if (!active) return;
        setUpcomingError(
          err instanceof Error ? err.message : 'Failed to load upcoming bake day products'
        );
      } finally {
        if (active) setUpcomingLoading(false);
      }
    };

    loadUpcomingProducts();
    return () => {
      active = false;
    };
  }, [upcomingBakeDay?.id]);

  const loadBakeDays = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listBakeDays();
      setBakeDays(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bake days');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingBakeDay(null);
    setFormDate('');
    setModalError(null);
  };

  const openEditModal = (day: BakeDay) => {
    setModalMode('edit');
    setEditingBakeDay(day);
    setFormDate(day.date.split('T')[0] || day.date);
    setModalError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingBakeDay(null);
    setFormDate('');
    setModalError(null);
  };

  const openPublishModal = async (day: BakeDay) => {
    setPublishingBakeDay(day);
    setPublishModalOpen(true);
    setPublishModalLoadingProducts(true);
    setPublishModalProductCount(null);
    setPublishError(null);

    try {
      const products = await listBakeDayProductsByBakeDayId(day.id);
      const availableCount = products.filter((item) => item.available).length;
      setPublishModalProductCount(availableCount);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Failed to load bake day products');
      setPublishModalProductCount(0);
    } finally {
      setPublishModalLoadingProducts(false);
    }
  };

  const closePublishModal = () => {
    setPublishModalOpen(false);
    setPublishingBakeDay(null);
    setPublishModalLoadingProducts(false);
    setPublishModalProductCount(null);
    setPublishSaving(false);
    setPublishError(null);
  };

  const handlePublish = async () => {
    if (!publishingBakeDay) return;
    if (publishModalProductCount !== null && publishModalProductCount === 0) return;

    try {
      setPublishSaving(true);
      await updateBakeDay(publishingBakeDay.id, { is_published: true });
      setSuccess('Bake day published — announcement sending now.');
      await loadBakeDays();
      closePublishModal();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Failed to publish bake day');
    } finally {
      setPublishSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formDate) {
      setModalError('Date is required');
      return;
    }

    try {
      setSaving(true);

      if (modalMode === 'create') {
        await createBakeDay({ date: formDate });
        setSuccess('Bake day created');
      } else if (modalMode === 'edit' && editingBakeDay) {
        await updateBakeDay(editingBakeDay.id, { date: formDate });
        setSuccess('Bake day updated');
      }

      await loadBakeDays();
      closeModal();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this bake day? This cannot be undone.')) return;

    try {
      setDeleteLoadingId(id);
      await removeBakeDay(id);
      setSuccess('Bake day deleted');
      await loadBakeDays();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Banners */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-900 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold text-text">Bake Days</h1>
          <button
            onClick={openCreateModal}
            className="bg-brand-strong hover:bg-brand text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            New Bake Day
          </button>
        </div>

        {/* Upcoming Bake Day */}
        <div className="bg-surface rounded-lg shadow-sm border border-neutral-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-neutral-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-secondary">Upcoming Bake Day</p>
              <h2 className="text-2xl font-bold text mt-1">
                {upcomingBakeDay ? formatDate(upcomingBakeDay.date) : 'No upcoming bake days'}
              </h2>
              {upcomingBakeDay && (
                <p className="text-sm text-secondary mt-1">ID: {shortId(upcomingBakeDay.id)}</p>
              )}
            </div>
            {upcomingBakeDay && (
              <button
                onClick={() => navigate(`/admin/bake-days/${upcomingBakeDay.id}`)}
                className="bg-brand-strong hover:bg-brand text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Manage Products
              </button>
            )}
          </div>

          <div className="p-6">
            {upcomingError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg">
                {upcomingError}
              </div>
            )}

            {!upcomingBakeDay ? (
              <div className="text-sm text-secondary">
                Add a bake day to start scheduling products.
              </div>
            ) : upcomingLoading ? (
              <div className="text-sm text-secondary">Loading upcoming products...</div>
            ) : upcomingProducts.length === 0 ? (
              <div className="text-sm text-secondary">
                No products assigned yet. Use “Manage Products” to add items for this bake day.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <Calendar size={16} />
                    <span>{upcomingProducts.length} product(s) to bake</span>
                  </div>
                  <p className="text-xs text-secondary">
                    Quantities reflect the limits set for this bake day.
                  </p>
                </div>
                <div className="space-y-2">
                  {upcomingProducts.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-muted px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text">
                          {item.product?.name ?? 'Unnamed product'}
                        </p>
                        {item.available === false && (
                          <p className="text-xs text-red-700">Unavailable</p>
                        )}
                      </div>
                      <div className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand-strong">
                        {item.quantity_limit ?? 'No limit'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-secondary">Loading bake days...</div>
          ) : sortedBakeDays.length === 0 ? (
            <div className="p-8 text-center text-secondary">No bake days yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {sortedBakeDays.map((day) => (
                    <tr key={day.id} className="hover:bg-muted">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text">{formatDate(day.date)}</div>
                        <div className="text-xs text-secondary">{day.date}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary">{shortId(day.id)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(
                            getStatus(day)
                          )}`}
                        >
                          {getStatus(day)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/bake-days/${day.id}`)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted text-secondary hover:text-text rounded-md transition-colors text-sm font-medium"
                          >
                            Manage Products
                          </button>
                          <button
                            onClick={() => openEditModal(day)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-muted hover:bg-muted text-secondary hover:text-text rounded-md transition-colors"
                            title="Edit bake day date"
                          >
                            <Calendar size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(day.id)}
                            disabled={deleteLoadingId === day.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                              deleteLoadingId === day.id
                                ? 'bg-red-100 text-red-300 cursor-not-allowed'
                                : 'bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-900'
                            }`}
                            title={deleteLoadingId === day.id ? 'Deleting...' : 'Delete bake day'}
                          >
                            <Trash2 size={16} />
                          </button>
                          {!day.is_published && (
                            <button
                              onClick={() => openPublishModal(day)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-strong hover:bg-brand text-white rounded-md transition-colors text-sm font-medium"
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalMode && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-2xl font-bold text">
                {modalMode === 'create' ? 'New Bake Day' : 'Edit Bake Day'}
              </h2>
              <p className="text-sm text-secondary mt-1">
                Bake days drive inventory availability for orders.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg">
                  {modalError}
                </div>
              )}

              <div>
                <label
                  htmlFor="bake-date"
                  className="block text-sm font-semibold text-secondary mb-1"
                >
                  Date
                </label>
                <input
                  id="bake-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-neutral-300 text-secondary hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    saving ? 'bg-neutral-400 cursor-not-allowed' : 'bg-text hover:bg-secondary'
                  }`}
                >
                  {saving ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {publishModalOpen && publishingBakeDay && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePublishModal();
          }}
        >
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-2xl font-bold text">Publish Bake Day?</h2>
              <p className="text-sm text-secondary mt-1">
                This will email subscribers who opted into Bake Day alerts.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {publishError && (
                <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg">
                  {publishError}
                </div>
              )}

              <div className="text-sm text-secondary">
                Date: {formatDate(publishingBakeDay.date)}
              </div>

              {publishModalLoadingProducts ? (
                <div className="text-sm text-secondary">Checking available products...</div>
              ) : publishModalProductCount === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-lg">
                  Add at least one available product before publishing.
                </div>
              ) : (
                <div className="text-sm text-secondary">
                  {publishModalProductCount} available product(s) found.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={closePublishModal}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-secondary hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={
                  publishSaving || publishModalLoadingProducts || publishModalProductCount === 0
                }
                className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  publishSaving || publishModalLoadingProducts || publishModalProductCount === 0
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-brand-strong hover:bg-brand'
                }`}
              >
                {publishSaving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
