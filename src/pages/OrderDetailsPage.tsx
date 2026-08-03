import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Package, User, CalendarDays, MapPin, CreditCard, CheckCircle2, ArrowLeft } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { useAI } from '../context/AIContext';
import { getApiUrl } from '../lib/api';

export default function OrderDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const auth = useAuth();
  const cart = useCart();
  const { categories } = useProducts();
  const { t } = useLanguage();
  const { messages, input, inputRef, setInput, sendMessage } = useAI();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!id) return;

    const loadOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(getApiUrl(`/api/orders/${id}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error('Unable to load order');
        const payload = await response.json();
        setOrder(payload);
        setSelectedStatus(payload?.orderStatus || 'Pending');
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [id]);

  const updateOrderStatus = async () => {
    if (!order?._id || !auth.isAdmin) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setSavingStatus(true);
    setStatusMessage(null);
    try {
      const response = await fetch(getApiUrl(`/api/admin/orders/${order._id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderStatus: selectedStatus }),
      });
      if (!response.ok) throw new Error('Unable to update order status');
      const updatedOrder = await response.json();
      setOrder(prev => prev ? { ...prev, ...updatedOrder } : prev);
      setSelectedStatus(updatedOrder.orderStatus || selectedStatus);
      setStatusMessage('Order status updated');
    } catch {
      setStatusMessage('Unable to update order status');
    } finally {
      setSavingStatus(false);
    }
  };

  const copyToClipboard = async (value: string, field: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const booking = order?.booking || {};
  const customer = order?.customer || {};
  const product = order?.product || {};
  const addons = Array.isArray(order?.addons) ? order.addons : [];
  const activities = Array.isArray(order?.activities) ? order.activities : [];
  const amount = Number(order?.grandTotal || order?.amount || 0);

  const summaryItems = useMemo(() => [
    { label: 'Order Number', value: order?.orderNumber || 'N/A' },
    { label: 'Payment Status', value: order?.paymentStatus || 'pending' },
    { label: 'Current Status', value: order?.orderStatus || 'Pending' },
    { label: 'Booking Date', value: order?.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A' },
    { label: 'Event Date', value: booking.eventDate || 'N/A' },
    { label: 'Venue', value: booking.location || 'N/A' },
  ], [booking.eventDate, booking.location, order]);

  const statusSteps = useMemo(() => [
    { label: 'Payment Received', key: 'payment' },
    { label: 'Booking Confirmed', key: 'booked' },
    { label: 'Team Assigned', key: 'team' },
    { label: 'Preparation Started', key: 'preparation' },
    { label: 'Decoration In Progress', key: 'progress' },
    { label: 'Completed', key: 'completed' },
  ], []);

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    if (order.orderStatus === 'Cancelled') return -1;
    const statusValue = String(order.orderStatus || 'Pending');
    const statusMap: Record<string, number> = {
      Pending: 1,
      Confirmed: 2,
      'Team Assigned': 3,
      'Preparation Started': 4,
      'Decoration In Progress': 5,
      Completed: 6,
    };
    const baseIndex = statusMap[statusValue] ?? 1;
    return order.paymentStatus === 'paid' ? Math.max(baseIndex, 1) : 0;
  }, [order]);

  const getStepState = (index: number) => {
    if (currentStepIndex === -1) {
      return index === 0 ? 'cancelled' : 'upcoming';
    }
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <MainLayout
      auth={auth}
      t={t}
      onAssistantOpen={() => {}}
      onLogoClick={() => navigate('/')}
      showAssistantButton={false}
      showMobileMenu
      categories={categories}
      onSelectCategory={() => navigate('/')}
      assistantOpen={false}
      assistantMessages={messages}
      assistantInput={input}
      assistantInputRef={inputRef}
      onAssistantClose={() => {}}
      onAssistantInputChange={setInput}
      onAssistantSubmit={sendMessage}
      cartOpen={false}
      cartItems={cart.items}
      cartTotal={cart.total}
      onCartRemove={cart.removeItem}
      onCartUpdateQty={cart.updateQty}
      onCartClear={cart.clearCart}
      onCartClose={() => navigate('/')}
      onCartLoginClick={() => auth.open('login')}
      onTermsPageOpen={key => navigate(`/${key}`)}
      onCloseAuth={auth.close}
      onSetAuthTab={auth.setTab}
      authModalOpen={auth.isOpen}
      authModalTab={auth.tab}
    >
      <main className="mx-auto max-w-[1100px] px-4 py-6 md:px-6">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-purple">
          <ArrowLeft size={16} /> Back
        </button>

        {loading ? (
          <div className="rounded-card border border-border bg-white p-8 text-center text-sm text-ink-muted">Loading order details...</div>
        ) : !order ? (
          <div className="rounded-card border border-border bg-white p-8 text-center text-sm text-ink-muted">Order not found.</div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-7">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-brand-purple">
                    <Package size={18} />
                    <span className="text-sm font-semibold">Order Details</span>
                  </div>
                  <h1 className="mt-2 text-2xl font-bold text-ink">{order.orderNumber || `Order ${order._id}`}</h1>
                  <p className="mt-1 text-sm text-ink-muted">Track your booking and payment details in one place.</p>
                </div>
                <div className="rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-ink">
                  <div className="font-semibold">₹{amount.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-ink-muted">{product.name || order.productName}</div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-gradient-to-r from-brand-purple/5 to-purple-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-brand-purple">Order Progress</div>
                    <div className="mt-1 text-sm text-ink-muted">Your booking is moving through the decor workflow.</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-2">
                      {statusSteps.map((step, index) => {
                        const state = getStepState(index);
                        const stateClasses = state === 'completed' ? 'bg-emerald-500 text-white border-emerald-500' : state === 'current' ? 'bg-brand-purple text-white border-brand-purple' : state === 'cancelled' ? 'bg-red-500 text-white border-red-500' : 'bg-gray-200 text-gray-600 border-gray-200';
                        return (
                          <div key={step.key} className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${stateClasses}`}>
                              {state === 'completed' ? '✓' : state === 'current' ? '●' : state === 'cancelled' ? '✕' : '○'}
                            </div>
                            <div className="text-sm font-medium text-ink">{step.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {auth.isAdmin && (
                <div className="mt-5 rounded-2xl border border-border bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-ink">Admin status update</div>
                      <div className="text-sm text-ink-muted">Adjust the current stage without reloading the page.</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink">
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Team Assigned">Team Assigned</option>
                        <option value="Preparation Started">Preparation Started</option>
                        <option value="Decoration In Progress">Decoration In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button type="button" onClick={() => void updateOrderStatus()} disabled={savingStatus} className="rounded-lg bg-brand-purple px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        {savingStatus ? 'Saving...' : 'Save Status'}
                      </button>
                    </div>
                  </div>
                  {statusMessage && <div className="mt-3 text-sm text-emerald-600">{statusMessage}</div>}
                </div>
              )}
            </section>

            {auth.isAdmin && order?.statusHistory?.length > 0 && (
              <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-7">
                <h2 className="text-lg font-semibold text-ink">Status History</h2>
                <div className="mt-4 space-y-3">
                  {order.statusHistory.map((entry: any, index: number) => (
                    <div key={`${entry.status}-${index}`} className="flex items-center justify-between rounded-lg border border-border bg-gray-50 px-3 py-3 text-sm text-ink">
                      <div>
                        <div className="font-semibold">{entry.status}</div>
                        <div className="text-xs text-ink-muted">{entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'N/A'}</div>
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-brand-purple">#{index + 1}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-card border border-border bg-white p-5 shadow-card md:p-7">
                <h2 className="text-lg font-semibold text-ink">Booking Summary</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {summaryItems.map(item => (
                    <div key={item.label} className="rounded-lg border border-border bg-gray-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{item.label}</div>
                      <div className="mt-1 text-sm text-ink">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-card border border-border bg-white p-5 shadow-card md:p-7">
                <h2 className="text-lg font-semibold text-ink">Payment Information</h2>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Razorpay Payment ID</div>
                        <div className="mt-1 break-all text-sm text-ink">{order.razorpayPaymentId || 'N/A'}</div>
                      </div>
                      <button type="button" onClick={() => copyToClipboard(order.razorpayPaymentId || '', 'payment')} className="rounded-lg border border-border px-3 py-2 text-sm text-ink">
                        {copiedField === 'payment' ? 'Copied' : <><Copy size={14} className="mr-1 inline" /> Copy</>}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Razorpay Order ID</div>
                        <div className="mt-1 break-all text-sm text-ink">{order.razorpayOrderId || 'N/A'}</div>
                      </div>
                      <button type="button" onClick={() => copyToClipboard(order.razorpayOrderId || '', 'order')} className="rounded-lg border border-border px-3 py-2 text-sm text-ink">
                        {copiedField === 'order' ? 'Copied' : <><Copy size={14} className="mr-1 inline" /> Copy</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-card border border-border bg-white p-5 shadow-card md:p-7">
                <div className="flex items-center gap-2 text-brand-purple">
                  <User size={18} />
                  <h2 className="text-lg font-semibold text-ink">Customer Details</h2>
                </div>
                <div className="mt-4 space-y-3 text-sm text-ink">
                  <div><span className="font-semibold">Name:</span> {customer.name || 'N/A'}</div>
                  <div><span className="font-semibold">Email:</span> {customer.email || 'N/A'}</div>
                  <div><span className="font-semibold">Phone:</span> {customer.phone || 'N/A'}</div>
                  <div><span className="font-semibold">Address:</span> {customer.address || 'N/A'}</div>
                </div>
              </div>

              <div className="rounded-card border border-border bg-white p-5 shadow-card md:p-7">
                <div className="flex items-center gap-2 text-brand-purple">
                  <Package size={18} />
                  <h2 className="text-lg font-semibold text-ink">Product Details</h2>
                </div>
                <div className="mt-4 space-y-3 text-sm text-ink">
                  <div><span className="font-semibold">Product:</span> {product.name || order.productName || 'N/A'}</div>
                  <div><span className="font-semibold">Category:</span> {product.categoryName || order.categoryName || 'N/A'}</div>
                  <div><span className="font-semibold">Subcategory:</span> {product.subcategory || order.subcategory || 'N/A'}</div>
                  <div><span className="font-semibold">Package Price:</span> ₹{Number(product.price || order.packagePrice || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-card border border-border bg-white p-5 shadow-card md:p-7">
                <div className="flex items-center gap-2 text-brand-purple">
                  <CheckCircle2 size={18} />
                  <h2 className="text-lg font-semibold text-ink">Add-ons</h2>
                </div>
                {addons.length === 0 ? (
                  <div className="mt-4 text-sm text-ink-muted">No add-ons selected.</div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {addons.map((item: any, index: number) => (
                      <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-ink">
                        <span>{item.name}</span>
                        <span>₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-card border border-border bg-white p-5 shadow-card md:p-7">
                <div className="flex items-center gap-2 text-brand-purple">
                  <CalendarDays size={18} />
                  <h2 className="text-lg font-semibold text-ink">Activities</h2>
                </div>
                {activities.length === 0 ? (
                  <div className="mt-4 text-sm text-ink-muted">No activities selected.</div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {activities.map((item: any, index: number) => (
                      <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-ink">
                        <span>{item.name}</span>
                        <span>₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </MainLayout>
  );
}
