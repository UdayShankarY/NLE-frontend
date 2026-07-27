import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { getApiUrl } from '../lib/api';

function getStrength(val: string) {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  return score;
}

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const cart = useCart();
  const { categories } = useProducts();
  const { t } = useLanguage();

  const cartOpen = location.pathname === '/cart';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (getStrength(password) < 2) { setError('Password is too weak'); return; }
    if (!token) { setError('Invalid reset link'); return; }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/auth/reset-password/${token}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || 'Reset failed');
      } else {
        setSuccess('Password reset successful. You can now login with your new password.');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setError('Reset failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(password);

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
      assistantInputRef={React.createRef<HTMLInputElement>()}
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
              onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }}
              aria-label="Back"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full p-2 text-ink-muted hover:bg-black/5"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 text-center text-lg font-semibold">Set a new password</div>
            <div style={{ width: 44 }} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md p-6">
        <h2 className="sr-only">Set a new password</h2>
        <p className="mb-4 text-sm text-ink-muted">Choose a secure password for your account.</p>
        {success ? (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-sm font-medium">New password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
            <div className="text-xs text-ink-muted">Strength: {['Very weak','Weak','Okay','Good','Strong'][strength] || 'Very weak'}</div>
            <label className="text-sm font-medium">Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button type="submit" disabled={loading} className="rounded-lg bg-brand-purple py-2 text-white">{loading ? 'Saving...' : 'Set new password'}</button>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
