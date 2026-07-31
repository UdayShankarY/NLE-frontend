import React from 'react';
import { EmptyState } from './EmptyState';
import { BackButton } from './BackButton';

interface SubcategoryScrollProps {
  categoryName: string;
  subcategories: { name: string; image: string }[];
  onBack: () => void;
  onSelectSubcategory: (name: string) => void;
  onViewAll: () => void;
}

export const SubcategoryScroll: React.FC<SubcategoryScrollProps> = ({
  categoryName,
  subcategories,
  onBack,
  onSelectSubcategory,
  onViewAll,
}) => (
  <section className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
    <div className="mb-4 flex items-center gap-3">
      <BackButton
        onClick={onBack}
      />
      <h2 className="text-lg font-bold text-ink md:text-xl">{categoryName}</h2>
    </div>

    {subcategories.length === 0 ? (
      <EmptyState
        title="No subcategories yet"
        actionLabel="View All Packages"
        onAction={onViewAll}
      />
    ) : (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {subcategories.map((sub, i) => (
          <div
            key={i}
            className="flex h-full min-h-36 cursor-pointer flex-col gap-2 rounded-card border border-border bg-white p-2 shadow-card transition-transform hover:-translate-y-1 hover:shadow-lg sm:p-3"
            onClick={() => onSelectSubcategory(sub.name)}
          >
            <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-gray-50">
              <img src={sub.image} alt={sub.name} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="line-clamp-2 text-center text-sm font-medium text-ink">{sub.name}</div>
          </div>
        ))}
      </div>
    )}
  </section>
);
