import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSlider } from './components/HeroSlider';
import { ProductSlider } from './components/ProductSlider';
import { SearchBar } from './components/SearchBar';
import { CategoryGrid } from './components/CategoryGrid';
import { SubcategoryScroll } from './components/SubcategoryScroll';
import { EmptyState, LoadingState } from './components/EmptyState';
import type { AssistantMessage } from './components/AssistantPanel';
import { useLanguage } from './hooks/useLanguage';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import MainLayout from './layouts/MainLayout';
import type { AuthUser, AdminProduct } from './types';

export default function App() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const auth = useAuth();
  const { grouped, categories, loading } = useProducts();
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    { id: 1, sender: 'bot', text: 'Hi! I can help with packages, availability, and decor ideas. What would you like to know?' },
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const assistantInputRef = useRef<HTMLInputElement>(null);

  const openBooking = (product: AdminProduct) => {
    navigate(`/booking/${product._id}`);
  };
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

  const filteredGrouped = Object.entries(grouped).reduce((acc, [cat, prods]) => {
    if (activeCategory && cat !== activeCategory) return acc;
    let filtered = search ? prods.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : prods;
    if (activeSubcategory && activeSubcategory !== '__all__' && activeCategory === cat)
      filtered = filtered.filter(p => p.subcategory === activeSubcategory);
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {} as typeof grouped);

  const handleLogoClick = () => {
    setActiveCategory(null);
    setActiveSubcategory(null);
    setSearch('');
  };

  const handleViewDetails = (product: AdminProduct) => {
    navigate(`/product/${product._id}`);
  };

  const pageContent = (() => {
    const showHome = !activeCategory && !activeSubcategory && !search;

    return (
      <>
        <SearchBar value={search} onChange={setSearch} />

        {showHome && <HeroSlider />}

        {showHome && categories.length > 0 && (
          <CategoryGrid
            categories={categories}
            onSelect={catName => { setActiveCategory(catName); setActiveSubcategory(null); }}
          />
        )}

        {showHome && !loading && Object.entries(grouped).map(([categoryName, products]) => (
          <ProductSlider
            key={categoryName}
            title={categoryName}
            apiProducts={products}
            t={t}
            onViewDetails={handleViewDetails}
            onBook={openBooking}
          />
        ))}

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
                  onViewDetails={handleViewDetails}
                  onBook={openBooking}
                />
              ))}
            </>
          )
        )}

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
                <ProductSlider key={categoryName} title={categoryName} apiProducts={products} t={t} onViewDetails={handleViewDetails} onBook={openBooking} />
              ))}
            </>
          )
        )}
      </>
    );
  })();

  return (
    <MainLayout
      auth={auth}
      t={t}
      onAssistantOpen={() => setAssistantOpen(true)}
      onLogoClick={handleLogoClick}
      showAssistantButton={!auth.isLoggedIn && !auth.isAdmin}
      showMobileMenu={!auth.isLoggedIn && !auth.isAdmin}
      categories={categories}
      onSelectCategory={(catName, subName) => {
        setActiveCategory(catName);
        setActiveSubcategory(subName || null);
        setSearch('');
      }}
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
      {pageContent}
    </MainLayout>
  );
}
