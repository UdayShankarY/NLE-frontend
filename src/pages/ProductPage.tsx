import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ProductDetailPage } from '../components/ProductDetailPage';
import { LoadingState } from '../components/EmptyState';
import MainLayout from '../layouts/MainLayout';
import { useAI } from '../context/AIContext';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { trackViewItem } from '../lib/analytics';
import { useAppBack } from '../hooks/useAppBack';

export default function ProductPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const { t } = useLanguage();
  const auth = useAuth();
  const cart = useCart();
  const { grouped, categories, loading } = useProducts();

  const cartOpen = location.pathname === '/cart';
  const goBackToHome = useAppBack('/');
  const [assistantOpen, setAssistantOpen] = useState(false);

  const {
    messages,
    input,
    inputRef,
    setInput,
    sendMessage,
  } = useAI();

  // Post-login handled centrally in MainLayout
  const handleTermsPageOpen = (
    pageKey: 'terms' | 'privacy' | 'refund' | 'about'
  ) => {
    const routes = {
      terms: '/terms',
      privacy: '/privacy',
      refund: '/refund',
      about: '/about',
    } as const;

    navigate(routes[pageKey]);
  };

  const product = React.useMemo(() => {
    return Object.values(grouped)
      .flat()
      .find((item) => item._id === id) || null;
  }, [grouped, id]);

  const fallbackPath = typeof location.state?.from === 'string'
    ? location.state.from
    : product
      ? `/category/${encodeURIComponent(product.categoryName)}${product.subcategory ? `/${encodeURIComponent(product.subcategory)}` : ''}`
      : '/';
  const goBack = useAppBack(fallbackPath);

  const handleBook = (selectedProduct: typeof product, _method?: 'razorpay' | 'whatsapp', selectedAddOns?: { id?: string; name: string; price: number }[]) => {
    if (!selectedProduct) return;
    if (!auth.isLoggedIn) {
      auth.setAuthRedirect({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        state: location.state,
      });
      auth.open('login');
      return;
    }

    navigate(`/booking/${selectedProduct._id}`, {
      state: { from: `${location.pathname}${location.search}`, selectedAddOns: selectedAddOns || [] },
    });
  };

  useEffect(() => {
    if (product) {
      trackViewItem(
        product._id,
        product.name,
        product.categoryName,
        product.price
      );
    }
  }, [product]);

  const content = loading ? (
    <LoadingState label="Loading package..." />
  ) : product ? (
    <ProductDetailPage
      product={product}
      onBack={goBack}
      onBook={handleBook}
    />
  ) : (
    <div className="mx-auto max-w-[1400px] px-4 py-8 text-sm text-ink-muted">
      Package not found.
    </div>
  );

  return (
    <MainLayout
      auth={auth}
      t={t}
      onAssistantOpen={() => setAssistantOpen(true)}
      onLogoClick={() => navigate('/')}
      showAssistantButton={false}
      showMobileMenu
      categories={categories}
      onSelectCategory={() => navigate('/')}

      assistantOpen={assistantOpen}
      assistantMessages={messages}
      assistantInput={input}
      assistantInputRef={inputRef}
      onAssistantClose={() => setAssistantOpen(false)}
      onAssistantInputChange={setInput}
      onAssistantSubmit={sendMessage}

      cartOpen={cartOpen}
      cartItems={cart.items}
      cartTotal={cart.total}
      onCartRemove={cart.removeItem}
      onCartUpdateQty={cart.updateQty}
      onCartClear={cart.clearCart}

      onCartClose={() => {
        goBackToHome();
      }}

      onCartLoginClick={() => auth.open('login')}
      onTermsPageOpen={handleTermsPageOpen}
      onCloseAuth={auth.close}
      onSetAuthTab={auth.setTab}
      authModalOpen={auth.isOpen}
      authModalTab={auth.tab}
    >
      {content}
    </MainLayout>
  );
}