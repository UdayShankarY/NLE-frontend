import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHeroSlider } from '../hooks/useHeroSlider';
import { cn } from '../lib/utils';

export const HeroSlider: React.FC = () => {
  const { index, go, next, prev, slides } = useHeroSlider();
  const touchX = useRef(0);

  return (
    <div
      className="relative h-[200px] w-full overflow-hidden bg-gray-100 sm:h-[280px] md:h-[380px] lg:h-[440px]"
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const dx = touchX.current - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 40) dx > 0 ? next() : prev();
      }}
    >
      <div
        className="flex h-full w-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="relative flex min-w-full items-center bg-cover bg-center"
            style={{
              backgroundImage: slide.gradient && slide.gradient !== 'none'
                ? `${slide.gradient}, url(${slide.img})`
                : `url(${slide.img})`,
            }}
          >
            <div className="max-w-[500px] px-6 text-white sm:px-10 md:px-16">
              {slide.chip && (
                <div className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  {slide.chip}
                </div>
              )}
              <h2 className="whitespace-pre-line text-xl font-extrabold leading-tight sm:text-2xl md:text-4xl">
                {slide.headline}
              </h2>
              <p className="mt-2 hidden text-sm text-white/90 sm:block md:text-base">{slide.sub}</p>
              <a
                className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-purple transition-transform hover:scale-105 sm:px-6 sm:py-2.5"
                href={slide.ctaLink || '#'}
                onClick={e => { if (!slide.ctaLink || slide.ctaLink === '#') e.preventDefault(); }}
              >
                {slide.cta} →
              </a>
            </div>
          </div>
        ))}
      </div>

      <button
        aria-label="Previous slide"
        onClick={prev}
        className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow hover:bg-white sm:flex md:left-4"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        aria-label="Next slide"
        onClick={next}
        className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow hover:bg-white sm:flex md:right-4"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => go(i)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
            )}
          />
        ))}
      </div>
    </div>
  );
};
