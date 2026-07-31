import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import type { AdminProduct, Translations } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

const badgeColorClass: Record<string, string> = {
  purple: 'bg-brand-purple text-white',
  gold: 'bg-brand-gold text-white',
  green: 'bg-emerald-500 text-white',
  red: 'bg-red-500 text-white',
};
export const ProductCard: React.FC<{
  product: AdminProduct;
  onViewDetails: (p: AdminProduct) => void;
  onBook?: (p: AdminProduct) => void;
  isAI?: boolean;
  isLanding?: boolean;
}> = ({
  product,
  onViewDetails,
  onBook,
  isAI = false,
  isLanding = false,
}) => {
  const [wished, setWished] = useState(false);
  const { t } = useLanguage();

  return (
    <div
      data-card
      className={cn(
        isAI
          ? 'w-full cursor-pointer overflow-hidden rounded-card border border-border bg-white shadow-card transition-transform hover:-translate-y-1 hover:shadow-lg sm:w-[230px]'
          : cn(
              'flex h-full flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-card border border-border bg-white shadow-card transition-transform hover:-translate-y-1 hover:shadow-lg',
              isLanding ? 'w-[80vw] sm:w-[230px]' : 'w-full sm:w-[230px]'
            )
      )}
      onClick={() => onViewDetails(product)}
    >
      <div className="relative h-[180px] w-full overflow-hidden bg-gray-100 sm:h-[200px]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        {!isAI && product.badge && (
          <span
            className={cn(
              "absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
              badgeColorClass[product.badgeColor || "purple"]
            )}
          >
            {product.badge}
          </span>
        )}

        {!isAI && (
          <button
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              setWished((w) => !w);
            }}
          >
            <Heart size={16} fill={wished ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className={isAI ? 'p-3.5' : 'flex flex-1 flex-col p-3.5'}>
        <h3 className="line-clamp-2 text-sm font-semibold text-ink">
          {product.name}
        </h3>

        {!isAI && (
          <div className="mt-1 text-xs text-ink-muted">
            {product.categoryName}
          </div>
        )}

        <div className="mt-3">
          {product.price > 0 ? (
            <div className="flex flex-wrap items-baseline gap-2">
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-ink-muted line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
              <span className="text-base font-bold text-brand-purple">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm font-semibold text-ink-muted">
              Price on request
            </span>
          )}
        </div>

        <button
          className={cn(
            isAI ? 'mt-4' : 'mt-auto',
            'w-full rounded-lg bg-brand-purple py-2 text-sm font-semibold text-white transition hover:bg-brand-purple-dark'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(product);
          }}
        >
          {t.view_details || 'View Details'}
        </button>

        {!isAI && onBook && (
          <button
            className="mt-2 w-full rounded-lg border border-brand-purple py-2 text-sm font-semibold text-brand-purple transition hover:bg-brand-purple hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onBook(product);
            }}
          >
            {t.book_now || 'Book Now'}
          </button>
        )}
      </div>
    </div>
  );
};


interface ProductSliderProps {
  title: string;
  titleSpan?: string;
  apiProducts?: AdminProduct[];
  t: Translations;
  onViewDetails: (product: AdminProduct) => void;
  onBook: (product: AdminProduct) => void;
  isLanding?: boolean;
}

export const ProductSlider: React.FC<ProductSliderProps> = ({ title, titleSpan, apiProducts = [], onViewDetails, onBook, isLanding = false }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [showSwipeHint, setShowSwipeHint] = useState(isLanding);

  if (!apiProducts.length) return null;

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

  const scroll = (direction: number) => {
    if (!trackRef.current) return;
    const card = trackRef.current.querySelector('[data-card]') as HTMLElement;
    const cardWidth = card ? card.offsetWidth + 16 : 280;
    trackRef.current.scrollBy({ left: direction * cardWidth * 2, behavior: 'smooth' });
  };

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink md:text-xl">
          {title}
          {titleSpan && <span className="text-brand-purple"> {titleSpan}</span>}
        </h2>
        {isLanding && showSwipeHint && (
          <span className="text-xs font-medium text-ink-muted sm:hidden">Swipe <span aria-hidden="true">-&gt;</span></span>
        )}
      </div>
      <div className="relative">
        {isLanding && (
          <button
            onClick={() => scroll(-1)}
            aria-label="Previous"
            className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow hover:bg-gray-50 sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div
          ref={trackRef}
          className={cn(
            isLanding
              ? 'flex cursor-grab gap-4 overflow-x-auto scroll-smooth pb-1 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory pr-[20vw] sm:pr-0'
              : 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
          )}
          onScroll={isLanding ? () => setShowSwipeHint(false) : undefined}
          onMouseDown={isLanding ? onMouseDown : undefined}
          onMouseMove={isLanding ? onMouseMove : undefined}
          onMouseUp={isLanding ? onMouseUp : undefined}
          onMouseLeave={isLanding ? onMouseUp : undefined}
        >
          {apiProducts.map(product => (
            <div key={product._id} className={isLanding ? 'flex-shrink-0 snap-start' : undefined}>
              <ProductCard product={product} onViewDetails={onViewDetails} onBook={onBook} isLanding={isLanding} />
            </div>
          ))}
        </div>
        {isLanding && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-white via-white/75 to-transparent sm:hidden" aria-hidden="true" />
        )}
        {isLanding && (
          <button
            onClick={() => scroll(1)}
            aria-label="Next"
            className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow hover:bg-gray-50 sm:flex"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </section>
  );
};
