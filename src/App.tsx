import { useState } from "react";
import { useAI } from './context/AIContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { HeroSlider } from './components/HeroSlider';
import { ProductSlider } from './components/ProductSlider';
import { SearchBar } from './components/SearchBar';
import { CategoryGrid } from './components/CategoryGrid';
import { SubcategoryScroll } from './components/SubcategoryScroll';
import { EmptyState, LoadingState } from './components/EmptyState';
import { useLanguage } from './hooks/useLanguage';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import MainLayout from './layouts/MainLayout';
import type { AdminProduct } from './types';




const buildCatalogPath = (category: string | null, subcategory: string | null, search: string | null) => {
  const normalizedCategory = category?.trim() ?? null;
  const normalizedSubcategory = subcategory?.trim() ?? null;
  const hasSearch = (search ?? '').trim();

  const pathname = normalizedCategory
    ? normalizedSubcategory && normalizedSubcategory !== '__all__'
      ? `/category/${encodeURIComponent(normalizedCategory)}/${encodeURIComponent(normalizedSubcategory)}`
      : `/category/${encodeURIComponent(normalizedCategory)}`
    : '/';

  if (!hasSearch) return pathname;
  const query = new URLSearchParams();
  query.set('search', hasSearch);
  return `${pathname}?${query.toString()}`;
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = useParams<{ category?: string; subcategory?: string }>();
  const { t } = useLanguage();
  const auth = useAuth();
  const { grouped, categories, loading } = useProducts();
  const cart = useCart();
  const [assistantOpen, setAssistantOpen] = useState(false);
  
  const {
    messages,
    input,
    inputRef,
    setInput, 
    sendMessage,
  } = useAI();
    
  const activeCategory = params.category ? decodeURIComponent(params.category) : null;
  const activeSubcategory = params.subcategory ? decodeURIComponent(params.subcategory) : null;
  const search = new URLSearchParams(location.search).get('search') ?? '';
  const cartOpen = location.pathname === '/cart';
  const openBooking = (product: AdminProduct) => {
    navigate(`/booking/${product._id}`);
  };


  

  

  // Post-login handled centrally in MainLayout; pass no onLogin to avoid duplication
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
    navigate('/');
  };

  const handleCatalogSelect = (catName: string, subName?: string) => {
    navigate(buildCatalogPath(catName, subName && subName !== '__all__' ? subName : null, ''));
  };

  const handleSearchChange = (value: string) => {
    navigate(buildCatalogPath(activeCategory, activeSubcategory, value));
  };

  const handleCartClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleViewDetails = (product: AdminProduct) => {
    navigate(`/product/${product._id}`);
  };

  const pageContent = (() => {
    const showHome = !activeCategory && !activeSubcategory && !search;

    return (
      <>
        <SearchBar value={search} onChange={handleSearchChange} />

        {showHome && <HeroSlider />}

        {showHome && categories.length > 0 && (
          <CategoryGrid
            categories={categories}
            onSelect={handleCatalogSelect}
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
              onBack={() => navigate(buildCatalogPath(activeCategory, null, search))}
              onSelectSubcategory={name => navigate(buildCatalogPath(activeCategory, name, ''))}
              onViewAll={() => navigate(buildCatalogPath(activeCategory, null, ''))}
            />
          );
        })()}

        {(activeSubcategory || search) && !showHome && (
          loading ? (
            <LoadingState label="Loading packages..." />
          ) : Object.keys(filteredGrouped).length === 0 ? (
            <EmptyState
              title="No packages found"
              description={search ? `No results for "${search}"` : 'No packages in this category yet.'}
              actionLabel="Clear filters"
              onAction={() => navigate('/')}
            />
          ) : (
            <>
              {activeSubcategory && activeSubcategory !== '__all__' && (
                <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 pt-4 text-sm text-ink-muted md:px-6">
                  <button className="font-medium text-ink hover:text-brand-purple" onClick={() => navigate(buildCatalogPath(activeCategory, null, search))}>&larr; {activeCategory}</button>
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
      onSelectCategory={handleCatalogSelect}
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
      onCartClose={handleCartClose}
      onCartLoginClick={() => auth.open('login')}
      onTermsPageOpen={handleTermsPageOpen}
      onCloseAuth={auth.close}
      onSetAuthTab={auth.setTab}
      authModalOpen={auth.isOpen}
      authModalTab={auth.tab}
    >
      {pageContent}
    </MainLayout>
  );
}
