import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { CartPage } from './components/CartPage';
import { HeroSlider } from './components/HeroSlider';
import { ProductSlider } from './components/ProductSlider';
import { ProductDetailPage } from './components/ProductDetailPage';
import { BookingPage } from './components/BookingPage';
import { Footer } from './components/Footer';
import { TermsPage } from './components/TermsPage';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { CategoryGrid } from './components/CategoryGrid';
import { SubcategoryScroll } from './components/SubcategoryScroll';
import { EmptyState, LoadingState } from './components/EmptyState';
import { AssistantPanel, type AssistantMessage } from './components/AssistantPanel';
import { useLanguage } from './hooks/useLanguage';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import type { AuthUser, AdminProduct, BookingDetails } from './types';

const WA_FAB = (
  <a className="wa-fab" href="https://wa.me/917022058460" target="_blank" rel="noreferrer" title="Chat on WhatsApp">
    <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
  </a>
);

export default function App() {
  const { t } = useLanguage();
  const auth = useAuth();
  const { grouped, categories, loading } = useProducts();
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [termsPage, setTermsPage] = useState<'terms' | 'privacy' | 'refund' | 'about' | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    { id: 1, sender: 'bot', text: 'Hi! I can help with packages, availability, and decor ideas. What would you like to know?' },
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const assistantInputRef = useRef<HTMLInputElement>(null);
  const [detailProduct, setDetailProduct] = useState<AdminProduct | null>(() => {
    try { return JSON.parse(sessionStorage.getItem('detailProduct') || 'null'); } catch { return null; }
  });
  const [bookingProduct, setBookingProduct] = useState<AdminProduct | null>(null);
  const [bookingMethod, setBookingMethod] = useState<'razorpay' | 'whatsapp'>('razorpay');

  const openDetail = (p: AdminProduct) => {
    sessionStorage.setItem('detailProduct', JSON.stringify(p));
    setDetailProduct(p);
    setBookingProduct(null);
  };
  const closeDetail = () => {
    sessionStorage.removeItem('detailProduct');
    setDetailProduct(null);
  };
  const openBooking = (product: AdminProduct, method: 'razorpay' | 'whatsapp' = 'razorpay') => {
    setBookingProduct(product);
    setBookingMethod(method);
    setDetailProduct(null);
  };
  const closeBooking = () => setBookingProduct(null);
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

  const handleBookingConfirm = (
    product: AdminProduct,
    bookingDetails: BookingDetails,
    method: 'razorpay' | 'whatsapp' = 'razorpay'
  ) => {
    if (method === 'razorpay') {
      cart.addItem(product, bookingDetails);
      setCartOpen(true);
    }
    setBookingProduct(null);
  };
  const handleLogin = (user: AuthUser) => auth.login(user);

  const filteredGrouped = Object.entries(grouped).reduce((acc, [cat, prods]) => {
    if (activeCategory && cat !== activeCategory) return acc;
    let filtered = search ? prods.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : prods;
    if (activeSubcategory && activeSubcategory !== '__all__' && activeCategory === cat)
      filtered = filtered.filter(p => p.subcategory === activeSubcategory);
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {} as typeof grouped);

  // ── Admin ──
  if (auth.isLoggedIn && auth.isAdmin && auth.user) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        <AdminPanel user={auth.user} onLogout={auth.logout} />
      </>
    );
  }

  // ── Product Detail Page ──
  if (bookingProduct) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        <Header
          auth={auth}
          onLogoClick={() => { setActiveCategory(null); setActiveSubcategory(null); setSearch(''); }}
          onAssistantOpen={() => setAssistantOpen(true)}
        />
        <BookingPage
          product={bookingProduct}
          preferredMethod={bookingMethod}
          onBack={closeBooking}
          onConfirm={handleBookingConfirm}
        />
        <Footer t={t} onPageOpen={setTermsPage} />
        <AssistantPanel
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          messages={assistantMessages}
          inputValue={assistantInput}
          onInputChange={setAssistantInput}
          onSubmit={handleAssistantSubmit}
          inputRef={assistantInputRef}
        />
        {WA_FAB}
        {cartOpen && (
          <CartPage
            items={cart.items}
            total={cart.total}
            onRemove={cart.removeItem}
            onUpdateQty={cart.updateQty}
            onClear={cart.clearCart}
            onClose={() => setCartOpen(false)}
            isLoggedIn={auth.isLoggedIn}
            onLoginClick={() => { setCartOpen(false); auth.open('login'); }}
          />
        )}
        {termsPage && <TermsPage pageKey={termsPage} onClose={() => setTermsPage(null)} />}
        <AuthModal isOpen={auth.isOpen} tab={auth.tab} onClose={auth.close} onSetTab={auth.setTab} onLogin={handleLogin} />
      </>
    );
  }

  if (detailProduct) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        <Header
          auth={auth}
          onLogoClick={closeDetail}
          onAssistantOpen={() => setAssistantOpen(true)}
          showMobileMenu
          categories={categories}
          onSelectCategory={(catName, subName) => {
            setActiveCategory(catName);
            setActiveSubcategory(subName || null);
            setSearch('');
            if (detailProduct) closeDetail();
          }}
        />
        <ProductDetailPage product={detailProduct} onBack={closeDetail} onBook={openBooking} />
        <Footer t={t} onPageOpen={setTermsPage} />
        <AssistantPanel
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          messages={assistantMessages}
          inputValue={assistantInput}
          onInputChange={setAssistantInput}
          onSubmit={handleAssistantSubmit}
          inputRef={assistantInputRef}
        />
        {WA_FAB}
        {termsPage && <TermsPage pageKey={termsPage} onClose={() => setTermsPage(null)} />}
        <AuthModal isOpen={auth.isOpen} tab={auth.tab} onClose={auth.close} onSetTab={auth.setTab} onLogin={handleLogin} />
      </>
    );
  }

  // ── Home Page ──
  const showHome = !activeCategory && !activeSubcategory && !search;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <Header
        auth={auth}
        onLogoClick={() => { setActiveCategory(null); setActiveSubcategory(null); setSearch(''); }}
        onAssistantOpen={() => setAssistantOpen(true)}
        showAssistantButton
        showMobileMenu
        categories={categories}
        onSelectCategory={(catName, subName) => {
          setActiveCategory(catName);
          setActiveSubcategory(subName || null);
          setSearch('');
        }}
      />

      {/* SEARCH BAR */}
      <SearchBar value={search} onChange={setSearch} />

      {/* HERO SLIDER — only on home */}
      {showHome && <HeroSlider />}

      {/* EXPLORE CATEGORIES GRID — only on home */}
      {showHome && categories.length > 0 && (
        <CategoryGrid
          categories={categories}
          onSelect={catName => { setActiveCategory(catName); setActiveSubcategory(null); }}
        />
      )}

      {/* PRODUCT SLIDERS BY CATEGORY — home only */}
      {showHome && !loading && Object.entries(grouped).map(([categoryName, products]) => (
        <ProductSlider
          key={categoryName}
          title={categoryName}
          apiProducts={products}
          t={t}
          onViewDetails={openDetail}
          onBook={openBooking}
        />
      ))}

      {/* SUBCATEGORY SCROLL */}
      {activeCategory && !activeSubcategory && !search && (() => {
        const activeCat = categories.find(c => c.name === activeCategory);
        const subs = activeCat?.subcategories?.filter(
          (s): s is { name: string; image: string } => typeof s === 'object' && s !== null
        ) ?? [];
        return (
          <SubcategoryScroll
            categoryName={activeCategory}
            subcategories={subs}
            onBack={() => { setActiveCategory(null); setActiveSubcategory(null); }}
            onSelectSubcategory={name => setActiveSubcategory(name)}
            onViewAll={() => setActiveSubcategory('__all__')}
          />
        );
      })()}

      {/* PRODUCTS */}
      {(activeSubcategory || search || !activeCategory) && !showHome && (
        loading ? (
          <LoadingState label="Loading packages..." />
        ) : Object.keys(filteredGrouped).length === 0 ? (
          <EmptyState
            title="No packages found"
            description={search ? `No results for "${search}"` : 'No packages in this category yet.'}
            actionLabel="Clear filters"
            onAction={() => { setSearch(''); setActiveSubcategory(null); setActiveCategory(null); }}
          />
        ) : (
          <>
            {activeSubcategory && activeSubcategory !== '__all__' && (
              <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 pt-4 text-sm text-ink-muted md:px-6">
                <button className="font-medium text-ink hover:text-brand-purple" onClick={() => setActiveSubcategory(null)}>&larr; {activeCategory}</button>
                <span>/ {activeSubcategory}</span>
              </div>
            )}
            {Object.entries(filteredGrouped).map(([categoryName, products]) => (
              <ProductSlider
                key={categoryName}
                title={activeSubcategory && activeSubcategory !== '__all__' ? activeSubcategory : categoryName}
                apiProducts={products}
                t={t}
                onViewDetails={openDetail}
                onBook={openBooking}
              />
            ))}
          </>
        )
      )}

      {/* SEARCH RESULTS */}
      {search && (
        loading ? (
          <LoadingState label="Searching..." />
        ) : Object.keys(filteredGrouped).length === 0 ? (
          <EmptyState
            title={`No results for "${search}"`}
            actionLabel="Clear search"
            onAction={() => setSearch('')}
          />
        ) : (
          <>
            {Object.entries(filteredGrouped).map(([categoryName, products]) => (
              <ProductSlider key={categoryName} title={categoryName} apiProducts={products} t={t} onViewDetails={openDetail} onBook={openBooking} />
            ))}
          </>
        )
      )}

      <Footer t={t} onPageOpen={setTermsPage} />
      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        messages={assistantMessages}
        inputValue={assistantInput}
        onInputChange={setAssistantInput}
        onSubmit={handleAssistantSubmit}
        inputRef={assistantInputRef}
      />
      {WA_FAB}
      {cartOpen && (
        <CartPage
          items={cart.items}
          total={cart.total}
          onRemove={cart.removeItem}
          onUpdateQty={cart.updateQty}
          onClear={cart.clearCart}
          onClose={() => setCartOpen(false)}
          isLoggedIn={auth.isLoggedIn}
          onLoginClick={() => { setCartOpen(false); auth.open('login'); }}
        />
      )}
      {termsPage && <TermsPage pageKey={termsPage} onClose={() => setTermsPage(null)} />}
      <AuthModal isOpen={auth.isOpen} tab={auth.tab} onClose={auth.close} onSetTab={auth.setTab} onLogin={handleLogin} />
    </>
  );
}
