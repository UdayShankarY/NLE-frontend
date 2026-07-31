import React from 'react';
import type { AdminCategory } from '../types';

interface CategoryGridProps {
  categories: AdminCategory[];
  onSelect: (categoryName: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onSelect }) => (
  <section className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
    <h2 className="mb-4 text-lg font-bold text-ink md:text-xl">Explore Our Categories</h2>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">
      {categories.map(cat => (
        <div
          key={cat._id}
          className="flex min-h-[7rem] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg p-2 text-center transition-colors hover:bg-brand-purple/5 sm:min-h-32 sm:gap-2"
          onClick={() => onSelect(cat.name)}
        >
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-gray-50 sm:h-16 sm:w-16 lg:h-20 lg:w-20">
            {cat.image ? (
              <img src={cat.image} alt={cat.name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl sm:text-2xl">{cat.icon || '🎉'}</span>
            )}
          </div>
          <div className="line-clamp-2 text-xs font-medium text-ink sm:text-sm">{cat.name}</div>
        </div>
      ))}
    </div>
  </section>
);
