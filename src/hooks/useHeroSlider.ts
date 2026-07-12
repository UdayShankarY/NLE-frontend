import { useState, useEffect, useCallback, useRef } from 'react';
import { HERO_SLIDES } from '../data';
import type { HeroSlide } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

export function useHeroSlider() {
  const [index, setIndex] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/sliders`);
        const data = await res.json();
        const apiSliders = data
          .filter((s: any) => s.active)
          .map((s: any) => ({
            img: s.image,
            chip: s.chip,
            headline: s.headline,
            sub: s.subtext,
            gradient: s.gradient === 'none' ? '' : s.gradient,
            cta: s.ctaText,
            ctaLink: s.ctaLink || '#',
          }));
        setSlides(apiSliders.length > 0 ? apiSliders : HERO_SLIDES);
      } catch (err) {
        setSlides(HERO_SLIDES); // fallback if API is down
      }
    };
    fetchSliders();
  }, []);

  const go = useCallback((n: number) => {
    if (slides.length === 0) return;
    setIndex(((n % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => go(index + 1), [index, go]);
  const prev = useCallback(() => go(index - 1), [index, go]);

  const resetTimer = useCallback(() => {
    if (slides.length === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % slides.length), 5000);
  }, [slides.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  return { index, go, next, prev, slides };
}
