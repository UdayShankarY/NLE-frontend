import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductSlider';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import MainLayout from '../layouts/MainLayout';
import { useCart } from '../hooks/useCart';
import { useAI } from '../context/AIContext';
import type { AdminProduct } from '../types';

export default function WishlistPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { t } = useLanguage();
  const { categories } = useProducts();
  const cart = useCart();
  const { messages, input, inputRef, setInput, sendMessage } = useAI();
  const { items, loading, error, fetchWishlist } = useWishlist();

  const products = useMemo(() => items, [items]);

  const handleViewDetails = (product: AdminProduct) => {
    navigate(`/product/${product._id}`);
  };

  const handleBook = (product: AdminProduct) => {
    if (!auth.isLoggedIn) {
      auth.open('login');
      return;
    }
    navigate(`/booking/${product._id}`);
  };

  return (
    <MainLayout
      auth={auth}
      t={t}
      onAssistantOpen={() => {}}
      onLogoClick={() => navigate('/')}
      showAssistantButton={!auth.isAdmin}
      showMobileMenu={!auth.isAdmin}
      categories={categories}
      onSelectCategory={(category, subcategory) => navigate(subcategory ? `/category/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}` : `/category/${encodeURIComponent(category)}`)}
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
      onTermsPageOpen={(key) => navigate(`/${key}`)}
      onCloseAuth={auth.close}
      onSetAuthTab={auth.setTab}
      authModalOpen={auth.isOpen}
      authModalTab={auth.tab}
    >
      <main className="mx-auto max-w-[1920px] px-4 py-6 md:px-8 lg:px-12">
        <div className="mb-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 w-fit text-sm font-bold text-brand-purple dark:text-purple-400 hover:underline cursor-pointer"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Wishlist</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Saved packages you want to remember later.</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-card border border-border bg-white dark:bg-slate-800/90 p-8 text-center text-sm text-ink-muted">Loading wishlist...</div>
        ) : error ? (
          <div className="rounded-card border border-border bg-white dark:bg-slate-800/90 p-8 text-center text-sm text-ink-muted">
            <div className="mb-2">Failed to load wishlist: {error}</div>
            <div className="flex justify-center">
              <button className="rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white" onClick={() => fetchWishlist()}>Retry</button>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-card border border-border bg-white dark:bg-slate-800/90 p-8 text-center text-sm text-ink-muted">Your wishlist is empty. Browse packages and save your favorites.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-4 sm:gap-6">
            {products.map((product) => (
              <div key={product._id}>
                <ProductCard
                  product={product}
                  onViewDetails={handleViewDetails}
                  onBook={handleBook}
                  isLanding={false}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </MainLayout>
  );
}
