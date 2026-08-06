import React from 'react';
import type { AdminCategory } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface CategoryGridProps {
  categories: AdminCategory[];
  onSelect: (categoryName: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onSelect }) => {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-[1920px] px-4 py-8 md:px-8 lg:px-12">
      {/* Section header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-gradient-to-b from-brand-purple to-brand-purple-light" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white md:text-xl">
          {t.categories_title || 'Explore Our Categories'}
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-14">
        {categories.map((cat, idx) => (
          <button
            key={cat._id}
            onClick={() => onSelect(cat.name)}
            className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-transparent dark:border-slate-700/60 p-2.5 text-center shadow-card dark:shadow-none transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover dark:hover:border-brand-purple/40 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40 focus-visible:ring-offset-2 sm:p-3"
            style={{
              animation: 'fadeInUp 0.4s ease both',
              animationDelay: `${idx * 40}ms`,
            }}
          >
            {/* Image circle */}
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 ring-1 ring-gray-200/60 dark:ring-slate-700 transition-all duration-300 group-hover:ring-brand-purple/30 sm:h-16 sm:w-16 md:h-[70px] md:w-[70px]">
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl">
                  {cat.icon || '🎉'}
                </span>
              )}
            </div>

            {/* Label */}
            <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-gray-700 dark:text-slate-200 transition-colors duration-200 group-hover:text-brand-purple dark:group-hover:text-purple-300 sm:text-xs">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
