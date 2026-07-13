import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { getApiUrl } from '../lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const cart = useCart();
  const { categories } = useProducts();
  const { t } = useLanguage();

  const cartOpen = location.pathname === '/cart';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const submit = async (e?: React.FormEvent) => {
    e && e.preventDefault();
    setError(null);
    if (!validateEmail(email)) { setError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setMessage(data.msg || 'If an account exists, a password reset link has been sent.');
    } catch (err) {
      setError('Failed to send reset link. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <MainLayout
      auth={auth}
      t={{}}
      onAssistantOpen={() => {}}
      onLogoClick={() => navigate('/')}
      showAssistantButton={false}
      showMobileMenu
      categories={categories}
      onSelectCategory={() => navigate('/')}
      assistantOpen={false}
      assistantMessages={[]}
      assistantInput={''}
      assistantInputRef={React.createRef()}
      onAssistantClose={() => {}}
      onAssistantInputChange={() => {}}
      onAssistantSubmit={() => {}}
      cartOpen={cartOpen}
      cartItems={cart.items}
      cartTotal={cart.total}
      onCartRemove={cart.removeItem}
      onCartUpdateQty={cart.updateQty}
      onCartClear={cart.clearCart}
      onCartClose={() => navigate('/')}
      onCartLoginClick={() => auth.open('login')}
      onTermsPageOpen={() => navigate('/')}
      onCloseAuth={auth.close}
      onSetAuthTab={auth.setTab}
      authModalOpen={auth.isOpen}
      authModalTab={auth.tab}
    >
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center h-12">
            <button
              onClick={goBack}
              aria-label="Back"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full p-2 text-ink-muted hover:bg-black/5"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 text-center text-lg font-semibold">Reset your password</div>
            <div style={{ width: 44 }} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md p-6">
        <h2 className="sr-only">Reset your password</h2>
        <p className="mb-4 text-sm text-ink-muted">Enter your account email and we'll send a reset link.</p>
        {message ? (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-sm font-medium">Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button type="submit" disabled={loading} className="rounded-lg bg-brand-purple py-2 text-white">{loading ? 'Sending...' : 'Send reset link'}</button>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
