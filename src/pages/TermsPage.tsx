import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAI } from '../context/AIContext';
import { TermsPage as TermsContent } from '../components/TermsPage';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { useAppBack } from '../hooks/useAppBack';

const ROUTE_TO_PAGEKEY = {
  '/terms': 'terms',
  '/privacy': 'privacy',
  '/refund': 'refund',
  '/about': 'about',
} as const;

export default function TermsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useLanguage();
  const auth = useAuth();
  const cart = useCart();
  const { categories } = useProducts();

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

  const pageKey =
    ROUTE_TO_PAGEKEY[
      location.pathname as keyof typeof ROUTE_TO_PAGEKEY
    ] || 'terms';

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
      onTermsPageOpen={() => navigate('/')}
      onCloseAuth={auth.close}
      onSetAuthTab={auth.setTab}
      authModalOpen={auth.isOpen}
      authModalTab={auth.tab}
    >
      <TermsContent
        pageKey={pageKey}
        onClose={goBackToHome}
      />
    </MainLayout>
  );
}