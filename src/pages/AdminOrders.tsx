import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  listOrdersWithItems,
  getOrderWithItems,
} from '../api/admin/ordersAdmin';
import { listBakeDays } from '../api/admin/bakeDaysAdmin';
import type { BakeDay, OrderWithItems } from '../api/admin/types';

type SortDir = 'asc' | 'desc';
type DateFilter = '7d' | '30d' | 'all';

interface Filters {
  search: string;
  status: string;
  stripeStatus: string;
  bakeDayId: string;
  dateRange: DateFilter;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [bakeDays, setBakeDays] = useState<BakeDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    stripeStatus: 'all',
    bakeDayId: 'all',
    dateRange: 'all',
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [orderData, bakeDayData] = await Promise.all([
          listOrdersWithItems(),
          listBakeDays(),
        ]);
        if (!active) return;
        setOrders(orderData);
        setBakeDays(bakeDayData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();

    return orders
      .filter((order) => {
        // date filter
        if (filters.dateRange !== 'all') {
          const created = new Date(order.created_at);
          const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          if (filters.dateRange === '7d' && diffDays > 7) return false;
          if (filters.dateRange === '30d' && diffDays > 30) return false;
        }

        // status filter
        if (filters.status !== 'all' && order.status !== filters.status) return false;

        // stripe status filter
        if (filters.stripeStatus !== 'all' && order.stripe_status !== filters.stripeStatus) {
          return false;
        }

        // bake day filter
        if (filters.bakeDayId !== 'all' && order.bake_day_id !== filters.bakeDayId) return false;

        // search filter
        const q = filters.search.trim().toLowerCase();
        if (q) {
          const haystack = [
            order.id,
            order.stripe_session_id ?? '',
            order.customer_note ?? '',
            order.user?.name ?? '',
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return sortDir === 'desc' ? bDate - aDate : aDate - bDate;
      });
  }, [filters, orders, sortDir]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const pending = filtered.filter((o) => o.status === 'pending').length;
    const paid = filtered.filter((o) => o.stripe_status === 'paid').length;
    // Heuristic: needs attention if not paid OR missing bake day OR missing status
    const needsAttention = filtered.filter(
      (o) => o.stripe_status !== 'paid' || !o.bake_day_id || !o.status
    ).length;

    return { total, pending, paid, needsAttention };
  }, [filtered]);

  const toggleSort = () => setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));

  const openDetails = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailsLoading(true);
    try {
      const details = await getOrderWithItems(orderId);
      setSelectedOrder(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedOrderId(null);
    setSelectedOrder(null);
  };

  const formatMoney = (value: number | null | undefined) => {
    if (value == null) return '—';
    return `$${value.toFixed(2)}`;
  };

  const shortId = (id: string | null | undefined) => (id ? id.slice(0, 8) : '—');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  };

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Error banner */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold text-neutral-900">Orders</h1>
            <p className="text-neutral-600">Operational dashboard</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search by order id, stripe session, customer, note"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.stripeStatus}
              onChange={(e) => setFilters((f) => ({ ...f, stripeStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stripe statuses</option>
              <option value="paid">Paid</option>
              <option value="open">Open</option>
              <option value="unpaid">Unpaid</option>
              <option value="requires_payment">Requires payment</option>
            </select>

            <select
              value={filters.bakeDayId}
              onChange={(e) => setFilters((f) => ({ ...f, bakeDayId: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All bake days</option>
              {bakeDays.map((bd) => (
                <option key={bd.id} value={bd.id}>
                  {bd.date}
                </option>
              ))}
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters((f) => ({ ...f, dateRange: e.target.value as DateFilter }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Total" value={summary.total} />
          <SummaryCard label="Pending" value={summary.pending} />
          <SummaryCard label="Paid" value={summary.paid} />
          <SummaryCard label="Needs attention" value={summary.needsAttention} />
        </div>

        {/* Table */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-neutral-600">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">No orders match the filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-100 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer" onClick={toggleSort}>
                      Created {sortDir === 'desc' ? '↓' : '↑'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Bake Day
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Stripe
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-neutral-50 cursor-pointer"
                      onClick={() => openDetails(order.id)}
                    >
                      <td className="px-4 py-3 text-sm text-neutral-900">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-neutral-800">{shortId(order.id)}</td>
                      <td className="px-4 py-3 text-sm text-neutral-800">
                        {order.bake_day_id ?
                          bakeDays.find((b) => b.id === order.bake_day_id)?.date ?? shortId(order.bake_day_id) :
                          '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={order.status === 'completed' ? 'green' : order.status === 'pending' ? 'amber' : 'gray'}>
                          {order.status ?? '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={order.stripe_status === 'paid' ? 'green' : 'blue'}>
                          {order.stripe_status ?? '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900">
                        {formatMoney(order.price_with_tax ?? order.total_price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">
                        {order.customer_note ? <span className="text-blue-600 font-medium">Has note</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetails(order.id);
                          }}
                        >
                          View / Edit
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

      {/* Details Drawer */}
      {selectedOrderId && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          <div className="w-full max-w-xl h-full bg-white shadow-2xl border-l border-neutral-200 overflow-y-auto">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Order</p>
                <h2 className="text-2xl font-bold text-neutral-900">{selectedOrderId}</h2>
              </div>
              <button
                onClick={closeDetails}
                className="text-neutral-600 hover:text-neutral-900 px-3 py-1 rounded-lg hover:bg-neutral-100"
              >
                Close
              </button>
            </div>

            {detailsLoading ? (
              <div className="p-6 text-neutral-600">Loading details...</div>
            ) : selectedOrder ? (
              <div className="p-6 space-y-4">
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-500">Created</p>
                  <p className="text-lg font-semibold text-neutral-900">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-500">Total</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {formatMoney(selectedOrder.price_with_tax ?? selectedOrder.total_price)}
                  </p>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-500">Status</p>
                  <Badge tone={selectedOrder.status === 'completed' ? 'green' : 'amber'}>
                    {selectedOrder.status ?? '—'}
                  </Badge>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-500">Stripe</p>
                  <Badge tone={selectedOrder.stripe_status === 'paid' ? 'green' : 'blue'}>
                    {selectedOrder.stripe_status ?? '—'}
                  </Badge>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-500">Customer note</p>
                  <p className="text-neutral-800 whitespace-pre-wrap">
                    {selectedOrder.customer_note || '—'}
                  </p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-500 mb-2">Items</p>
                  <p className="text-neutral-600 text-sm">Details coming next step.</p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-neutral-600">Details coming next step.</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

function Badge({ tone, children }: { tone: 'green' | 'amber' | 'gray' | 'blue'; children: ReactNode }) {
  const toneClasses = {
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-800',
    gray: 'bg-neutral-200 text-neutral-800',
    blue: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
