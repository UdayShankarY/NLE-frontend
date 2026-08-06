import { useState } from "react";
import { useAI } from './context/AIContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { HeroSlider } from './components/HeroSlider';
import { ProductSlider } from './components/ProductSlider';
import { SearchBar } from './components/SearchBar';
import { CategoryGrid } from './components/CategoryGrid';
import { SubcategoryScroll } from './components/SubcategoryScroll';
import { ShareDialog } from './components/shared/ShareDialog';
import { EmptyState, LoadingState } from './components/EmptyState';
import { useLanguage } from './hooks/useLanguage';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import { useAppBack } from './hooks/useAppBack';
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
  const goBackToHome = useAppBack('/');
  const goBackToCatalogParent = useAppBack(
    activeSubcategory ? buildCatalogPath(activeCategory, null, search) : '/'
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState({ title: '', text: '', url: '' });

  const openShareDialog = async (title: string, text: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // fallback to dialog
      }
    }

    setShareData({ title, text, url });
    setShareOpen(true);
  };

  const openCategoryShare = () => {
    if (!activeCategory) return;
    openShareDialog(
      activeCategory,
      `Explore packages in ${activeCategory}`,
      `${window.location.origin}/category/${encodeURIComponent(activeCategory)}`
    );
  };

  const openSubcategoryShare = () => {
    if (!activeCategory || !activeSubcategory) return;
    openShareDialog(
      activeSubcategory,
      `Explore ${activeSubcategory} packages in ${activeCategory}`,
      `${window.location.origin}/category/${encodeURIComponent(activeCategory)}/${encodeURIComponent(activeSubcategory)}`
    );
  };

  const openBooking = (product: AdminProduct) => {
    if (!auth.isLoggedIn) {
      auth.setAuthRedirect({
        pathname: `/product/${product._id}`,
        state: {
          from: `${location.pathname}${location.search}${location.hash}`,
          sourceState: location.state,
        },
      });
      auth.open('login');
      return;
    }

    navigate(`/booking/${product._id}`, { state: { from: `${location.pathname}${location.search}` } });
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
    goBackToHome();
  };

  const handleViewDetails = (product: AdminProduct) => {
    navigate(`/product/${product._id}`, { state: { from: `${location.pathname}${location.search}` } });
  };

  const pageContent = (() => {
    const showHome = !activeCategory && !activeSubcategory && !search;
    const isCategorySubcategoryListing = activeCategory && !activeSubcategory;

    return (
      <div className="pb-12 md:pb-20">
        {!isCategorySubcategoryListing && (
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            category={activeCategory}
            subcategory={activeSubcategory}
          />
        )}

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
            isLanding
          />
        ))}

        {isCategorySubcategoryListing && (() => {
          const activeCat = categories.find(c => c.name === activeCategory);
          const subs = activeCat?.subcategories?.filter(
            (s): s is { name: string; image: string } => typeof s === 'object' && s !== null
          ) ?? [];
          return (
            <SubcategoryScroll
              categoryName={activeCategory}
              subcategories={subs}
              onBack={goBackToCatalogParent}
              onSelectSubcategory={name => navigate(buildCatalogPath(activeCategory, name, ''))}
              onViewAll={() => navigate(buildCatalogPath(activeCategory, null, ''))}
              onShare={openCategoryShare}
            />
          );
        })()}

        {(activeSubcategory || search) && !showHome && (
          loading ? (
            <div style={{ animation: 'fadeIn 0.3s ease both' }}>
              <LoadingState label="Loading packages..." />
            </div>
          ) : Object.keys(filteredGrouped).length === 0 ? (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <EmptyState
                title="No packages found"
                description={search ? `No results for "${search}"` : 'No packages in this category yet.'}
                actionLabel="Clear filters"
                onAction={() => navigate('/')}
              />
            </div>
          ) : (
            <>
              {activeSubcategory && activeSubcategory !== '__all__' && (
                <div className="mx-auto max-w-[1920px] px-3.5 pt-3 pb-1 sm:px-6 md:px-8 lg:px-12 sm:pt-6 animate-fadeIn">
                  {/* 1. Breadcrumb Navigation */}
                  <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                    <button
                      type="button"
                      className="font-medium hover:text-brand-purple dark:hover:text-purple-300 transition-colors"
                      onClick={() => navigate('/')}
                    >
                      Home
                    </button>
                    <span className="text-gray-300 dark:text-slate-600">/</span>
                    <button
                      type="button"
                      className="font-medium hover:text-brand-purple dark:hover:text-purple-300 transition-colors"
                      onClick={() => navigate(buildCatalogPath(activeCategory, null, ''))}
                    >
                      {activeCategory}
                    </button>
                    <span className="text-gray-300 dark:text-slate-600">/</span>
                    <span className="font-bold text-gray-900 dark:text-white">{activeSubcategory}</span>
                  </div>

                  {/* 2. Main Header Row (Title + Share Button on the right) */}
                  <div className="flex items-center justify-between gap-3">
                    <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
                      {activeSubcategory}
                    </h1>

                    <button
                      type="button"
                      onClick={openSubcategoryShare}
                      className="inline-flex h-9 min-w-max items-center justify-center gap-1.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-semibold text-gray-700 dark:text-slate-200 shadow-xs transition-all duration-200 hover:border-brand-purple/40 hover:bg-brand-purple hover:text-white active:scale-95 flex-shrink-0"
                      aria-label="Share collection"
                    >
                      <Share2 size={14} />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* 3. Subtitle */}
                  <p className="mt-1 max-w-xl text-xs sm:text-sm font-normal text-gray-500 dark:text-slate-400 leading-relaxed">
                    Verified event setups and packages for your celebration in Bengaluru.
                  </p>

                  {/* 4. Metadata Row */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 text-[11px] font-bold text-brand-purple dark:text-purple-300 border border-brand-purple/10 dark:border-purple-800/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-purple dark:bg-purple-400" />
                      {activeCategory}
                    </span>
                    {(() => {
                      const count = Object.values(filteredGrouped).reduce((acc, list) => acc + list.length, 0);
                      return count > 0 ? (
                        <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:text-slate-300">
                          {count} {count === 1 ? 'Package' : 'Packages'}
                        </span>
                      ) : null;
                    })()}
                  </div>

                  {/* 5. Divider */}
                  <div className="mt-3 mb-1 border-b border-gray-100 dark:border-slate-800" />
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
      </div>
    );
  })();

  return (
    <MainLayout
      auth={auth}
      t={t}
      onAssistantOpen={() => setAssistantOpen(true)}
      onLogoClick={handleLogoClick}
      showAssistantButton={!auth.isAdmin}
      showMobileMenu={!auth.isAdmin}
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
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={shareData.title}
        text={shareData.text}
        url={shareData.url}
      />
    </MainLayout>
  );
}
