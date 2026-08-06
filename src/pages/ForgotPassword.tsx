import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { useAppBack } from '../hooks/useAppBack';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { getApiUrl } from '../lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const cart = useCart();
  const { categories } = useProducts();

  const cartOpen = location.pathname === '/cart';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const submit = async (e?: React.FormEvent) => {
    e && e.preventDefault();
    setError(null);
    if (!validateEmail(email)) { setError('Please enter a valid email address'); return; }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setMessage(data.msg || 'If an account exists, a password reset link has been sent to your email.');
    } catch (err) {
      setError('Failed to send reset link. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = useAppBack('/');

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
      {/* Mobile top subheader */}
      <div className="sticky top-16 z-20 border-b border-gray-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1920px] items-center justify-between px-4 md:px-6">
          <BackButton onClick={goBack} aria-label="Back to home" />
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white md:text-base">Reset password</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">Reset password</h2>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-slate-400 sm:text-sm">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {message ? (
            <div className="space-y-4 text-center">
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40 p-4 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {message}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-xs font-semibold text-brand-purple dark:text-purple-400 hover:underline"
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={14} /> Return to Home
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="forgotEmailInput" className="text-xs font-medium text-gray-700 dark:text-slate-200">
                  Email Address
                </label>
                <div
                  className={`flex h-11 items-center gap-2.5 rounded-xl border bg-white dark:bg-slate-800 px-3.5 transition-all duration-200 ${
                    error
                      ? 'border-red-300 dark:border-red-500/50 ring-2 ring-red-50 dark:ring-red-950/30'
                      : 'border-gray-200 dark:border-slate-700 focus-within:border-brand-purple/60 dark:focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-brand-purple/10 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Mail size={16} className="text-gray-400 dark:text-slate-400" />
                  <input
                    id="forgotEmailInput"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-sm text-gray-900 dark:text-slate-100 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>
                {error && <span className="text-xs font-medium text-red-500">{error}</span>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-[47px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple via-purple-700 to-brand-purple-dark px-5 text-sm sm:text-base font-bold text-white shadow-md shadow-brand-purple/20 transition-all duration-200 hover:shadow-lg hover:shadow-brand-purple/30 hover:scale-[1.005] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <>
                    <span>Send reset link</span>
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>

              <div className="mt-1 text-center">
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-purple hover:underline"
                  onClick={() => auth.open('login')}
                >
                  ← Back to log in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
