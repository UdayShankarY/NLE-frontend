import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Package, User, CalendarDays, CheckCircle2, ArrowLeft, Download } from 'lucide-react';
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
      setOrder((prev: any) => prev ? { ...prev, ...updatedOrder } : prev);
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

  // Robustly extract booking details, event date, event time, and venue location
  const bookingDetailsObj = useMemo(() => {
    if (Array.isArray(order?.bookingDetails) && order.bookingDetails.length > 0) {
      return order.bookingDetails[0];
    }
    return order?.booking || order?.bookingDetails || {};
  }, [order]);

  const customer = order?.customer || {};
  const product = order?.product || {};
  const addons = Array.isArray(order?.addons) ? order.addons : [];
  const activities = Array.isArray(order?.activities) ? order.activities : [];
  const amount = Number(order?.grandTotal || order?.amount || 0);

  const eventDateVal = bookingDetailsObj?.eventDate || order?.eventDate || 'N/A';
  const eventTimeVal = bookingDetailsObj?.eventTime || order?.eventTime || 'N/A';
  const venueLocationVal = bookingDetailsObj?.location || order?.location || customer?.address || 'N/A';

  const summaryItems = useMemo(() => [
    { label: 'Order Number', value: order?.orderNumber || order?._id || 'N/A' },
    { label: 'Payment Status', value: (order?.paymentStatus || 'pending').toUpperCase() },
    { label: 'Current Status', value: order?.orderStatus || 'Pending' },
    { label: 'Booking Placed On', value: order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A' },
    { label: 'Event Date', value: eventDateVal },
    { label: 'Event Start Time', value: eventTimeVal },
    { label: 'Venue Location', value: venueLocationVal },
  ], [eventDateVal, eventTimeVal, venueLocationVal, order]);

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
      <main className="mx-auto max-w-[1100px] px-4 py-6 md:px-6 min-h-[80vh]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-brand-purple dark:text-purple-400 hover:underline cursor-pointer print:hidden"
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading order details...
          </div>
        ) : !order ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
            Order not found.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header & Price Banner */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm md:p-7 print:hidden">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-brand-purple dark:text-purple-400">
                    <Package size={18} />
                    <span className="text-xs uppercase font-extrabold tracking-wider">Order Details</span>
                  </div>
                  <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                    {order.orderNumber || `Order #${order._id.slice(-8)}`}
                  </h1>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Track your decor setup workflow and event timing details below.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download size={15} /> Download Invoice
                  </button>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 text-sm text-slate-900 dark:text-white text-right">
                    <div className="text-xs uppercase font-extrabold text-slate-400 dark:text-slate-500">Total Paid</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">₹{amount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Step Progress Visualizer */}
              <div className="mt-6 rounded-2xl border border-purple-100 dark:border-slate-800 bg-gradient-to-r from-purple-50/60 to-slate-50 dark:from-purple-950/30 dark:to-slate-900 p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-brand-purple dark:text-purple-300">Order Progress</div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Track current status of your decoration team.</div>
                  </div>
                  <div className="flex-1 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {statusSteps.map((step, index) => {
                        const state = getStepState(index);
                        const stateClasses = state === 'completed'
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : state === 'current'
                          ? 'bg-brand-purple text-white border-brand-purple shadow-md shadow-purple-500/20 ring-2 ring-purple-400/30'
                          : state === 'cancelled'
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';

                        return (
                          <div key={step.key} className="flex items-center gap-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-2">
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${stateClasses}`}>
                              {state === 'completed' ? '✓' : state === 'current' ? '●' : state === 'cancelled' ? '✕' : index + 1}
                            </div>
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{step.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Status Controls */}
              {auth.isAdmin && (
                <div className="mt-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">Admin Status Control</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Update event setup progress for this order.</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Team Assigned">Team Assigned</option>
                        <option value="Preparation Started">Preparation Started</option>
                        <option value="Decoration In Progress">Decoration In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => void updateOrderStatus()}
                        disabled={savingStatus}
                        className="rounded-xl bg-brand-purple px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-purple-dark transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {savingStatus ? 'Saving...' : 'Update Status'}
                      </button>
                    </div>
                  </div>
                  {statusMessage && <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">{statusMessage}</div>}
                </div>
              )}
            </section>

            {/* Summary Grid: Event Date, Time, Venue & Payment details */}
            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm md:p-7">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Booking &amp; Event Summary</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {summaryItems.map(item => (
                    <div key={item.label} className="rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.label}</div>
                      <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white break-words">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment IDs Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm md:p-7">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Payment Verification</h2>
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Razorpay Payment ID</div>
                        <div className="mt-1 break-all text-xs font-mono font-bold text-slate-900 dark:text-slate-200">{order.razorpayPaymentId || 'N/A'}</div>
                      </div>
                      {order.razorpayPaymentId && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.razorpayPaymentId || '', 'payment')}
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          {copiedField === 'payment' ? 'Copied' : <><Copy size={13} className="mr-1 inline" /> Copy</>}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Razorpay Order ID</div>
                        <div className="mt-1 break-all text-xs font-mono font-bold text-slate-900 dark:text-slate-200">{order.razorpayOrderId || 'N/A'}</div>
                      </div>
                      {order.razorpayOrderId && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.razorpayOrderId || '', 'order')}
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          {copiedField === 'order' ? 'Copied' : <><Copy size={13} className="mr-1 inline" /> Copy</>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Customer & Package Details */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm md:p-7">
                <div className="flex items-center gap-2 text-brand-purple dark:text-purple-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <User size={18} />
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Customer Details</h2>
                </div>
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <div><span className="font-bold text-slate-900 dark:text-white">Name:</span> {customer.name || bookingDetailsObj?.name || 'N/A'}</div>
                  <div><span className="font-bold text-slate-900 dark:text-white">Email:</span> {customer.email || bookingDetailsObj?.email || 'N/A'}</div>
                  <div><span className="font-bold text-slate-900 dark:text-white">Phone:</span> {customer.phone || bookingDetailsObj?.mobile || 'N/A'}</div>
                  <div><span className="font-bold text-slate-900 dark:text-white">Venue Address:</span> {venueLocationVal}</div>
                  {bookingDetailsObj?.requests && (
                    <div><span className="font-bold text-slate-900 dark:text-white">Special Instructions:</span> {bookingDetailsObj.requests}</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm md:p-7">
                <div className="flex items-center gap-2 text-brand-purple dark:text-purple-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Package size={18} />
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Product &amp; Package Details</h2>
                </div>
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <div><span className="font-bold text-slate-900 dark:text-white">Package Name:</span> {product.name || order.productName || 'N/A'}</div>
                  <div><span className="font-bold text-slate-900 dark:text-white">Category:</span> {product.categoryName || order.categoryName || 'N/A'}</div>
                  { (product.subcategory || order.subcategory) && (
                    <div><span className="font-bold text-slate-900 dark:text-white">Subcategory:</span> {product.subcategory || order.subcategory}</div>
                  )}
                  <div><span className="font-bold text-slate-900 dark:text-white">Base Package Price:</span> ₹{Number(product.price || order.packagePrice || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </section>

            {/* Addons & Activities */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm md:p-7">
                <div className="flex items-center gap-2 text-brand-purple dark:text-purple-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CheckCircle2 size={18} />
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Selected Add-ons</h2>
                </div>
                {addons.length === 0 ? (
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">No add-ons selected.</div>
                ) : (
                  <div className="space-y-2">
                    {addons.map((item: any, index: number) => (
                      <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white">
                        <span>{item.name}</span>
                        <span className="text-brand-purple dark:text-purple-300">+₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm md:p-7">
                <div className="flex items-center gap-2 text-brand-purple dark:text-purple-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CalendarDays size={18} />
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Selected Activities</h2>
                </div>
                {activities.length === 0 ? (
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">No activities selected.</div>
                ) : (
                  <div className="space-y-2">
                    {activities.map((item: any, index: number) => (
                      <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white">
                        <span>{item.name}</span>
                        <span className="text-brand-purple dark:text-purple-300">+₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>
        )}

        {/* PRINTABLE TAX INVOICE (Visible ONLY when printing / downloading invoice) */}
        {order && (
          <div className="hidden print:block font-sans text-slate-900 bg-white p-4">
            <div className="flex items-center justify-between border-b-2 border-purple-900 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-purple-900 tracking-tight">TheDecorParty</h1>
                <p className="text-xs font-semibold text-slate-600">Premium Event &amp; Party Decoration Services</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Website: www.thedecorparty.com | Phone: +91 7975581697</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-black text-slate-900 uppercase">TAX INVOICE</h2>
                <p className="text-xs font-bold text-slate-800 mt-1">Invoice #: {order.orderNumber || `#${order._id.slice(-8)}`}</p>
                <p className="text-[11px] text-slate-500">Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                <span className="mt-1 inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Payment Status: PAID
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="rounded-xl border border-slate-300 p-4 bg-slate-50/50">
                <h3 className="text-[10px] uppercase font-extrabold text-slate-400 mb-1 tracking-wider">Billed To</h3>
                <p className="text-sm font-black text-slate-900">{customer.name || bookingDetailsObj?.name || 'Valued Customer'}</p>
                <p className="text-xs text-slate-600 font-medium">{customer.phone || bookingDetailsObj?.mobile || 'N/A'}</p>
                <p className="text-xs text-slate-600 font-medium">{customer.email || bookingDetailsObj?.email || 'N/A'}</p>
                <p className="text-xs text-slate-600 mt-1.5 font-medium"><strong>Venue:</strong> {venueLocationVal}</p>
              </div>

              <div className="rounded-xl border border-slate-300 p-4 bg-slate-50/50">
                <h3 className="text-[10px] uppercase font-extrabold text-slate-400 mb-1 tracking-wider">Event &amp; Payment Info</h3>
                <p className="text-xs text-slate-700">Event Date: <strong>{eventDateVal}</strong></p>
                <p className="text-xs text-slate-700 mt-0.5">Start Time: <strong>{eventTimeVal}</strong></p>
                <p className="text-xs text-slate-700 mt-0.5">Payment Method: <strong>Razorpay (Online)</strong></p>
                {order.razorpayPaymentId && (
                  <p className="text-xs text-slate-700 mt-0.5 break-all">Payment ID: <strong>{order.razorpayPaymentId}</strong></p>
                )}
              </div>
            </div>

            <table className="w-full border-collapse mb-6 text-xs">
              <thead>
                <tr className="bg-purple-900 text-white text-left">
                  <th className="py-2.5 px-3 font-extrabold rounded-tl-lg">Item / Package Description</th>
                  <th className="py-2.5 px-3 font-extrabold text-center">Qty</th>
                  <th className="py-2.5 px-3 font-extrabold text-right rounded-tr-lg">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-b border-slate-300">
                <tr>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 text-sm">{product.name || order.productName || 'Party Setup'}</div>
                    <div className="text-[11px] text-slate-500">{order.categoryName || ''} {order.subcategory ? `• ${order.subcategory}` : ''}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold">1</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">₹{Number(order.packagePrice || amount).toLocaleString('en-IN')}</td>
                </tr>
                {addons.map((a: any, i: number) => (
                  <tr key={`addon-${i}`}>
                    <td className="py-2 px-3 text-slate-700 font-medium">+ Addon: {a.name}</td>
                    <td className="py-2 px-3 text-center font-semibold">{a.qty || 1}</td>
                    <td className="py-2 px-3 text-right font-semibold">₹{(Number(a.price || 0) * (a.qty || 1)).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {activities.map((act: any, i: number) => (
                  <tr key={`act-${i}`}>
                    <td className="py-2 px-3 text-slate-700 font-medium">+ Activity: {act.name}</td>
                    <td className="py-2 px-3 text-center font-semibold">{act.qty || 1}</td>
                    <td className="py-2 px-3 text-right font-semibold">₹{(Number(act.price || 0) * (act.qty || 1)).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-8">
              <div className="w-72 space-y-2 border-t-2 border-slate-300 pt-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{(order.subtotal || order.packagePrice || amount).toLocaleString('en-IN')}</span>
                </div>
                {(order.addonTotal > 0 || order.activityTotal > 0) && (
                  <div className="flex justify-between text-slate-600">
                    <span>Addons &amp; Activities:</span>
                    <span>₹{((order.addonTotal || 0) + (order.activityTotal || 0)).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base text-slate-900 border-t border-slate-300 pt-2">
                  <span>Grand Total Paid:</span>
                  <span className="text-purple-900">₹{amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-4 text-center text-xs text-slate-500">
              <p className="font-bold text-slate-700">Thank you for choosing TheDecorParty!</p>
              <p className="mt-0.5">This is a computer-generated tax invoice and requires no physical signature.</p>
            </div>
          </div>
        )}
      </main>
    </MainLayout>
  );
}
