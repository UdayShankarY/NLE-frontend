import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookingPage as BookingForm } from '../components/BookingPage';
import type { AssistantMessage } from '../components/AssistantPanel';
import { LoadingState } from '../components/EmptyState';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import type { AdminProduct, AuthUser, BookingDetails } from '../types';

export default function BookingRoutePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const auth = useAuth();
  const cart = useCart();
  const { grouped, categories, loading } = useProducts();

  const [cartOpen, setCartOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    { id: 1, sender: 'bot', text: 'Hi! I can help with packages, availability, and decor ideas. What would you like to know?' },
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const assistantInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (assistantOpen) {
      window.requestAnimationFrame(() => assistantInputRef.current?.focus());
    }
  }, [assistantOpen]);

  const getAssistantReply = (message: string) => {
    const text = message.toLowerCase();
    if (text.includes('price') || text.includes('cost')) {
      return 'Our packages vary by theme and guest count. Share your event type and number of guests and I will guide you to the best option.';
    }
    if (text.includes('book') || text.includes('availability') || text.includes('date')) {
      return 'We can help check availability for your preferred date. Tell me your date and city and I will point you to the next step.';
    }
    return 'Thanks for reaching out! I can help with packages, availability, and decor ideas. Tell me a little more about your event.';
  };

  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = assistantInput.trim();
    if (!trimmed) return;

    const userMessage: AssistantMessage = { id: Date.now(), sender: 'user', text: trimmed };
    const botMessage: AssistantMessage = { id: Date.now() + 1, sender: 'bot', text: getAssistantReply(trimmed) };

    setAssistantMessages(prev => [...prev, userMessage, botMessage]);
    setAssistantInput('');
  };

  const handleLogin = (user: AuthUser) => auth.login(user);
  const handleTermsPageOpen = (pageKey: 'terms' | 'privacy' | 'refund' | 'about') => {
    const routes = {
      terms: '/terms',
      privacy: '/privacy',
      refund: '/refund',
      about: '/about',
    } as const;
    navigate(routes[pageKey]);
  };

  const product = React.useMemo(() => {
    return Object.values(grouped).flat().find(item => item._id === id) || null;
  }, [grouped, id]);

  const handleBookingConfirm = (
    selectedProduct: AdminProduct,
    bookingDetails: BookingDetails,
    method: 'razorpay' | 'whatsapp' = 'razorpay'
  ) => {
    if (method === 'razorpay') {
      cart.addItem(selectedProduct, bookingDetails);
      setCartOpen(true);
    }
  };

  const content = loading ? (
    <LoadingState label="Loading booking..." />
  ) : product ? (
    <BookingForm
      product={product}
      preferredMethod="razorpay"
      onBack={() => navigate(-1)}
      onConfirm={handleBookingConfirm}
    />
  ) : (
    <div className="mx-auto max-w-[1400px] px-4 py-8 text-sm text-ink-muted">Package not found.</div>
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
      assistantMessages={assistantMessages}
      assistantInput={assistantInput}
      assistantInputRef={assistantInputRef}
      onAssistantClose={() => setAssistantOpen(false)}
      onAssistantInputChange={setAssistantInput}
      onAssistantSubmit={handleAssistantSubmit}
      cartOpen={cartOpen}
      cartItems={cart.items}
      cartTotal={cart.total}
      onCartRemove={cart.removeItem}
      onCartUpdateQty={cart.updateQty}
      onCartClear={cart.clearCart}
      onCartClose={() => setCartOpen(false)}
      onCartLoginClick={() => { setCartOpen(false); auth.open('login'); }}
      termsPage={null}
      onTermsPageOpen={handleTermsPageOpen}
      onTermsPageClose={() => navigate(-1)}
      onLogin={handleLogin}
      onCloseAuth={auth.close}
      onSetAuthTab={auth.setTab}
      authModalOpen={auth.isOpen}
      authModalTab={auth.tab}
    >
      {content}
    </MainLayout>
  );
}
