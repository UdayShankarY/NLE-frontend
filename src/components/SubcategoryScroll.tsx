import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { EmptyState } from './EmptyState';

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
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h2 className="text-lg font-bold text-ink md:text-xl">{categoryName}</h2>
    </div>

    {subcategories.length === 0 ? (
      <EmptyState
        title="No subcategories yet"
        actionLabel="View All Packages"
        onAction={onViewAll}
      />
    ) : (
      <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {subcategories.map((sub, i) => (
          <div
            key={i}
            className="flex w-[140px] flex-shrink-0 cursor-pointer flex-col gap-2"
            onClick={() => onSelectSubcategory(sub.name)}
          >
            <div className="h-[100px] w-full overflow-hidden rounded-lg border border-border bg-gray-50">
              <img src={sub.image} alt={sub.name} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="truncate text-center text-sm font-medium text-ink">{sub.name}</div>
          </div>
        ))}
      </div>
    )}
  </section>
);
