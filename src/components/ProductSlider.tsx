import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, MapPin } from 'lucide-react';
import type { AdminProduct, Translations } from '../types';
import { cn } from '../lib/utils';

const badgeColorClass: Record<string, string> = {
  purple: 'bg-brand-purple text-white',
  gold: 'bg-brand-gold text-white',
  green: 'bg-emerald-500 text-white',
  red: 'bg-red-500 text-white',
};

const ApiProductCard: React.FC<{
  product: AdminProduct;
  onViewDetails: (p: AdminProduct) => void;
  onBook: (p: AdminProduct) => void;
}> = ({ product, onViewDetails, onBook }) => {
  const [wished, setWished] = useState(false);
  return (
    <div
      data-card
      className="w-[230px] flex-shrink-0 cursor-pointer overflow-hidden rounded-card border border-border bg-white shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-lg sm:w-[260px]"
      onClick={() => onViewDetails(product)}
    >
      <div className="relative h-[180px] w-full overflow-hidden bg-gray-100 sm:h-[200px]">
        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        {product.badge && (
          <span
            className={cn(
              'absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
              badgeColorClass[product.badgeColor || 'purple']
            )}
          >
            {product.badge}
          </span>
        )}
        <button
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow hover:bg-white"
          onClick={e => { e.stopPropagation(); setWished(w => !w); }}
          aria-label="Wishlist"
        >
          <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-3.5">
        <div className="truncate text-sm font-semibold text-ink">{product.name}</div>
        <div className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
          <MapPin size={11} /> Bangalore
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-ink">Rs.{product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-xs text-ink-muted line-through">Rs.{product.originalPrice.toLocaleString()}</span>
          )}
        </div>
        <button
          className="mt-3 w-full rounded-lg bg-brand-purple py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-purple-dark"
          onClick={e => { e.stopPropagation(); onBook(product); }}
        >
          Book Now
        </button>
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
}

export const ProductSlider: React.FC<ProductSliderProps> = ({ title, titleSpan, apiProducts = [], onViewDetails, onBook }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

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

  const scroll = (dir: number) => {
    if (!trackRef.current) return;
    const card = trackRef.current.querySelector('[data-card]') as HTMLElement;
    const cardW = card ? card.offsetWidth + 16 : 280;
    trackRef.current.scrollBy({ left: dir * cardW * 2, behavior: 'smooth' });
  };

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink md:text-xl">
          {title}
          {titleSpan && <span className="text-brand-purple"> {titleSpan}</span>}
        </h2>
      </div>
      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          aria-label="Previous"
          className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow hover:bg-gray-50 sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
        <div
          className="flex cursor-grab gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={trackRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {apiProducts.map(product => (
            <ApiProductCard key={product._id} product={product} onViewDetails={onViewDetails} onBook={onBook} />
          ))}
        </div>
        <button
          onClick={() => scroll(1)}
          aria-label="Next"
          className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow hover:bg-gray-50 sm:flex"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
};
