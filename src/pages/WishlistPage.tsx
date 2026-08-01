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
      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink">My Wishlist</h1>
            <p className="text-sm text-ink-muted">Saved packages you want to remember later.</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-brand-purple transition hover:bg-brand-purple/5"
            onClick={() => navigate('/profile')}
          >
            Back to profile
          </button>
        </div>

        {loading ? (
          <div className="rounded-card border border-border bg-white p-8 text-center text-sm text-ink-muted">Loading wishlist...</div>
        ) : error ? (
          <div className="rounded-card border border-border bg-white p-8 text-center text-sm text-ink-muted">
            <div className="mb-2">Failed to load wishlist: {error}</div>
            <div className="flex justify-center">
              <button className="rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white" onClick={() => fetchWishlist()}>Retry</button>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-card border border-border bg-white p-8 text-center text-sm text-ink-muted">Your wishlist is empty. Browse packages and save your favorites.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
