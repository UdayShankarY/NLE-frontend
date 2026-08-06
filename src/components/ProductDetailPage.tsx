import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp, Share2, Heart, ShieldCheck, CheckCircle2, X, Zap, Lock, Palette } from 'lucide-react';
import type { AdminProduct, BookingAddonSnapshot } from '../types';
import { cn } from '../lib/utils';
import { BackButton } from './BackButton';
import { ShareDialog } from './shared/ShareDialog';
import { trackBookingStarted, trackWhatsappClick } from '../lib/analytics';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import { ProductCard } from './ProductSlider';
import { GlobalAddonsActivitiesModule } from './GlobalAddonsActivitiesModule';

interface Props {
  product: AdminProduct;
  onBack: () => void;
  onBook: (product: AdminProduct, method?: 'razorpay' | 'whatsapp', selectedAddOns?: BookingAddonSnapshot[]) => void;
}

const TERMS = [
  'Booking is confirmed only after advance payment and written confirmation from our team.',
  'Cancellations made 48+ hours before the event are eligible for a full refund.',
  'Cancellations within 24-48 hours will incur a 50% cancellation fee.',
  'No refund for cancellations made less than 24 hours before the event.',
  'The venue/location must be accessible at least 2 hours before the event start time for setup.',
  'Any damage to props or decor caused by guests will be charged separately.',
  'Add-ons must be confirmed at least 24 hours in advance.',
  'TheDecorParty reserves the right to substitute items of equal or greater value if specific items are unavailable.',
  'Prices are inclusive of setup and breakdown. GST applicable as per government norms.',
  'For outdoor events, we are not responsible for weather-related disruptions.',
];

const WA_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const badgeColorClass: Record<string, string> = {
  purple: 'bg-brand-purple text-white',
  gold: 'bg-amber-400 text-white',
  green: 'bg-emerald-500 text-white',
  red: 'bg-red-500 text-white',
};

export const ProductDetailPage: React.FC<Props> = ({ product, onBack, onBook }) => {
  const { t } = useLanguage();
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { grouped } = useProducts();
  const { wishlistIds, toggleWishlist } = useWishlist();

  const [localWished, setLocalWished] = useState<boolean | null>(null);

  const allImages = useMemo(() => [product.image, ...(product.moreImages || [])].filter(Boolean), [product]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [termsOpen, setTermsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [fullScreenModalOpen, setFullScreenModalOpen] = useState(false);
  const [fullScreenIdx, setFullScreenIdx] = useState(0);

  const [globalSelections, setGlobalSelections] = useState<{ addons: BookingAddonSnapshot[]; activities: BookingAddonSnapshot[] }>({ addons: [], activities: [] });
  const swipeTrackRef = useRef<HTMLDivElement>(null);

  // Reset local override when viewing a different product
  useEffect(() => {
    setLocalWished(null);
  }, [product._id]);

  // Synchronized Wishlist check with instant 0ms optimistic override
  const isWished = useMemo(() => {
    if (localWished !== null) return localWished;
    if (wishlistIds.has(product._id)) return true;
    if (Array.isArray(auth.user?.wishlist)) {
      return auth.user!.wishlist.some(id => String(id) === String(product._id));
    }
    return false;
  }, [localWished, wishlistIds, product._id, auth.user?.wishlist]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveIdx(0);
    if (swipeTrackRef.current) {
      swipeTrackRef.current.scrollLeft = 0;
    }
  }, [product._id]);

  // Keyboard navigation & ESC listener for full-screen viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullScreenModalOpen(false);
      if (e.key === 'ArrowRight' && fullScreenModalOpen) {
        setFullScreenIdx(prev => Math.min(allImages.length - 1, prev + 1));
      }
      if (e.key === 'ArrowLeft' && fullScreenModalOpen) {
        setFullScreenIdx(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allImages.length, fullScreenModalOpen]);

  const scrollToIdx = (idx: number) => {
    const targetIdx = Math.max(0, Math.min(allImages.length - 1, idx));
    setActiveIdx(targetIdx);
    if (swipeTrackRef.current) {
      const width = swipeTrackRef.current.clientWidth;
      swipeTrackRef.current.scrollTo({ left: targetIdx * width, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!swipeTrackRef.current) return;
    const width = swipeTrackRef.current.clientWidth;
    if (width > 0) {
      const newIdx = Math.round(swipeTrackRef.current.scrollLeft / width);
      if (newIdx !== activeIdx && newIdx >= 0 && newIdx < allImages.length) {
        setActiveIdx(newIdx);
      }
    }
  };

  const openFullScreen = (idx: number) => {
    setFullScreenIdx(idx);
    setFullScreenModalOpen(true);
  };

  const showDebugAddons = new URLSearchParams(location.search).get('debugAddons') === '1';

  const selectedGlobalAddons = globalSelections.addons.map((item) => ({ ...item, qty: 1, kind: 'addon' as const }));
  const selectedGlobalActivities = globalSelections.activities.map((item) => ({ ...item, qty: 1, kind: 'activity' as const }));
  const bookingSelections = [...selectedGlobalAddons, ...selectedGlobalActivities];
  const totalPrice = product.price + selectedGlobalAddons.reduce((sum, addon) => sum + (addon.price || 0), 0) + selectedGlobalActivities.reduce((sum, activity) => sum + (activity.price || 0), 0);

  const handleGlobalSelectionChange = useCallback((addons: BookingAddonSnapshot[], activities: BookingAddonSnapshot[]) => {
    setGlobalSelections({
      addons: addons.map((item) => ({ ...item, qty: 1 })),
      activities: activities.map((item) => ({ ...item, qty: 1 })),
    });
  }, []);

  // Filter SIMILAR PRODUCTS: Same ROOT category, excluding current product
  const similarProducts = useMemo(() => {
    if (!product.categoryName) return [];
    const rootCatProducts = grouped[product.categoryName] || [];
    return rootCatProducts.filter(p => p._id !== product._id);
  }, [grouped, product.categoryName, product._id]);

  const handleShareClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const shareUrl = `${window.location.origin}/share/product/${product._id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl, title: product.name });
        return;
      } catch {}
    }
    setShareOpen(true);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!auth.isLoggedIn) {
      auth.open('login');
      return;
    }
    const next = !isWished;
    setLocalWished(next);
    toggleWishlist(product, next).then((success) => {
      if (!success) setLocalWished(!next);
    });
  };

  return (
    <div className="mx-auto max-w-[1920px] px-4 py-4 md:px-8 lg:px-12 animate-fadeIn pb-24 sm:pb-8">

      {/* Breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
        <BackButton onClick={onBack} className="font-medium hover:text-brand-purple dark:hover:text-purple-300">
          {t.back || 'Back'}
        </BackButton>
        <span>/</span>
        <span className="font-medium hover:underline cursor-pointer" onClick={() => navigate(`/category/${encodeURIComponent(product.categoryName)}`)}>
          {product.categoryName}
        </span>
        {product.subcategory && (
          <>
            <span>/</span>
            <span className="font-medium">{product.subcategory}</span>
          </>
        )}
        <span>/</span>
        <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 items-start">

        {/* 1. HERO GALLERY WITH TAP-TO-EXPAND & TOUCH SWIPE */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full h-[280px] sm:h-[400px] lg:h-[480px] overflow-hidden rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 shadow-xs">
            
            {/* FLOATING ACTION OVERLAY BUTTONS (z-30 pointer-events-auto) */}
            <div className="absolute right-3.5 top-3.5 z-30 pointer-events-auto flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleShareClick}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 text-gray-700 dark:text-slate-200 shadow-md backdrop-blur-md transition-all hover:scale-110 hover:bg-white dark:hover:bg-slate-900 active:scale-95 cursor-pointer"
                aria-label="Share package"
                title="Share Package"
              >
                <Share2 size={18} />
              </button>

              {/* Heart wishlist button - SOLID RED FILL when active */}
              <button
                type="button"
                onClick={handleWishlistClick}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer",
                  isWished
                    ? "border-rose-300 bg-rose-50/95 dark:border-rose-900/80 dark:bg-rose-950/95 text-rose-500 shadow-rose-500/20"
                    : "border-gray-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 text-gray-700 dark:text-slate-200 hover:text-rose-500"
                )}
                aria-label="Toggle wishlist"
                title={isWished ? "Remove from Wishlist" : "Save to Wishlist"}
              >
                <Heart
                  size={18}
                  className={cn(
                    "transition-all duration-300",
                    isWished ? "fill-rose-500 text-rose-500 scale-110" : "fill-transparent text-current"
                  )}
                />
              </button>
            </div>

            {/* Scrollable image track */}
            <div
              ref={swipeTrackRef}
              onScroll={handleScroll}
              className="flex h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x"
            >
              {allImages.map((img, i) => (
                <div
                  key={i}
                  className="h-full w-full flex-shrink-0 snap-start flex items-center justify-center p-3 sm:p-6"
                >
                  <img
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    onClick={() => openFullScreen(i)}
                    className="max-h-full max-w-full w-auto object-contain mx-auto transition-transform duration-300 drop-shadow-md cursor-pointer hover:scale-102"
                  />
                </div>
              ))}
            </div>

            {product.badge && (
              <span className={cn('absolute left-3.5 top-3.5 z-10 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider shadow-xs', badgeColorClass[product.badgeColor || 'purple'])}>
                {product.badge}
              </span>
            )}

            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-gray-800 dark:text-slate-100 shadow-md backdrop-blur-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToIdx(activeIdx - 1);
                  }}
                  disabled={activeIdx === 0}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-gray-800 dark:text-slate-100 shadow-md backdrop-blur-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToIdx(activeIdx + 1);
                  }}
                  disabled={activeIdx === allImages.length - 1}
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
                  {allImages.map((_, i) => (
                    <button
                      type="button"
                      key={i}
                      aria-label={`Go to slide ${i + 1}`}
                      className={cn('h-2 w-2 rounded-full transition-all', i === activeIdx ? 'bg-white w-4' : 'bg-white/50')}
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToIdx(i);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {allImages.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  className={cn(
                    'h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 dark:bg-slate-800 p-1 transition-all cursor-pointer',
                    i === activeIdx
                      ? 'border-brand-purple ring-2 ring-brand-purple/20 scale-105 shadow-md'
                      : 'border-gray-200 dark:border-slate-700 opacity-70 hover:opacity-100 hover:scale-102'
                  )}
                  onClick={() => scrollToIdx(i)}
                >
                  <img src={img} alt="" className="h-full w-full object-contain mx-auto" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. DESKTOP RIGHT COLUMN CONTENT & CTA */}
        <div className="flex flex-col">

          {/* Category badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple/10 dark:bg-purple-950/40 px-3 py-1 text-xs font-bold text-brand-purple dark:text-purple-300 border border-brand-purple/20 dark:border-purple-800/40">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-purple dark:bg-purple-400" />
              {product.categoryName}
            </span>
            {product.subcategory && (
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-slate-300">
                {product.subcategory}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:text-4xl leading-tight">
            {product.name}
          </h1>

          {/* Price & Discounts */}
          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-black text-gray-900 dark:text-white">₹{product.price.toLocaleString()}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-base text-gray-400 dark:text-slate-500 line-through font-medium">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          {/* BOOKING CTA: PRIMARY = Book Now, SECONDARY = Book via WhatsApp */}
          <div className="mt-6 flex flex-col gap-3.5">
            {/* Primary Action: Book Now */}
            <button
              type="button"
              onClick={() => {
                trackBookingStarted();
                onBook(product, 'razorpay', bookingSelections);
              }}
              className="w-full h-14 sm:h-[54px] inline-flex items-center justify-center rounded-2xl bg-brand-purple hover:bg-brand-purple-dark text-white font-bold text-base shadow-lg shadow-purple-600/25 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              Book Now
            </button>

            {/* Secondary Action: Book via WhatsApp */}
            <button
              type="button"
              onClick={() => {
                trackWhatsappClick();
                setTimeout(() => onBook(product, "whatsapp", bookingSelections), 400);
              }}
              className="w-full h-14 sm:h-[54px] inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-base transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              {WA_SVG} Book via WhatsApp
            </button>
          </div>

          {/* Populate Desktop Right Column: Description & Highlights Preview */}
          {product.description && (
            <div className="mt-6 text-sm text-gray-600 dark:text-slate-300 leading-relaxed border-t border-gray-100 dark:border-slate-800/80 pt-4">
              {product.description}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-800/80 pt-4">
            <span className="flex items-center gap-1.5"><Zap size={14} className="text-brand-purple" /> Same Day Setup</span>
            <span className="flex items-center gap-1.5"><Lock size={14} className="text-emerald-500" /> Verified &amp; Safe</span>
            <span className="flex items-center gap-1.5"><Palette size={14} className="text-pink-500" /> Fully Customisable</span>
          </div>
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={product.name}
        text={product.description || 'Check out this package'}
        url={`${window.location.origin}/share/product/${product._id}`}
      />

      {/* FULL-SCREEN IMMERSIVE IMAGE VIEWER MODAL */}
      {fullScreenModalOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-xl p-4 sm:p-6 animate-fadeIn"
          onClick={() => setFullScreenModalOpen(false)}
        >
          {/* Top Header Row */}
          <div className="flex items-center justify-between z-10 text-white" onClick={e => e.stopPropagation()}>
            <div className="text-xs sm:text-sm font-bold tracking-wide bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              {fullScreenIdx + 1} of {allImages.length}
            </div>
            <button
              type="button"
              onClick={() => setFullScreenModalOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Close full screen view"
            >
              <X size={20} />
            </button>
          </div>

          {/* Center Image Container with arrows */}
          <div className="relative flex-1 flex items-center justify-center my-auto overflow-hidden p-2" onClick={e => e.stopPropagation()}>
            <img
              src={allImages[fullScreenIdx]}
              alt={product.name}
              className="max-h-[82vh] max-w-[94vw] w-auto object-contain mx-auto drop-shadow-2xl transition-transform duration-300 select-none"
            />

            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setFullScreenIdx(prev => Math.max(0, prev - 1))}
                  disabled={fullScreenIdx === 0}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => setFullScreenIdx(prev => Math.min(allImages.length - 1, prev + 1))}
                  disabled={fullScreenIdx === allImages.length - 1}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="z-10 flex justify-center gap-2 overflow-x-auto py-2 scrollbar-none" onClick={e => e.stopPropagation()}>
              {allImages.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setFullScreenIdx(i)}
                  className={cn(
                    "h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-black/40 cursor-pointer",
                    i === fullScreenIdx ? "border-brand-purple ring-2 ring-purple-400 scale-110" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-contain mx-auto" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. CONTENT FLOW: WHAT'S INCLUDED -> ADDONS & ACTIVITIES -> TERMS -> SIMILAR PRODUCTS */}
      <div className="mt-8 sm:mt-10 flex flex-col gap-10">

        {/* What's Included */}
        {product.inclusions?.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white sm:text-xl">
                {t.whats_included || "What's Included"}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {product.inclusions.map((inc, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3.5 text-sm text-gray-800 dark:text-slate-200 shadow-xs">
                  <Check size={16} className="flex-shrink-0 text-emerald-500" />
                  <span>{inc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Add-ons & Activities Module */}
        <GlobalAddonsActivitiesModule onSelectionChange={handleGlobalSelectionChange} />

        {/* Debug panel (enable by appending ?debugAddons=1 to URL) */}
        {showDebugAddons && (
          <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-ink">
            <div className="font-semibold">Debug: shared add-ons payload</div>
            <div className="mt-1 text-xs text-ink-muted">selected global add-ons: {globalSelections.addons.length}</div>
            <div className="text-xs text-ink-muted">selected global activities: {globalSelections.activities.length}</div>
            <pre className="mt-2 max-h-40 overflow-auto text-xs">{JSON.stringify(globalSelections, null, 2)}</pre>
          </div>
        )}

        {/* Terms & Conditions Accordion */}
        <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
          <button
            type="button"
            className="flex w-full items-center justify-between py-2 text-left cursor-pointer"
            onClick={() => setTermsOpen(o => !o)}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-brand-purple" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Terms &amp; Conditions</h2>
            </div>
            {termsOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {termsOpen && (
            <ol className="mt-3 flex flex-col gap-2 pl-5 text-xs sm:text-sm text-gray-600 dark:text-slate-400 marker:text-brand-purple marker:font-semibold">
              {TERMS.map((t, i) => <li key={i} className="list-decimal pl-1">{t}</li>)}
            </ol>
          )}
        </div>

        {/* 4. SIMILAR PRODUCTS: RESPONSIVE CATALOGUE GRID */}
        {similarProducts.length > 0 && (
          <section className="mt-6 border-t border-gray-100 dark:border-slate-800 pt-10">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                Similar Products
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 sm:text-sm">
                You may also like these packages in {product.categoryName}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {similarProducts.map((simProduct) => (
                <div key={simProduct._id} className="h-full">
                  <ProductCard
                    product={simProduct}
                    onViewDetails={() => navigate(`/product/${simProduct._id}`)}
                    onBook={() => onBook(simProduct, 'razorpay')}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* 5. STICKY MOBILE BOOKING BAR: FLOATING BOOK VIA WHATSAPP BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 shadow-2xl sm:hidden flex items-center justify-between gap-3 pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500">Price</div>
          <div className="text-lg font-black text-gray-900 dark:text-white">₹{totalPrice.toLocaleString()}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            trackWhatsappClick();
            setTimeout(() => onBook(product, "whatsapp", bookingSelections), 400);
          }}
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          {WA_SVG} Book via WhatsApp
        </button>
      </div>

    </div>
  );
};
