import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  listOrdersWithItems,
  getOrderWithItems,
  updateOrder,
  createOrderItem,
  updateOrderItem,
  removeOrderItem,
  deleteOrderWithItems,
} from '../../api/admin/ordersAdmin';
import { listBakeDays } from '../../api/admin/bakeDaysAdmin';
import { listProducts } from '../../api/admin/productsAdmin';
import type { BakeDay, OrderItem, OrderWithItems, Product } from '../../api/admin/types';

type SortDir = 'asc' | 'desc';
type DateFilter = '7d' | '30d' | 'all';

interface Filters {
  search: string;
  status: string;
  stripeStatus: string;
  bakeDayId: string;
  dateRange: DateFilter;
}

interface OrderForm {
  status: string;
  stripe_status: string;
  customer_note: string;
  bake_day_id: string;
  total_price: string;
  price_with_tax: string;
  stripe_session_id: string;
  stripeUnlocked: boolean;
}

interface ItemForm {
  product_id: string;
  quantity: string;
  item_price: string;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [orderForm, setOrderForm] = useState<OrderForm>({
    status: '',
    stripe_status: '',
    customer_note: '',
    bake_day_id: '',
    total_price: '',
    price_with_tax: '',
    stripe_session_id: '',
    stripeUnlocked: false,
  });
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [itemModalMode, setItemModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>({
    product_id: '',
    quantity: '1',
    item_price: '',
  });
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [deleteAck, setDeleteAck] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingStatusOrderId, setEditingStatusOrderId] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];
  const stripeStatusOptions = [
    'pending',
    'paid',
    'unpaid',
    'failed',
    'succeeded',
    'no_payment_required',
  ];

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [orderData, bakeDayData] = await Promise.all([listOrdersWithItems(), listBakeDays()]);
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

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        const data = await listProducts();
        if (!active) return;
        setProducts(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load products');
      }
    };

    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedOrder) return;

    setOrderSuccess(null);
    setOrderForm({
      status: selectedOrder.status ?? '',
      stripe_status: selectedOrder.stripe_status ?? '',
      customer_note: selectedOrder.customer_note ?? '',
      bake_day_id: selectedOrder.bake_day_id ?? '',
      total_price: selectedOrder.total_price != null ? selectedOrder.total_price.toString() : '',
      price_with_tax:
        selectedOrder.price_with_tax != null ? selectedOrder.price_with_tax.toString() : '',
      stripe_session_id: selectedOrder.stripe_session_id ?? '',
      stripeUnlocked: false,
    });
  }, [selectedOrder]);

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
    setDeleteAck(false);
    setDeleteInput('');
    setDeleteLoading(false);
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

  const parseNullableNumber = (value: string) => {
    if (value.trim() === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const refreshOrderDetails = async (orderId: string) => {
    const fresh = await getOrderWithItems(orderId);
    setSelectedOrder(fresh);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...fresh } : o)));
  };

  const refreshOrdersList = async () => {
    try {
      const data = await listOrdersWithItems();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh orders');
    }
  };

  const isOrderDirty = useMemo(() => {
    if (!selectedOrder) return false;

    const fields: Array<keyof OrderForm> = [
      'status',
      'stripe_status',
      'customer_note',
      'bake_day_id',
      'total_price',
      'price_with_tax',
      'stripe_session_id',
    ];

    return fields.some((field) => {
      if (field === 'stripe_session_id' && !orderForm.stripeUnlocked) return false;

      const current = orderForm[field] ?? '';
      const originalValue = (() => {
        switch (field) {
          case 'total_price':
            return selectedOrder.total_price != null ? selectedOrder.total_price.toString() : '';
          case 'price_with_tax':
            return selectedOrder.price_with_tax != null
              ? selectedOrder.price_with_tax.toString()
              : '';
          case 'bake_day_id':
            return selectedOrder.bake_day_id ?? '';
          case 'customer_note':
            return selectedOrder.customer_note ?? '';
          case 'stripe_session_id':
            return selectedOrder.stripe_session_id ?? '';
          case 'status':
            return selectedOrder.status ?? '';
          case 'stripe_status':
            return selectedOrder.stripe_status ?? '';
          default:
            return '';
        }
      })();

      return current !== (originalValue ?? '');
    });
  }, [orderForm, selectedOrder]);

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    setOrderSaving(true);
    setError(null);
    try {
      const payload = {
        status: orderForm.status.trim() || null,
        stripe_status: orderForm.stripe_status.trim() || null,
        customer_note: orderForm.customer_note.trim() || null,
        bake_day_id: orderForm.bake_day_id || null,
        total_price: parseNullableNumber(orderForm.total_price),
        price_with_tax: parseNullableNumber(orderForm.price_with_tax),
        stripe_session_id: orderForm.stripeUnlocked
          ? orderForm.stripe_session_id.trim() || null
          : (selectedOrder.stripe_session_id ?? null),
      };

      const updated = await updateOrder(selectedOrder.id, payload);
      setOrderSuccess('Saved changes');
      setTimeout(() => setOrderSuccess(null), 2500);
      // Keep list in sync
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
      // Refresh details to pick up nested relations
      await refreshOrderDetails(selectedOrder.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
    } finally {
      setOrderSaving(false);
    }
  };

  const openAddItem = () => {
    setItemError(null);
    setEditingItem(null);
    setItemForm({
      product_id: products[0]?.id ?? '',
      quantity: '1',
      item_price: products[0]?.price != null ? products[0].price.toString() : '',
    });
    setItemModalMode('add');
  };

  const openEditItem = (item: OrderItem) => {
    setItemError(null);
    setEditingItem(item);
    setItemForm({
      product_id: item.product_id,
      quantity: item.quantity.toString(),
      item_price: item.item_price != null ? item.item_price.toString() : '',
    });
    setItemModalMode('edit');
  };

  const closeItemModal = () => {
    setItemModalMode(null);
    setEditingItem(null);
  };

  const handleSaveItem = async () => {
    if (!selectedOrder) return;
    if (!itemForm.product_id) {
      setItemError('Product is required');
      return;
    }
    const quantity = parseInt(itemForm.quantity, 10);
    const itemPrice = parseNullableNumber(itemForm.item_price);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setItemError('Quantity must be greater than 0');
      return;
    }

    setItemSaving(true);
    setItemError(null);
    try {
      if (itemModalMode === 'add') {
        await createOrderItem({
          order_id: selectedOrder.id,
          product_id: itemForm.product_id,
          quantity,
          item_price: itemPrice,
        });
      } else if (itemModalMode === 'edit' && editingItem) {
        await updateOrderItem(editingItem.id, {
          product_id: itemForm.product_id,
          quantity,
          item_price: itemPrice,
        });
      }

      await refreshOrderDetails(selectedOrder.id);
      closeItemModal();
    } catch (err) {
      setItemError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setItemSaving(false);
    }
  };

  const handleDeleteItem = async (item: OrderItem) => {
    if (!selectedOrder) return;
    const confirm = window.confirm('Delete this item?');
    if (!confirm) return;
    try {
      await removeOrderItem(item.id);
      await refreshOrderDetails(selectedOrder.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const paidLike = (selectedOrder?.stripe_status || '').toLowerCase();
  const requiresFullId = ['paid', 'succeeded', 'complete'].some((token) =>
    paidLike.includes(token)
  );
  const requiredDeleteToken = selectedOrder
    ? requiresFullId
      ? selectedOrder.id
      : shortId(selectedOrder.id)
    : '';

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    if (!deleteAck || deleteInput.trim() !== requiredDeleteToken) return;
    const confirm = window.confirm('Delete this order permanently?');
    if (!confirm) return;

    setDeleteLoading(true);
    setError(null);
    try {
      await deleteOrderWithItems(selectedOrder.id);
      closeDetails();
      await refreshOrdersList();
      setPageSuccess('Order deleted.');
      setTimeout(() => setPageSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setStatusUpdateLoading(true);
    try {
      await updateOrder(orderId, { status: newStatus });
      // Update orders list
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      setEditingStatusOrderId(null);
      setPageSuccess('Status updated successfully!');
      setTimeout(() => setPageSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  return (
    <main className="bg-muted px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {pageSuccess && <div className="banner banner-success">{pageSuccess}</div>}

        {/* Error banner */}
        {error && <div className="banner banner-error">{error}</div>}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold text">Orders</h1>
            <p className="text-secondary">Operational dashboard</p>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search by order id, stripe session, customer, note"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="input-base px-3"
            />

            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="input-base px-3"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.stripeStatus}
              onChange={(e) => setFilters((f) => ({ ...f, stripeStatus: e.target.value }))}
              className="input-base px-3"
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
              className="input-base px-3"
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
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateRange: e.target.value as DateFilter }))
              }
              className="input-base px-3"
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
        <div className="table-shell">
          {loading ? (
            <div className="p-8 text-center text-secondary">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-secondary">No orders match the filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th
                      className="table-head-cell cursor-pointer px-4"
                      onClick={toggleSort}
                    >
                      Created {sortDir === 'desc' ? '↓' : '↑'}
                    </th>
                    <th className="table-head-cell px-4">
                      Order ID
                    </th>
                    <th className="table-head-cell px-4">
                      Bake Day
                    </th>
                    <th className="table-head-cell px-4">
                      User
                    </th>
                    <th className="table-head-cell px-4">
                      Status
                    </th>
                    <th className="table-head-cell px-4">
                      Stripe
                    </th>
                    <th className="table-head-cell px-4">
                      Total
                    </th>
                    <th className="table-head-cell px-4 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted cursor-pointer"
                      onClick={() => openDetails(order.id)}
                    >
                      <td className="px-4 py-3 text-sm text">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-secondary">{shortId(order.id)}</td>
                      <td className="px-4 py-3 text-sm text-secondary">
                        {order.bake_day_id
                          ? (bakeDays.find((b) => b.id === order.bake_day_id)?.date ??
                            shortId(order.bake_day_id))
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text">{order.user?.name || '—'}</td>
                      <td className="px-4 py-3">
                        {editingStatusOrderId === order.id ? (
                          <select
                            value={order.status ?? ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(order.id, e.target.value);
                            }}
                            onBlur={() => setEditingStatusOrderId(null)}
                            disabled={statusUpdateLoading}
                            autoFocus
                            className="input-base px-2 py-1 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStatusOrderId(order.id);
                            }}
                            className="cursor-pointer hover:opacity-80 transition"
                          >
                            <Badge
                              tone={
                                order.status === 'completed'
                                  ? 'green'
                                  : order.status === 'pending'
                                    ? 'amber'
                                    : 'gray'
                              }
                            >
                              {order.status ?? '—'}
                            </Badge>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            order.stripe_status === 'paid'
                              ? 'green'
                              : order.stripe_status === 'pending'
                                ? 'amber'
                                : 'blue'
                          }
                        >
                          {order.stripe_status ?? '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-text">
                        {formatMoney(order.price_with_tax ?? order.total_price)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <button
                            className="btn-secondary text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(order.id);
                            }}
                          >
                            View / Edit
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
      </div>

      {/* Details Drawer */}
      {selectedOrderId && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          <div className="h-full w-full max-w-xl overflow-y-auto border-l border-neutral-200 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <div>
                <p className="text-sm text-secondary">Order</p>
                <h2 className="text-2xl font-bold text">{selectedOrderId}</h2>
              </div>
              <button
                onClick={closeDetails}
                className="btn-secondary px-3 py-1"
              >
                Close
              </button>
            </div>

            {detailsLoading ? (
              <div className="p-6 text-secondary">Loading details...</div>
            ) : selectedOrder ? (
              <div className="p-6 space-y-5">
                {orderSuccess && (
                  <div className="banner banner-success">{orderSuccess}</div>
                )}

                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="admin-card bg-muted p-4">
                    <p className="text-sm text-secondary">Created</p>
                    <p className="text-lg font-semibold text">
                      {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
                  <div className="admin-card col-span-2 bg-muted p-4">
                    <p className="text-sm text-secondary mb-1">Customer</p>
                    <div className="space-y-1">
                      {selectedOrder.user?.name && (
                        <p className="text-base font-semibold text">{selectedOrder.user.name}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-secondary">User ID:</span>
                        <Link
                          to={`/admin/accounts?userId=${selectedOrder.user?.id ?? selectedOrder.user_id}`}
                          className="link-info break-all text-xs"
                        >
                          {selectedOrder.user?.id ?? selectedOrder.user_id}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scheduling */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text">Scheduling</h3>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-secondary">Bake day</label>
                    <select
                      value={orderForm.bake_day_id}
                      onChange={(e) => setOrderForm((f) => ({ ...f, bake_day_id: e.target.value }))}
                      className="input-base px-3"
                    >
                      <option value="">Unset</option>
                      {bakeDays.map((bd) => (
                        <option key={bd.id} value={bd.id}>
                          {bd.date}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {/* Statuses */}
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text">Statuses</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm text-secondary">Status</label>
                      <select
                        value={orderForm.status}
                        onChange={(e) => setOrderForm((f) => ({ ...f, status: e.target.value }))}
                        className="input-base px-3"
                      >
                        <option value="">Select status...</option>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-secondary">Stripe status</label>
                      <select
                        value={orderForm.stripe_status}
                        onChange={(e) =>
                          setOrderForm((f) => ({ ...f, stripe_status: e.target.value }))
                        }
                        className="input-base px-3"
                      >
                        <option value="">Select stripe status...</option>
                        {stripeStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Pricing */}
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text">Pricing</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm text-secondary">Total price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.total_price}
                        onChange={(e) =>
                          setOrderForm((f) => ({ ...f, total_price: e.target.value }))
                        }
                        className="input-base px-3"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-secondary">Price with tax</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderForm.price_with_tax}
                        onChange={(e) =>
                          setOrderForm((f) => ({ ...f, price_with_tax: e.target.value }))
                        }
                        className="input-base px-3"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-secondary">Stripe session ID</label>
                        <label className="flex items-center gap-2 text-xs text-secondary">
                          <input
                            type="checkbox"
                            checked={orderForm.stripeUnlocked}
                            onChange={(e) =>
                              setOrderForm((f) => ({ ...f, stripeUnlocked: e.target.checked }))
                            }
                            className="input-check"
                          />
                          Unlock edit
                        </label>
                      </div>
                      <input
                        type="text"
                        value={orderForm.stripe_session_id}
                        onChange={(e) =>
                          setOrderForm((f) => ({ ...f, stripe_session_id: e.target.value }))
                        }
                        disabled={!orderForm.stripeUnlocked}
                        className="input-base input-muted px-3 disabled:cursor-not-allowed disabled:opacity-80"
                      />
                    </div>
                  </div>
                </section>

                {/* Notes */}
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text">Notes</h3>
                  <textarea
                    value={orderForm.customer_note}
                    onChange={(e) => setOrderForm((f) => ({ ...f, customer_note: e.target.value }))}
                    rows={4}
                    className="input-base"
                  />
                </section>

                {/* Items */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text">Items</h3>
                    <button
                      onClick={openAddItem}
                      className="link-info"
                    >
                      + Add item
                    </button>
                  </div>

                  {itemError && (
                    <div className="banner banner-error text-sm">{itemError}</div>
                  )}

                  <div className="table-shell">
                    <table className="w-full text-sm">
                      <thead className="table-head">
                        <tr>
                          <th className="table-head-cell px-3 py-2">
                            Product
                          </th>
                          <th className="table-head-cell px-3 py-2">
                            Qty
                          </th>
                          <th className="table-head-cell px-3 py-2">
                            Item price
                          </th>
                          <th className="table-head-cell px-3 py-2">
                            Line total
                          </th>
                          <th className="table-head-cell px-3 py-2 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {(selectedOrder.order_items ?? []).map((item) => {
                          const product =
                            item.product ?? products.find((p) => p.id === item.product_id);
                          const lineTotal =
                            item.item_price != null
                              ? (item.item_price * item.quantity).toFixed(2)
                              : '—';
                          return (
                            <tr key={item.id}>
                              <td className="px-3 py-2 text">{product?.name ?? 'Unknown'}</td>
                              <td className="px-3 py-2 text">{item.quantity}</td>
                              <td className="px-3 py-2 text">
                                {item.item_price != null ? `$${item.item_price.toFixed(2)}` : '—'}
                              </td>
                              <td className="px-3 py-2 text">
                                {lineTotal === '—' ? '—' : `$${lineTotal}`}
                              </td>
                              <td className="px-3 py-2 text-right space-x-2">
                                <button
                                  className="link-info"
                                  onClick={() => openEditItem(item)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="link-danger"
                                  onClick={() => handleDeleteItem(item)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {(selectedOrder.order_items ?? []).length === 0 && (
                          <tr>
                            <td className="px-3 py-3 text-secondary" colSpan={5}>
                              No items yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveOrder}
                    disabled={!isOrderDirty || orderSaving}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {orderSaving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>

                {/* Danger Zone */}
                <section className="space-y-3">
                  <div className="banner banner-error p-4">
                    <h3 className="text-lg font-semibold">Danger Zone</h3>
                    <p className="mt-1 text-sm">
                      Deleting an order removes the order and all its items. This cannot be undone.
                    </p>
                    {requiresFullId && (
                      <p className="mt-1 text-xs">
                        Warning: Stripe indicates this order is paid. Type the full order id to
                        confirm.
                      </p>
                    )}

                    <div className="mt-3 space-y-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="input-check"
                          checked={deleteAck}
                          onChange={(e) => setDeleteAck(e.target.checked)}
                        />
                        I understand this is permanent
                      </label>

                      <div className="space-y-1">
                        <label className="text-sm">
                          Type <span className="">{requiredDeleteToken || 'order id'}</span> to
                          confirm
                        </label>
                        <input
                          type="text"
                          value={deleteInput}
                          onChange={(e) => setDeleteInput(e.target.value)}
                          className="input-base px-3"
                        />
                      </div>

                      <button
                        onClick={handleDeleteOrder}
                        disabled={
                          deleteLoading ||
                          !deleteAck ||
                          !requiredDeleteToken ||
                          deleteInput.trim() !== requiredDeleteToken
                        }
                        className="btn-danger disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deleteLoading ? 'Deleting...' : 'Delete Order'}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="p-6 text-secondary">Details coming next step.</div>
            )}
          </div>
        </div>
      )}

      {/* Item Modal */}
      {itemModalMode && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeItemModal();
          }}
        >
          <div className="modal-panel w-full max-w-lg">
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <h3 className="text-lg font-semibold text">
                {itemModalMode === 'add' ? 'Add item' : 'Edit item'}
              </h3>
              <button
                onClick={closeItemModal}
                className="btn-secondary px-3 py-1"
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-secondary">Product</label>
                <select
                  value={itemForm.product_id}
                  onChange={(e) => setItemForm((f) => ({ ...f, product_id: e.target.value }))}
                  className="input-base px-3"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm text-secondary">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="input-base px-3"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-secondary">Item price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.item_price}
                    onChange={(e) => setItemForm((f) => ({ ...f, item_price: e.target.value }))}
                    className="input-base px-3"
                  />
                </div>
              </div>

              {itemError && (
                <div className="banner banner-error text-sm">{itemError}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeItemModal}
                  className="btn-secondary"
                  disabled={itemSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  disabled={itemSaving}
                  className="btn-primary disabled:opacity-50"
                >
                  {itemSaving ? 'Saving...' : 'Save item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-card p-4">
      <p className="text-sm text-secondary">{label}</p>
      <p className="text-2xl font-bold text">{value}</p>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: 'green' | 'amber' | 'gray' | 'blue';
  children: ReactNode;
}) {
  const toneClasses = {
    green: 'bg-success-soft text-success',
    amber: 'bg-warning-soft text-warning',
    gray: 'bg-muted text-text',
    blue: 'bg-info-soft text-info',
  };

  return (
    <span className={`status-chip ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
