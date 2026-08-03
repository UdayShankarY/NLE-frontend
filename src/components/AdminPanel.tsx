import React, { useEffect, useState } from 'react';
import { Menu, Crown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AdminView, AuthUser } from '../types';
import { Sidebar, DashboardView, CategoriesView, ProductsView, AddonsView, ActivitiesView, SlidersView, UsersView, TermsView } from './admin';
import { getApiUrl } from '../lib/api';

interface AdminPanelProps {
  user: AuthUser;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [message, setMessage] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});

  const view = React.useMemo<AdminView>(() => {
    const path = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'dashboard';
    switch (path) {
      case 'categories':
        return 'categories';
      case 'products':
        return 'products';
      case 'addons':
        return 'addons';
      case 'activities':
        return 'activities';
      case 'sliders':
        return 'sliders';
      case 'orders':
        return 'orders';
      case 'bookings':
        return 'orders';
      case 'users':
        return 'users';
      case 'terms':
        return 'terms';
      default:
        return 'dashboard';
    }
  }, [location.pathname]);

  const navigateToView = (nextView: AdminView) => {
    const routes: Record<AdminView, string> = {
      dashboard: '/admin',
      categories: '/admin/categories',
      products: '/admin/products',
      addons: '/admin/addons',
      activities: '/admin/activities',
      sliders: '/admin/sliders',
      orders: '/admin/orders',
      users: '/admin/users',
      terms: '/admin/terms',
    };
    navigate(routes[nextView]);
  };

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
  if (view !== "orders") {
    return;
  }

  const loadOrders = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    setLoadingOrders(true);

    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        page: String(page),
        limit: String(limit),
        sortBy,
        sortDir,
      });

      const url = `${getApiUrl("/api/admin/orders")}?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      const payload = JSON.parse(text);

      setOrders(payload.orders || []);

      setPagination(
        payload.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  loadOrders();
}, [
  view,
  search,
  statusFilter,
  page,
  limit,
  sortBy,
  sortDir,
]);

  const updateOrderStatus = async (orderId: string, nextOrderStatus: string, nextPaymentStatus?: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const requestUrl = getApiUrl(`/api/admin/orders/${orderId}/status`);
    const requestBody = { orderStatus: nextOrderStatus, paymentStatus: nextPaymentStatus };

    try {
      const response = await fetch(requestUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      let responseBody: any = null;
      try {
        responseBody = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseBody = responseText;
      }

      if (!response.ok) {
        const backendError = responseBody?.error || responseBody?.msg || responseText || 'Unable to update order';
        throw new Error(backendError);
      }

      const savedOrder = responseBody;
      setMessage('Order updated');
      setOrders(prev => prev.map(order => order._id === orderId ? { ...order, ...savedOrder } : order));
      setSelectedStatuses(prev => ({ ...prev, [orderId]: savedOrder.orderStatus || nextOrderStatus }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update order');
    }
  };

  const deleteOrder = async (orderId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(getApiUrl(`/api/admin/orders/${orderId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Unable to delete order');
      setMessage('Order deleted');
      setOrders(prev => prev.filter(order => order._id !== orderId));
    } catch {
      setMessage('Unable to delete order');
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold text-ink">Access Denied</h2>
        <p className="mt-2 text-sm text-ink-muted">You are not authorized to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      <div className="hidden md:flex w-60 flex-shrink-0">
        <Sidebar currentView={view} onViewChange={navigateToView} user={user} />
      </div>
      <div className={`fixed inset-y-0 left-0 z-[200] w-60 transition-transform duration-200 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar currentView={view} onViewChange={navigateToView} user={user} />
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-border bg-white px-4 shadow-sm md:px-7">
          <button
            className="mr-2 flex items-center justify-center rounded-md p-2 text-ink hover:bg-black/5 md:hidden"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <div className="text-sm text-ink-muted">
            <span className="font-semibold text-brand-purple">Admin</span> / {view}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">{user.email}</span>
            <span className="flex items-center gap-1 rounded-full bg-brand-purple/10 px-2.5 py-1 text-xs font-bold text-brand-purple">
              <Crown size={12} /> ADMIN
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-7">
          {view === 'dashboard' && <DashboardView />}
          {view === 'categories' && <CategoriesView />}
          {view === 'products' && <ProductsView />}
          {view === 'addons' && <AddonsView />}
          {view === 'activities' && <ActivitiesView />}
          {view === 'sliders' && <SlidersView />}
          {view === 'orders' && (
            <div className="adm-section space-y-4">
              <div className="flex flex-col gap-3 rounded-card border border-border bg-white p-4 shadow-card md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">Orders</h2>
                  <p className="text-sm text-ink-muted">Search, filter, and update bookings in real time.</p>
                </div>
                {message && <div className="text-sm text-emerald-600">{message}</div>}
              </div>

              <div className="rounded-card border border-border bg-white p-4 shadow-card">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <label className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-ink">
                    <Search size={16} />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search order or customer" className="w-full bg-transparent outline-none" />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-border px-3 py-2 text-sm text-ink">
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm text-ink">
                      <option value="createdAt">Created</option>
                      <option value="grandTotal">Amount</option>
                      <option value="orderNumber">Order Number</option>
                    </select>
                    <select value={sortDir} onChange={e => setSortDir(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm text-ink">
                      <option value="desc">Desc</option>
                      <option value="asc">Asc</option>
                    </select>
                    <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-border px-3 py-2 text-sm text-ink">
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  {loadingOrders ? (
                    <div className="py-8 text-center text-sm text-ink-muted">Loading orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="py-8 text-center text-sm text-ink-muted">No orders found.</div>
                  ) : (
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-ink-muted">
                          <th className="px-3 py-2">Order</th>
                          <th className="px-3 py-2">Customer</th>
                          <th className="px-3 py-2">Product</th>
                          <th className="px-3 py-2">Event Date</th>
                          <th className="px-3 py-2">Amount</th>
                          <th className="px-3 py-2">Payment</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id} className="border-b border-border/70 align-top">
                            <td className="px-3 py-3">
                              <button type="button" onClick={() => navigate(`/orders/${order._id}`)} className="text-left">
                                <div className="font-semibold text-ink">{order.orderNumber}</div>
                                <div className="text-xs text-ink-muted">{new Date(order.createdAt).toLocaleDateString()}</div>
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-medium text-ink">{order.customer?.name || order.booking?.name || 'N/A'}</div>
                              <div className="text-xs text-ink-muted">{order.customer?.email || 'N/A'}</div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-medium text-ink">{order.product?.name || order.productName}</div>
                              <div className="text-xs text-ink-muted">{order.categoryName || 'N/A'}</div>
                            </td>
                            <td className="px-3 py-3">{order.booking?.eventDate || 'N/A'}</td>
                            <td className="px-3 py-3">₹{Number(order.grandTotal || order.amount || 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3">
                              <div className="text-sm text-ink">{order.paymentStatus || 'pending'}</div>
                              <div className="text-xs text-ink-muted">{order.paymentMethod || 'whatsapp'}</div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="text-sm text-ink">{order.orderStatus || 'Pending'}</div>
                              <div className="text-xs text-ink-muted">{new Date(order.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => navigate(`/orders/${order._id}`)} className="rounded-lg border border-brand-purple px-2.5 py-1.5 text-xs font-semibold text-brand-purple">View Details</button>
                                <select value={selectedStatuses[order._id] || order.orderStatus || 'Pending'} onChange={e => setSelectedStatuses(prev => ({ ...prev, [order._id]: e.target.value }))} className="rounded-lg border border-border px-2 py-1 text-sm text-ink">
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Team Assigned">Team Assigned</option>
                                  <option value="Preparation Started">Preparation Started</option>
                                  <option value="Decoration In Progress">Decoration In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                <button type="button" onClick={() => void updateOrderStatus(order._id, selectedStatuses[order._id] || order.orderStatus || 'Pending')} className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-600">Save</button>
                                <button type="button" onClick={() => void deleteOrder(order._id)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="text-sm text-ink-muted">Showing {orders.length} of {pagination.total} orders</div>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-lg border border-border px-3 py-2 text-sm text-ink disabled:opacity-50"><ChevronLeft size={16} /></button>
                    <span className="text-sm text-ink">Page {pagination.page} / {pagination.totalPages}</span>
                    <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-border px-3 py-2 text-sm text-ink disabled:opacity-50"><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {view === 'users' && <UsersView />}
          {view === 'terms' && <TermsView />}
        </div>
      </div>
    </div>
  );
};
