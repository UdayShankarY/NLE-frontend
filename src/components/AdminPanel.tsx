import React, { useEffect, useState } from 'react';
import { Menu, Crown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AdminView, AuthUser } from '../types';
import { Sidebar, DashboardView, CategoriesView, ProductsView, AddonsView, ActivitiesView, SlidersView, UsersView, TermsView } from './admin';
import { getApiUrl } from '../lib/api';
import { cn } from '../lib/utils';

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
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0">
        <Sidebar currentView={view} onViewChange={navigateToView} user={user} />
      </div>

      {/* Mobile & Tablet Slide-over Drawer Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-[200] w-72 transition-transform duration-300 ease-[cubic-bezier(0.34,1.1,0.64,1)] lg:hidden shadow-2xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar currentView={view} onViewChange={navigateToView} user={user} onCloseMobile={() => setSidebarOpen(false)} />
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Workspace */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <div className="sticky top-0 z-[100] flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-7 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs transition-all hover:bg-slate-50 dark:hover:bg-slate-700 lg:hidden cursor-pointer"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <Menu size={18} />
            </button>
            <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
              <span className="text-brand-purple dark:text-purple-400">Admin</span> / <span className="capitalize text-slate-900 dark:text-white">{view}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 sm:inline truncate max-w-[180px]">{user.email}</span>
            <span className="flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/60 px-2.5 py-1 text-xs font-extrabold text-brand-purple dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <Crown size={12} /> ADMIN
            </span>
          </div>
        </div>

        {/* Dynamic Main View Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-7 space-y-6">
          {view === 'dashboard' && <DashboardView />}
          {view === 'categories' && <CategoriesView />}
          {view === 'products' && <ProductsView />}
          {view === 'addons' && <AddonsView />}
          {view === 'activities' && <ActivitiesView />}
          {view === 'sliders' && <SlidersView />}
          {view === 'orders' && (
            <div className="space-y-5">
              {/* Header card */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Orders &amp; Bookings</h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Search, filter, and manage customer event bookings in real time.</p>
                </div>
                {message && <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{message}</div>}
              </div>

              {/* Controls & Search */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none">
                    <Search size={16} className="text-slate-400" />
                    <input
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                      placeholder="Search order number or customer name/email..."
                      className="w-full bg-transparent outline-none font-semibold placeholder:text-slate-400"
                    />
                  </label>

                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none">
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none">
                      <option value="createdAt">Created Date</option>
                      <option value="grandTotal">Order Amount</option>
                      <option value="orderNumber">Order Number</option>
                    </select>
                    <select value={sortDir} onChange={e => setSortDir(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none">
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                    <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none">
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                  </div>
                </div>

                {/* Orders Content: Table on Desktop, Cards on Mobile/Tablet */}
                {loadingOrders ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-xs font-bold text-slate-400">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-xs font-bold text-slate-400">No orders found.</div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">
                            <th className="px-3.5 py-3">Order</th>
                            <th className="px-3.5 py-3">Customer</th>
                            <th className="px-3.5 py-3">Product Package</th>
                            <th className="px-3.5 py-3">Event Date</th>
                            <th className="px-3.5 py-3">Amount</th>
                            <th className="px-3.5 py-3">Payment</th>
                            <th className="px-3.5 py-3">Status</th>
                            <th className="px-3.5 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {orders.map((order) => (
                            <tr key={order._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-3.5 py-3 font-extrabold text-slate-900 dark:text-white">
                                <button type="button" onClick={() => navigate(`/orders/${order._id}`)} className="hover:text-brand-purple text-left">
                                  <div>{order.orderNumber || `#${order._id.slice(-8)}`}</div>
                                  <div className="text-[10px] font-semibold text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                                </button>
                              </td>
                              <td className="px-3.5 py-3">
                                <div className="font-bold text-slate-900 dark:text-white">{order.customer?.name || order.booking?.name || 'N/A'}</div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{order.customer?.email || 'N/A'}</div>
                              </td>
                              <td className="px-3.5 py-3">
                                <div className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{order.product?.name || order.productName}</div>
                                <div className="text-[11px] text-slate-400">{order.categoryName || 'General'}</div>
                              </td>
                              <td className="px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-300">{order.booking?.eventDate || 'N/A'}</td>
                              <td className="px-3.5 py-3 font-black text-slate-900 dark:text-white">₹{Number(order.grandTotal || order.amount || 0).toLocaleString('en-IN')}</td>
                              <td className="px-3.5 py-3">
                                <span className={cn(
                                  "inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase border",
                                  order.paymentStatus === 'paid' ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                )}>
                                  {order.paymentStatus || 'pending'}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-300">{order.orderStatus || 'Pending'}</td>
                              <td className="px-3.5 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button type="button" onClick={() => navigate(`/orders/${order._id}`)} className="rounded-lg border border-purple-200 dark:border-purple-800 px-2.5 py-1 text-[11px] font-bold text-brand-purple dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 cursor-pointer">Details</button>
                                  <select value={selectedStatuses[order._id] || order.orderStatus || 'Pending'} onChange={e => setSelectedStatuses(prev => ({ ...prev, [order._id]: e.target.value }))} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none">
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Team Assigned">Team Assigned</option>
                                    <option value="Preparation Started">Preparation Started</option>
                                    <option value="Decoration In Progress">Decoration In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                  <button type="button" onClick={() => void updateOrderStatus(order._id, selectedStatuses[order._id] || order.orderStatus || 'Pending')} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs cursor-pointer">Save</button>
                                  <button type="button" onClick={() => void deleteOrder(order._id)} className="rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-1 text-[11px] font-bold hover:bg-rose-100 cursor-pointer">Del</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile & Tablet Card View */}
                    <div className="space-y-3 lg:hidden">
                      {orders.map((order) => (
                        <div key={order._id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/60 pb-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{order.orderNumber || `#${order._id.slice(-8)}`}</span>
                            <span className={cn(
                              "text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase",
                              order.paymentStatus === 'paid' ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            )}>
                              {order.paymentStatus || 'pending'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-[10px] uppercase font-extrabold text-slate-400">Customer</div>
                              <div className="font-bold text-slate-900 dark:text-white truncate">{order.customer?.name || order.booking?.name || 'N/A'}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase font-extrabold text-slate-400">Amount</div>
                              <div className="font-black text-slate-900 dark:text-white">₹{Number(order.grandTotal || order.amount || 0).toLocaleString('en-IN')}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-extrabold text-slate-400">Product Package</div>
                              <div className="font-bold text-slate-900 dark:text-white truncate">{order.product?.name || order.productName}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase font-extrabold text-slate-400">Event Date</div>
                              <div className="font-bold text-slate-700 dark:text-slate-300">{order.booking?.eventDate || 'N/A'}</div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 dark:border-slate-700/60 pt-2.5">
                            <select value={selectedStatuses[order._id] || order.orderStatus || 'Pending'} onChange={e => setSelectedStatuses(prev => ({ ...prev, [order._id]: e.target.value }))} className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none">
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Team Assigned">Team Assigned</option>
                              <option value="Preparation Started">Preparation Started</option>
                              <option value="Decoration In Progress">Decoration In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>

                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={() => void updateOrderStatus(order._id, selectedStatuses[order._id] || order.orderStatus || 'Pending')} className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold shadow-2xs">Save</button>
                              <button type="button" onClick={() => navigate(`/orders/${order._id}`)} className="rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-brand-purple dark:text-purple-300">View</button>
                              <button type="button" onClick={() => void deleteOrder(order._id)} className="rounded-lg border border-rose-200 text-rose-600 px-2.5 py-1.5 text-xs font-bold">Del</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Pagination */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">Showing {orders.length} of {pagination.total} orders</div>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 cursor-pointer"><ChevronLeft size={16} /></button>
                    <span className="text-xs font-bold text-slate-900 dark:text-white px-2">Page {pagination.page} / {pagination.totalPages}</span>
                    <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 cursor-pointer"><ChevronRight size={16} /></button>
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
