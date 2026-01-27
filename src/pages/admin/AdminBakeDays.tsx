import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listBakeDays,
  createBakeDay,
  updateBakeDay,
  removeBakeDay,
} from '../../api/admin/bakeDaysAdmin';
import type { BakeDay } from '../../api/admin/types';

type ModalMode = 'create' | 'edit' | null;

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
  const navigate = useNavigate();

  useEffect(() => {
    loadBakeDays();
  }, []);

  const sortedBakeDays = useMemo(() => {
    return [...bakeDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bakeDays]);

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
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Banners */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold text-neutral-900">Bake Days</h1>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            New Bake Day
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-neutral-600">Loading bake days...</div>
          ) : sortedBakeDays.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">No bake days yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-100 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {sortedBakeDays.map((day) => (
                    <tr key={day.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {formatDate(day.date)}
                        </div>
                        <div className="text-xs text-neutral-500">{day.date}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700">{shortId(day.id)}</td>
                      <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/admin/bake-days/${day.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Manage Products
                        </button>
                        <button
                          onClick={() => openEditModal(day)}
                          className="text-neutral-700 hover:text-neutral-900 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(day.id)}
                          disabled={deleteLoadingId === day.id}
                          className={`font-medium text-sm ${
                            deleteLoadingId === day.id
                              ? 'text-red-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-800'
                          }`}
                        >
                          {deleteLoadingId === day.id ? 'Deleting...' : 'Delete'}
                        </button>
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-2xl font-bold text-neutral-900">
                {modalMode === 'create' ? 'New Bake Day' : 'Edit Bake Day'}
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Bake days drive inventory availability for orders.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
                  {modalError}
                </div>
              )}

              <div>
                <label
                  htmlFor="bake-date"
                  className="block text-sm font-semibold text-neutral-700 mb-1"
                >
                  Date
                </label>
                <input
                  id="bake-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {saving ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
