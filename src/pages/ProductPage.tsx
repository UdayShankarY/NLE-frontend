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

export default function ProductPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const { t } = useLanguage();
  const auth = useAuth();
  const cart = useCart();
  const { grouped, categories, loading } = useProducts();

  const cartOpen = location.pathname === '/cart';
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
      onBack={() => navigate(-1)}
      onBook={(selectedProduct) =>
        navigate(`/booking/${selectedProduct._id}`)
      }
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
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/');
        }
      }}

      onCartLoginClick={() => auth.open('login')}
      onTermsPageOpen={handleTermsPageOpen}
      onCloseAuth={auth.close}
      onSetAuthTab={auth.setTab}
      onLogin={() => auth.open('login')}
      authModalOpen={auth.isOpen}
      authModalTab={auth.tab}
    >
      {content}
    </MainLayout>
  );
}