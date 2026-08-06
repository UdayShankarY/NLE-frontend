import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, Tag } from 'lucide-react';
import type { AdminProduct, Translations } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { getApiUrl } from '../lib/api';

const badgePalette: Record<string, string> = {
  purple: 'bg-brand-purple text-white',
  gold:   'bg-amber-400 text-white',
  green:  'bg-emerald-500 text-white',
  red:    'bg-brand-rose text-white',
};

/* ─────────────────────────────────────────────────── */
/*  ProductCard                                        */
/* ─────────────────────────────────────────────────── */
export const ProductCard: React.FC<{
  product: AdminProduct;
  onViewDetails: (p: AdminProduct) => void;
  onBook?: (p: AdminProduct) => void;
  isAI?: boolean;
  isLanding?: boolean;
}> = ({ product, onViewDetails, onBook, isAI = false, isLanding = false }) => {
  const [wished, setWished] = useState(false);
  const auth = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    setWished(Boolean(auth.user?.wishlist?.includes(product._id)));
  }, [auth.user?.wishlist, product._id]);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  return (
    <div
      data-card
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-800/90 border border-gray-100/90 dark:border-slate-700/60 shadow-xs dark:shadow-none transition-all duration-300 active:scale-[0.97] sm:hover:-translate-y-1.5 sm:hover:border-brand-purple/20 dark:sm:hover:border-brand-purple/40 sm:hover:shadow-xl sm:hover:shadow-purple-950/10 cursor-pointer',
        isAI
          ? 'w-full'
          : isLanding
          ? 'w-[min(78vw,260px)] min-w-[200px] max-w-[280px] flex-shrink-0 snap-start sm:w-[240px]'
          : 'w-full h-full'
      )}
      onClick={() => onViewDetails(product)}
    >
      {/* Image */}
      <div className="relative h-[180px] w-full overflow-hidden bg-gray-100 dark:bg-slate-900 sm:h-[210px]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-active:scale-105"
        />

        {/* Gradient overlay at bottom for category tag */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Badge */}
        {!isAI && product.badge && (
          <span
            className={cn(
              'absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide shadow-xs',
              badgePalette[product.badgeColor || 'purple']
            )}
          >
            {product.badge}
          </span>
        )}

        {/* Category tag on image */}
        {!isAI && product.categoryName && (
          <span className="absolute bottom-2 left-2.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
            <Tag size={9} />
            {product.categoryName}
          </span>
        )}

        {/* Glass Wishlist button */}
        {!isAI && (
          <button
            className={cn(
              'absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs transition-all duration-200 hover:bg-white dark:hover:bg-slate-900 hover:scale-110 active:scale-90',
              wished ? 'text-brand-rose shadow-[0_2px_12px_rgba(244,63,94,0.3)]' : 'text-gray-400 dark:text-slate-400 hover:text-brand-rose'
            )}
            onClick={async e => {
              e.stopPropagation();
              const next = !wished;
              setWished(next);

              if (!auth.isLoggedIn) {
                auth.open('login');
                setWished(!next);
                return;
              }

              try {
                const token = localStorage.getItem('token');
                const url = getApiUrl(`/api/wishlist/${product._id}`);
                const res = await fetch(url, {
                  method: next ? 'POST' : 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                });
                const payload = await res.json().catch(() => null);
                if (!res.ok || !payload?.wishlist) {
                  setWished(!next);
                } else {
                  auth.updateUser({ wishlist: payload.wishlist.map((p: any) => String(p._id || p)) });
                }
              } catch {
                setWished(!next);
              }
            }}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} fill={wished ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className={isAI ? 'p-3 min-[360px]:p-3.5 sm:p-4' : 'flex flex-1 flex-col p-3 min-[360px]:p-3.5 sm:p-4'}>
        <h3 className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-gray-900 dark:text-slate-100 group-hover:text-brand-purple dark:group-hover:text-purple-300 transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-2 sm:mt-2.5">
          {product.price > 0 ? (
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-xs min-[360px]:text-sm sm:text-base font-extrabold text-brand-purple dark:text-purple-300">
                ₹{product.price.toLocaleString()}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-[10px] min-[360px]:text-[11px] text-gray-400 dark:text-slate-500 line-through">
                    ₹{product.originalPrice!.toLocaleString()}
                  </span>
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 text-[9px] min-[360px]:text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-[11px] sm:text-xs font-medium text-gray-400 dark:text-slate-500">Price on request</span>
          )}
        </div>

        {/* Responsive CTA Buttons */}
        <div className={cn(isAI ? 'mt-2.5 sm:mt-3.5' : 'mt-auto pt-2.5 sm:pt-3', 'flex flex-col gap-1.5 sm:gap-2')}>
          <button
            className="flex h-8.5 min-[360px]:h-9 sm:h-10 md:h-[42px] lg:h-11 w-full items-center justify-center rounded-lg sm:rounded-xl bg-brand-purple px-2.5 min-[360px]:px-3 sm:px-4 text-[12px] min-[360px]:text-xs sm:text-sm font-semibold text-white shadow-xs shadow-brand-purple/20 transition-all duration-200 hover:bg-brand-purple-dark hover:shadow-sm hover:scale-[1.005] active:scale-[0.98]"
            onClick={e => { e.stopPropagation(); onViewDetails(product); }}
          >
            {t.view_details || 'View Details'}
          </button>

          {!isAI && onBook && (
            <button
              className="flex h-8.5 min-[360px]:h-9 sm:h-10 md:h-[42px] lg:h-11 w-full items-center justify-center rounded-lg sm:rounded-xl border-1.5 sm:border-2 border-brand-purple/60 dark:border-brand-purple/70 bg-white dark:bg-slate-800 px-2.5 min-[360px]:px-3 sm:px-4 text-[12px] min-[360px]:text-xs sm:text-sm font-semibold text-brand-purple dark:text-purple-300 shadow-xs transition-all duration-200 hover:bg-brand-purple hover:text-white dark:hover:bg-brand-purple dark:hover:text-white hover:border-brand-purple hover:shadow-xs active:scale-[0.98]"
              onClick={e => { e.stopPropagation(); onBook(product); }}
            >
              {t.book_now || 'Book Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────── */
/*  ProductSlider                                      */
/* ─────────────────────────────────────────────────── */
interface ProductSliderProps {
  title: string;
  titleSpan?: string;
  apiProducts?: AdminProduct[];
  t: Translations;
  onViewDetails: (product: AdminProduct) => void;
  onBook: (product: AdminProduct) => void;
  isLanding?: boolean;
}

export const ProductSlider: React.FC<ProductSliderProps> = ({
  title,
  titleSpan,
  apiProducts = [],
  onViewDetails,
  onBook,
  isLanding = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  if (!apiProducts.length) return null;

  const scroll = (direction: number) => {
    if (!trackRef.current) return;
    const card = trackRef.current.querySelector('[data-card]') as HTMLElement;
    const cardWidth = card ? card.offsetWidth + 16 : 240;
    trackRef.current.scrollBy({ left: direction * cardWidth * 2, behavior: 'smooth' });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (trackRef.current?.offsetLeft || 0);
    scrollLeft.current = trackRef.current?.scrollLeft || 0;
    if (trackRef.current) trackRef.current.style.cursor = 'grabbing';
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.2;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (trackRef.current) trackRef.current.style.cursor = 'grab';
  };

  return (
    <section className="mx-auto max-w-[1920px] px-4 py-6 md:px-8 lg:px-12 md:py-8">
      {/* Section header (only for Landing or multi-section views) */}
      {isLanding && (
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-brand-purple to-brand-purple-light" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white md:text-xl">
              {title}
              {titleSpan && <span className="text-brand-purple dark:text-purple-400"> {titleSpan}</span>}
            </h2>
          </div>
          <span className="hidden flex-shrink-0 text-xs font-medium text-gray-400 sm:block">
            Swipe to explore →
          </span>
        </div>
      )}

      {/* Slider / Grid container */}
      <div className="relative">
        {/* Left arrow */}
        {isLanding && (
          <button
            onClick={() => scroll(-1)}
            aria-label="Previous"
            className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-md transition-all duration-200 hover:border-brand-purple/50 dark:hover:border-purple-400 hover:text-brand-purple dark:hover:text-purple-300 hover:shadow-lg sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Track */}
        <div
          ref={trackRef}
          onMouseDown={isLanding ? onMouseDown : undefined}
          onMouseMove={isLanding ? onMouseMove : undefined}
          onMouseUp={isLanding ? onMouseUp : undefined}
          onMouseLeave={isLanding ? onMouseUp : undefined}
          className={cn(
            isLanding
              ? 'flex gap-3 overflow-x-auto pb-4 pt-1.5 scroll-smooth no-scrollbar snap-x cursor-grab select-none sm:gap-4.5'
              : 'grid grid-cols-2 gap-3.5 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8 gap-4 sm:gap-6'
          )}
          style={isLanding ? { touchAction: 'pan-x pan-y' } : undefined}
        >
          {apiProducts.map((product, i) => (
            <div
              key={product._id}
              className={cn(
                isLanding
                  ? 'w-[min(78vw,260px)] min-w-[200px] max-w-[280px] flex-shrink-0 snap-start sm:w-[240px]'
                  : 'w-full h-full'
              )}
              style={!isLanding ? {
                animation: 'fadeInUp 0.35s ease both',
                animationDelay: `${i * 35}ms`,
              } : undefined}
            >
              <ProductCard
                product={product}
                onViewDetails={onViewDetails}
                onBook={onBook}
                isLanding={isLanding}
              />
            </div>
          ))}
        </div>

        {/* Right fade gradient on mobile (dark mode aware to eliminate white artifacts) */}
        {isLanding && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-14 bg-gradient-to-l from-white dark:from-slate-900 to-transparent sm:hidden"
            aria-hidden="true"
          />
        )}

        {/* Right arrow */}
        {isLanding && (
          <button
            onClick={() => scroll(1)}
            aria-label="Next"
            className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-md transition-all duration-200 hover:border-brand-purple/50 dark:hover:border-purple-400 hover:text-brand-purple dark:hover:text-purple-300 hover:shadow-lg sm:flex"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  );
};
