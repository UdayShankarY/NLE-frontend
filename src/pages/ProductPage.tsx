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
import { getApiUrl } from '../lib/api';
import type { AdminProduct, BookingAddonSnapshot } from '../types';
import { SeoHead } from '../components/SeoHead';

export default function ProductPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const { t } = useLanguage();
  const auth = useAuth();
  const cart = useCart();
  const { grouped, categories, loading: productsLoading } = useProducts();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [productLoading, setProductLoading] = useState(Boolean(id));

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

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setProductLoading(false);
      return;
    }

    let isMounted = true;
    setProductLoading(true);

    fetch(getApiUrl(`/api/products/${id}`))
      .then(async (res) => {
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        if (isMounted) {
          setProduct(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProduct(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setProductLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const fallbackProduct = React.useMemo(() => {
    return Object.values(grouped)
      .flat()
      .find((item) => item._id === id) || null;
  }, [grouped, id]);

  const resolvedProduct = product || fallbackProduct;

  const fallbackPath = typeof location.state?.from === 'string'
    ? location.state.from
    : resolvedProduct
      ? `/category/${encodeURIComponent(resolvedProduct.categoryName)}${resolvedProduct.subcategory ? `/${encodeURIComponent(resolvedProduct.subcategory)}` : ''}`
      : '/';
  const goBack = useAppBack(fallbackPath);

  const handleBook = (selectedProduct: typeof resolvedProduct, _method?: 'razorpay' | 'whatsapp', selectedAddOns?: BookingAddonSnapshot[]) => {
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
    if (resolvedProduct) {
      trackViewItem({
        item_id: resolvedProduct._id,
        item_name: resolvedProduct.name,
        item_category: resolvedProduct.categoryName,
        item_subcategory: resolvedProduct.subcategory,
        price: resolvedProduct.price,
      });
    }
  }, [resolvedProduct]);

  const content = productsLoading || productLoading ? (
    <LoadingState label="Loading package..." />
  ) : resolvedProduct ? (
    <ProductDetailPage
      product={resolvedProduct}
      onBack={goBack}
      onBook={handleBook}
    />
  ) : (
    <div className="mx-auto max-w-[1400px] px-4 py-8 text-sm text-ink-muted">
      Package not found.
    </div>
  );

  return (
    <>
      {resolvedProduct && (
        <SeoHead
          title={resolvedProduct.name}
          description={resolvedProduct.description}
          image={resolvedProduct.image}
          url={`${window.location.origin}/product/${resolvedProduct._id}`}
          type="product"
          siteName="TheDecorParty"
        />
      )}
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
    </>
  );
}