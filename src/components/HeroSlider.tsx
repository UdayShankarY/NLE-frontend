import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useHeroSlider } from '../hooks/useHeroSlider';
import { cn } from '../lib/utils';

export const HeroSlider: React.FC = () => {
  const { index, go, next, prev, slides } = useHeroSlider();
  const touchX = useRef(0);
  const [animKey, setAnimKey] = useState(0);

  const handleNext = () => { next(); setAnimKey(k => k + 1); };
  const handlePrev = () => { prev(); setAnimKey(k => k + 1); };
  const handleGo = (i: number) => { go(i); setAnimKey(k => k + 1); };

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-100 dark:bg-slate-900 h-[240px] min-[380px]:h-[270px] min-[480px]:h-[300px] sm:h-[350px] md:h-[400px] lg:h-[460px] xl:h-[500px] 2xl:h-[540px] max-h-[550px]"
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const dx = touchX.current - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 40) dx > 0 ? handleNext() : handlePrev();
      }}
    >
      {/* Slides track */}
      <div
        className="flex h-full w-full transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="relative flex min-w-full items-center overflow-hidden"
          >
            {/* Background image with strict object-fit: cover */}
            <img
              src={slide.img}
              alt={slide.headline}
              className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none"
            />

            {/* Layered gradient mask */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(to right,
                    rgba(0,0,0,0.75) 0%,
                    rgba(0,0,0,0.45) 45%,
                    rgba(0,0,0,0.1) 75%,
                    transparent 100%
                  ),
                  linear-gradient(to top,
                    rgba(0,0,0,0.4) 0%,
                    transparent 40%
                  )
                `,
              }}
            />

            {/* Content Container */}
            <div
              key={animKey}
              className="relative z-10 px-5 sm:px-10 md:px-14 lg:px-20 max-w-[90%] sm:max-w-[80%] md:max-w-[620px]"
            >
              {/* Chip */}
              {slide.chip && (
                <div
                  className="mb-2 sm:mb-3.5 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 sm:px-3.5 sm:py-1.5 backdrop-blur-md"
                  style={{ animation: 'fadeInUp 0.45s cubic-bezier(0.34,1.1,0.64,1) both' }}
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-white/90">
                    {slide.chip}
                  </span>
                </div>
              )}

              {/* Headline */}
              <h2
                className="font-black leading-[1.08] tracking-tight text-white text-xl min-[380px]:text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
                style={{
                  textShadow: '0 2px 20px rgba(0,0,0,0.4)',
                  animation: 'fadeInUp 0.5s cubic-bezier(0.34,1.1,0.64,1) 0.07s both',
                }}
              >
                {slide.headline}
              </h2>

              {/* Subtitle */}
              <p
                className="mt-1.5 sm:mt-2.5 text-white/80 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2"
                style={{
                  textShadow: '0 1px 8px rgba(0,0,0,0.3)',
                  animation: 'fadeInUp 0.5s cubic-bezier(0.34,1.1,0.64,1) 0.15s both',
                }}
              >
                {slide.sub}
              </p>

              {/* CTA Button */}
              <div
                style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.34,1.1,0.64,1) 0.23s both' }}
                className="mt-3.5 sm:mt-5 flex flex-wrap items-center gap-3"
              >
                <a
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-brand-purple shadow-md transition-all duration-200 hover:bg-white/95 hover:shadow-lg hover:scale-105 active:scale-95"
                  href={slide.ctaLink || '#'}
                  onClick={e => { if (!slide.ctaLink || slide.ctaLink === '#') e.preventDefault(); }}
                >
                  <span>{slide.cta}</span>
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-1 sm:size-4"
                  />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Left arrow */}
      <button
        aria-label="Previous slide"
        onClick={handlePrev}
        className="absolute left-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white shadow-md backdrop-blur-md ring-1 ring-white/20 transition-all duration-200 hover:bg-white/30 hover:scale-110 sm:left-4 sm:h-10 sm:w-10"
      >
        <ChevronLeft size={16} strokeWidth={2.5} className="sm:size-5" />
      </button>

      {/* Right arrow */}
      <button
        aria-label="Next slide"
        onClick={handleNext}
        className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white shadow-md backdrop-blur-md ring-1 ring-white/20 transition-all duration-200 hover:bg-white/30 hover:scale-110 sm:right-4 sm:h-10 sm:w-10"
      >
        <ChevronRight size={16} strokeWidth={2.5} className="sm:size-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => handleGo(i)}
            className={cn(
              'rounded-full transition-all duration-300',
              i === index
                ? 'h-1.5 w-6 sm:h-2 sm:w-8 bg-white shadow-sm'
                : 'h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white/40 hover:bg-white/65'
            )}
          />
        ))}
      </div>

      {/* Slide counter (mobile) */}
      <div className="absolute bottom-3 right-3 z-20 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white backdrop-blur-sm sm:hidden">
        {index + 1}/{slides.length}
      </div>
    </div>
  );
};
