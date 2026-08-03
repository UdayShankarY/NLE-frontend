import { useEffect, useState, type FormEvent } from 'react';
import { ChevronRight, KeyRound, LogOut, Mail, MapPin, Package, Phone, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { useAI } from '../context/AIContext';
import { BackButton } from '../components/BackButton';
import Avatar from '../components/Avatar';
import { cn } from '../lib/utils';
import { getApiUrl } from '../lib/api';
import { getUserDisplayName } from '../lib/avatar';

const valueOrEmpty = (value?: string) => value?.trim() || 'Not provided';

export default function ProfilePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const cart = useCart();
  const { categories } = useProducts();
  const { t, LANGS, langCode, changeLang } = useLanguage();
  const { messages, input, inputRef, setInput, sendMessage } = useAI();
  const user = auth.user;
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || '',
    pincode: user?.pincode || '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !auth.user) return;

    fetch(getApiUrl('/api/auth/profile'), { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (!response.ok) throw new Error('Failed to load profile');
        const payload = await response.json();
        return payload;
      })
      .then(payload => {
        if (!payload?.user) return;
        const normalizedUser = {
          ...auth.user,
          ...payload.user,
          avatar: payload.user.avatar?.trim() || payload.user.photoURL?.trim() || auth.user?.avatar?.trim() || auth.user?.photoURL?.trim() || '',
          photoURL: payload.user.photoURL?.trim() || auth.user?.photoURL?.trim() || '',
          name: payload.user.name?.trim() || [payload.user.firstName, payload.user.lastName].filter(Boolean).join(' ') || auth.user?.name || auth.user?.email || '',
          firstName: payload.user.firstName?.trim() || auth.user?.firstName || '',
          lastName: payload.user.lastName?.trim() || auth.user?.lastName || '',
        };
        auth.updateUser(normalizedUser);
        setForm(current => ({ ...current, ...normalizedUser }));
      })
      .catch(() => setSaveMessage('Unable to load profile details.'));
  }, [auth.user?.id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !auth.user?.id) return;

    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const response = await fetch(getApiUrl('/api/orders/my'), { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('Unable to load orders');
        const payload = await response.json();
        setOrders(Array.isArray(payload) ? payload : []);
      } catch {
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    void loadOrders();
  }, [auth.user?.id]);

  if (!user) {
    navigate('/');
    return null;
  }

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setSaveMessage('');
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch(getApiUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.user) throw new Error(payload.msg || 'Unable to save profile');
      const normalizedUser = {
        ...auth.user!,
        ...payload.user,
        avatar: payload.user.avatar?.trim() || payload.user.photoURL?.trim() || auth.user?.avatar?.trim() || auth.user?.photoURL?.trim() || '',
        photoURL: payload.user.photoURL?.trim() || auth.user?.photoURL?.trim() || '',
        name: payload.user.name?.trim() || [payload.user.firstName, payload.user.lastName].filter(Boolean).join(' ') || auth.user?.name || auth.user?.email || '',
      };
      auth.updateUser(normalizedUser);
      setForm(current => ({ ...current, ...payload.user }));
      setEditing(false);
      setSaveMessage('Profile saved successfully.');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const fullName = getUserDisplayName(user) || user?.email || '';
  const avatar = <Avatar user={user} alt={fullName || 'User avatar'} className="h-20 w-20" />;

  return (
    <MainLayout
      auth={auth}
      t={t}
      onAssistantOpen={() => setAssistantOpen(true)}
      onLogoClick={() => navigate('/')}
      showAssistantButton={false}
      showMobileMenu
      categories={categories}
      onSelectCategory={(category, subcategory) => navigate(subcategory ? `/category/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}` : `/category/${encodeURIComponent(category)}`)}
      assistantOpen={assistantOpen}
      assistantMessages={messages}
      assistantInput={input}
      assistantInputRef={inputRef}
      onAssistantClose={() => setAssistantOpen(false)}
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
        <div className="mb-5 flex items-center gap-3">
          <BackButton onClick={() => navigate('/')} />
          <h1 className="text-xl font-bold text-ink md:text-2xl">Profile</h1>
        </div>

        <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-7">
          <div className="flex flex-col items-center gap-3 border-b border-border pb-6 text-center sm:flex-row sm:text-left">
            {avatar}
            <div><h2 className="text-xl font-bold text-ink">{fullName}</h2><p className="text-sm text-ink-muted">{user.email}</p></div>
          </div>

          <form onSubmit={saveProfile}>
            <div className="mb-4 mt-6 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">Personal Information</h2>
              <button
                type="button"
                onClick={() => { setEditing(true); setSaveMessage(''); }}
                disabled={editing}
                className="rounded-lg border border-brand-purple px-4 py-2 text-sm font-semibold text-brand-purple transition hover:bg-brand-purple hover:text-white disabled:cursor-default disabled:opacity-50"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['firstName', 'First Name', User], ['lastName', 'Last Name', User],
                ['phone', 'Phone Number', Phone], ['gender', 'Gender', User],
                ['dateOfBirth', 'Date of Birth', User], ['address', 'Address', MapPin],
                ['city', 'City', MapPin], ['state', 'State', MapPin],
                ['country', 'Country', MapPin], ['pincode', 'Pincode', MapPin],
              ].map(([field, label, Icon]) => (
                <label key={field as string} className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
                  <span className="flex items-center gap-2"><Icon size={14} />{label as string}</span>
                  {field === 'gender' ? (
                    <select
                      value={form.gender}
                      onChange={event => updateField('gender', event.target.value)}
                      disabled={!editing}
                      className={cn(
                        'rounded-lg border border-border px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-light/25',
                        editing ? 'bg-white' : 'cursor-default bg-gray-50'
                      )}
                    >
                      <option value="">Select gender</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  ) : (
                    <input
                      type={field === 'dateOfBirth' ? 'date' : 'text'}
                      value={form[field as keyof typeof form]}
                      onChange={event => updateField(field as keyof typeof form, event.target.value)}
                      readOnly={!editing}
                      className={cn(
                        'rounded-lg border border-border px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-light/25',
                        editing ? 'bg-white' : 'cursor-default bg-gray-50'
                      )}
                    />
                  )}
                </label>
              ))}
              <div className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted"><span className="flex items-center gap-2"><Mail size={14} />Email</span><div className="rounded-lg border border-border bg-gray-50 px-3 py-2.5 text-sm text-ink-muted">{valueOrEmpty(user.email)}</div></div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button type="submit" disabled={!editing || saving} className="rounded-lg bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple-dark disabled:cursor-default disabled:opacity-60">{saving ? 'Saving...' : 'Save Profile'}</button>
              {saveMessage && <span className={cn('text-sm', saveMessage.includes('successfully') ? 'text-emerald-600' : 'text-red-600')}>{saveMessage}</span>}
            </div>
          </form>

          <div className="mt-7 border-t border-border pt-6">
            <h2 className="mb-3 text-lg font-bold text-ink">{t.language_preferences || 'Language Preferences'}</h2>
            <select value={langCode} onChange={e => changeLang(e.target.value as typeof langCode)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink sm:max-w-xs">
              {LANGS.filter(language => ['en', 'kn', 'te', 'ta'].includes(language.code)).map(language => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
          </div>
        </section>

        <section className="mt-6 rounded-card border border-border bg-white p-5 shadow-card md:p-7">
          <div className="mb-4 flex items-center gap-2"><Package size={20} className="text-brand-purple" /><h2 className="text-lg font-bold text-ink">My Orders</h2></div>
          {ordersLoading ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-ink-muted">Loading your bookings...</div>
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-ink-muted">You haven&apos;t placed any bookings yet.</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const booking = order.booking || {};
                const product = order.product || {};
                const amount = Number(order.grandTotal || order.amount || 0);
                return (
                  <div key={order._id} className="rounded-xl border border-border bg-gray-50 p-4 md:p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        {product.image ? (
                          <img src={product.image} alt={product.name || 'Product'} className="h-16 w-16 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple">📦</div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-ink">{order.orderNumber || `Order ${order._id}`}</div>
                          <div className="text-sm font-bold text-ink">{product.name || order.productName}</div>
                          <div className="mt-1 text-xs text-ink-muted">Booking date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</div>
                          <div className="text-xs text-ink-muted">Event date: {booking.eventDate || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <div className="text-sm font-semibold text-ink">₹{amount.toLocaleString('en-IN')}</div>
                        <div className="mt-1 text-xs text-ink-muted">Payment: {order.paymentStatus || 'pending'}</div>
                        <div className="text-xs text-ink-muted">Status: {order.orderStatus || 'pending'}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <div className="text-xs text-ink-muted">{booking.location ? `Venue: ${booking.location}` : ''}</div>
                      <button type="button" onClick={() => navigate(`/orders/${order._id}`)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-white">
                        View Details <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between md:p-7">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="flex items-center justify-center gap-2 rounded-lg border border-brand-purple px-4 py-2.5 text-sm font-semibold text-brand-purple transition hover:bg-brand-purple hover:text-white"
          >
            <KeyRound size={17} /> Update Password
          </button>
          <button
            type="button"
            onClick={() => { auth.logout(); navigate('/'); }}
            className="flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={17} /> Logout
          </button>
        </section>
      </main>
    </MainLayout>
  );
}