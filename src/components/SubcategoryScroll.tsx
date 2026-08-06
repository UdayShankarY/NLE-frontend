import React, { useState, useMemo } from 'react';
import { Share2 } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { BackButton } from './BackButton';
import { SearchBar } from './SearchBar';
import { useLanguage } from '../hooks/useLanguage';

interface SubcategoryScrollProps {
  categoryName: string;
  subcategories: { name: string; image: string }[];
  onBack: () => void;
  onSelectSubcategory: (name: string) => void;
  onViewAll: () => void;
  onShare?: () => void;
}

const getCategorySubtitle = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('kid') || lower.includes('child')) return 'Choose your favourite activity.';
  if (lower.includes('birthday')) return 'Explore exciting birthday themes.';
  if (lower.includes('anniversary') || lower.includes('romantic')) return 'Select a romantic setup.';
  return `Browse our ${name} collections.`;
};

export const SubcategoryScroll: React.FC<SubcategoryScrollProps> = ({
  categoryName,
  subcategories,
  onBack,
  onSelectSubcategory,
  onViewAll,
  onShare,
}) => {
  const { t } = useLanguage();
  const [filterText, setFilterText] = useState('');
  const subtitle = getCategorySubtitle(categoryName);

  const filteredSubcategories = useMemo(() => {
    if (!filterText.trim()) return subcategories;
    const query = filterText.toLowerCase();
    return subcategories.filter(sub => sub.name.toLowerCase().includes(query));
  }, [subcategories, filterText]);

  return (
    <section className="mx-auto max-w-[1920px] px-3.5 py-4 sm:px-6 md:px-8 lg:px-12 sm:py-6 animate-fadeIn">
      {/* Compact Top Navigation Bar */}
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <BackButton onClick={onBack} aria-label="Go back" />
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-300 shadow-xs transition-all hover:border-brand-purple/40 hover:bg-purple-50 dark:hover:bg-slate-700 hover:text-brand-purple active:scale-90 sm:h-9 sm:w-auto sm:px-3.5 sm:gap-2 sm:text-xs sm:font-semibold"
            aria-label="Share category"
          >
            <Share2 size={15} />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}
      </div>

      {/* Mobile-Optimized Header */}
      <div className="mb-4 sm:mb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-2xl lg:text-3xl">
          {categoryName}
        </h1>
        <p className="mt-0.5 max-w-md text-xs font-normal text-gray-500 dark:text-slate-400 sm:text-sm">
          {subtitle}
        </p>
      </div>

      {/* Subcategory Local Filter Input */}
      {subcategories.length > 0 && (
        <div className="relative mb-4 sm:mb-6">
          <SearchBar
            value={filterText}
            onChange={setFilterText}
            category={categoryName}
            placeholder={`Filter ${categoryName} subcategories...`}
          />
        </div>
      )}

      {/* Subcategory Catalogue Grid */}
      {filteredSubcategories.length === 0 ? (
        <EmptyState
          title={filterText ? `No subcategories matching "${filterText}"` : (t.no_subcategories || 'No subcategories yet')}
          description={filterText ? 'Try adjusting your filter keyword.' : undefined}
          actionLabel={filterText ? 'Clear filter' : (t.view_all_packages || 'View All Packages')}
          onAction={filterText ? () => setFilterText('') : onViewAll}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3.5 min-[480px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
          {filteredSubcategories.map((sub: { name: string; image: string }, i: number) => (
            <button
              key={sub.name}
              onClick={() => onSelectSubcategory(sub.name)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100/90 dark:border-slate-700/60 bg-white dark:bg-slate-800/90 shadow-xs transition-all duration-200 active:scale-[0.96] active:border-brand-purple/40 active:shadow-md sm:hover:-translate-y-1.5 sm:hover:border-brand-purple/20 sm:hover:shadow-xl sm:hover:shadow-purple-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50"
              style={{
                animation: 'fadeInUp 0.35s ease both',
                animationDelay: `${i * 35}ms`,
              }}
            >
              {/* Image with preserved aspect ratio */}
              <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 relative">
                <img
                  src={sub.image}
                  alt={sub.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-active:scale-105"
                />

                {/* High Contrast Gradient Mask */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100" />

                {/* Card Title Content */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-3 sm:p-4 text-left">
                  <span className="line-clamp-2 text-xs sm:text-sm font-bold text-white drop-shadow-sm leading-snug group-hover:text-purple-200 group-active:text-purple-200 transition-colors">
                    {sub.name}
                  </span>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-purple-300 transition-all duration-200 opacity-100 sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
                    <span>Explore</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
