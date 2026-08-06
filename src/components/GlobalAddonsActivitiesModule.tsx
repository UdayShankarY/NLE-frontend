import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CatalogActivity, CatalogAddon, CatalogSelectionItem } from '../types';
import { getApiUrl } from '../lib/api';

interface Props {
  onSelectionChange?: (addons: CatalogSelectionItem[], activities: CatalogSelectionItem[]) => void;
}

type RawCatalogItem = Record<string, any>;

const getItemPrice = (item: RawCatalogItem): number => {
  if (!item || typeof item !== 'object') return 0;

  const candidates = [
    item.price,
    item.activityPrice,
    item.basePrice,
    item.amount,
    item.cost,
    item.pricing?.price,
    item.pricing?.basePrice,
    item.pricing?.amount,
  ];

  for (const value of candidates) {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
      const numeric = Number(value.replace(/[^0-9.]/g, ''));
      if (!Number.isNaN(numeric)) return numeric;
    }
  }

  return 0;
};

const getItemPriceLabel = (item: RawCatalogItem): string => {
  const price = getItemPrice(item);
  const hasExactPrice = typeof item?.price === 'number' || (typeof item?.price === 'string' && !Number.isNaN(Number(item.price)));
  const prefix = hasExactPrice ? '₹' : 'From ₹';
  return `${prefix}${price.toLocaleString('en-IN')}`;
};

const getItemImage = (item: RawCatalogItem): string | undefined => {
  if (!item || typeof item !== 'object') return undefined;

  const candidate = item.image ?? item.thumbnail ?? item.coverImage ?? item.featuredImage;
  if (typeof candidate === 'string' && candidate.trim()) return candidate;
  if (candidate && typeof candidate === 'object' && typeof candidate.url === 'string' && candidate.url.trim()) return candidate.url;

  if (Array.isArray(item.images) && item.images.length > 0) {
    const firstImage = item.images[0];
    if (typeof firstImage === 'string' && firstImage.trim()) return firstImage;
    if (firstImage && typeof firstImage === 'object') {
      if (typeof firstImage.url === 'string' && firstImage.url.trim()) return firstImage.url;
      if (typeof firstImage.src === 'string' && firstImage.src.trim()) return firstImage.src;
    }
  }

  return undefined;
};

const normalizeCatalogItem = (item: RawCatalogItem) => ({
  ...item,
  price: getItemPrice(item),
  image: getItemImage(item),
});

const TABS = [
  { key: 'addons', label: 'Add-ons' },
  { key: 'activities', label: 'Activities' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export const GlobalAddonsActivitiesModule: React.FC<Props> = ({ onSelectionChange }) => {
  const [addons, setAddons] = useState<CatalogAddon[]>([]);
  const [activities, setActivities] = useState<CatalogActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('addons');
  const [activeCategory, setActiveCategory] = useState('All');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(getApiUrl('/api/catalog'))
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load catalog');
        const data = await res.json();
        if (isMounted) {
          setAddons(Array.isArray(data.addons) ? data.addons.map(normalizeCatalogItem) : []);
          setActivities(Array.isArray(data.activities) ? data.activities.map(normalizeCatalogItem) : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAddons([]);
          setActivities([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentItems = activeTab === 'addons' ? addons : activities;

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    currentItems.forEach((item) => {
      const category = item.category?.trim() || 'General';
      set.add(category);
    });
    return Array.from(set);
  }, [currentItems]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [activeCategory, categories]);

  const getItemId = (item: CatalogAddon | CatalogActivity) => item._id || item.name;

  const visibleItems = useMemo(() => {
    return currentItems.filter((item) => {
      const category = item.category?.trim() || 'General';
      return activeCategory === 'All' || category === activeCategory;
    });
  }, [activeCategory, currentItems]);

  useEffect(() => {
    const selectedAddonsList = addons
      .filter((addon) => selectedAddonIds.includes(getItemId(addon)))
      .map((addon) => ({
        id: getItemId(addon),
        name: addon.name,
        price: addon.price,
        kind: 'addon' as const,
      }));

    const selectedActivitiesList = activities
      .filter((activity) => selectedActivityIds.includes(getItemId(activity)))
      .map((activity) => ({
        id: getItemId(activity),
        name: activity.name,
        price: activity.price || 0,
        kind: 'activity' as const,
      }));

    onSelectionChange?.(selectedAddonsList, selectedActivitiesList);
  }, [activities, addons, onSelectionChange, selectedActivityIds, selectedAddonIds]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) => prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]);
  };

  const toggleActivity = (activityId: string) => {
    setSelectedActivityIds((prev) => prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId]);
  };

  const scrollItems = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -offset : offset, behavior: 'smooth' });
  };

  const getItemTitle = (item: CatalogAddon | CatalogActivity) => item.name || 'Untitled';
  const getItemDescription = (item: CatalogAddon | CatalogActivity) => item.description || 'No description available';

  if (loading) {
    return (
      <div className="rounded-card border border-border bg-white dark:bg-slate-800 p-4 text-sm text-ink-muted">
        Loading add-ons and activities...
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/60 p-4 sm:p-5">
      {/* Left-aligned Segmented Tab Toggle Header */}
      <div className="flex items-center justify-start">
        <div className="inline-flex shrink-0 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-xs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === tab.key ? 'bg-brand-purple text-white shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-2 scroll-smooth touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${isActive ? 'border-brand-purple bg-brand-purple/10 text-brand-purple dark:text-purple-300' : 'border-border bg-white dark:bg-slate-800 text-ink hover:border-brand-purple hover:text-brand-purple'}`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden w-full max-w-full">
        <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2">
          <button
            type="button"
            onClick={() => scrollItems('left')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white dark:bg-slate-800 text-ink shadow-sm transition hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto overflow-y-hidden w-full max-w-full scroll-smooth pb-4 pl-1 pr-10 touch-pan-x snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibleItems.length > 0 ? visibleItems.map((item) => {
            const itemId = getItemId(item);
            const selected = activeTab === 'addons'
              ? selectedAddonIds.includes(itemId)
              : selectedActivityIds.includes(itemId);
            return (
              <div
                key={itemId}
                className="flex-none shrink-0 w-[220px] sm:w-[240px] md:w-[250px] snap-start"
              >
                <div className="group flex h-[260px] sm:h-[275px] flex-col overflow-hidden rounded-2xl border border-gray-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/90 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                  {/* Image (55-60% height) */}
                  <div className="h-[140px] sm:h-[150px] w-full overflow-hidden bg-gray-100 dark:bg-slate-900 relative">
                    <img
                      src={item.image || 'https://via.placeholder.com/560x560?text=No+image'}
                      alt={getItemTitle(item)}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  {/* Content (compact, zero empty gaps) */}
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <div>
                      <h4 className="line-clamp-1 text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-brand-purple dark:group-hover:text-purple-300 transition-colors">
                        {getItemTitle(item)}
                      </h4>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500 dark:text-slate-400">
                        {getItemDescription(item)}
                      </p>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between border-t border-gray-100 dark:border-slate-700/60 pt-2">
                      <div>
                        <div className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Price</div>
                        <div className="text-xs sm:text-sm font-extrabold text-brand-purple dark:text-purple-300">
                          {getItemPriceLabel(item)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => activeTab === 'addons' ? toggleAddon(itemId) : toggleActivity(itemId)}
                        className={`h-8 rounded-full px-4 text-xs font-bold transition-all active:scale-95 shadow-xs ${selected ? 'bg-brand-purple text-white' : 'border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 hover:border-brand-purple hover:text-brand-purple'}`}
                      >
                        {selected ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="min-w-full rounded-card border border-border bg-white p-6 text-sm text-ink-muted">
              No {activeTab === 'addons' ? 'add-ons' : 'activities'} match this category.
            </div>
          )}
        </div>

        <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2">
          <button
            type="button"
            onClick={() => scrollItems('right')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-ink shadow-sm transition hover:bg-gray-100"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
