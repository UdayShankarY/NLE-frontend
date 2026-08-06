import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import type { AdminProduct } from '../../types';
import { cn } from '../../lib/utils';

interface ProductSearchSelectorProps {
  products: AdminProduct[];
  selectedProductIds: string[];
  excludedProductIds?: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
}

export const ProductSearchSelector: React.FC<ProductSearchSelectorProps> = ({
  products,
  selectedProductIds,
  excludedProductIds,
  onChange,
  placeholder = 'Search products by name',
}) => {
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const excludedSet = useMemo(
    () => new Set(excludedProductIds ?? []),
    [excludedProductIds]
  );

  const activeProducts = useMemo(
    () => products.filter((product) => product.active && !excludedSet.has(product._id)),
    [products, excludedSet]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return activeProducts;
    return activeProducts.filter((product) =>
      product.name.toLowerCase().includes(normalized)
    );
  }, [activeProducts, query]);

  useEffect(() => {
    setHighlightedIndex((prev) => Math.min(prev, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  const toggleProduct = (productId: string) => {
    onChange(selectedProductIds.includes(productId)
      ? selectedProductIds.filter((id) => id !== productId)
      : [...selectedProductIds, productId]
    );
  };

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product._id)),
    [products, selectedProductIds]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const item = filtered[highlightedIndex];
      if (item) {
        toggleProduct(item._id);
      }
      return;
    }

    if (event.key === 'Backspace' && !query && selectedProductIds.length > 0) {
      event.preventDefault();
      onChange(selectedProductIds.slice(0, -1));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedProducts.map((product) => (
          <div key={product._id} className="flex items-center gap-2 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 px-3 py-1.5 text-xs font-bold text-brand-purple dark:text-purple-300">
            <span className="truncate max-w-[180px]">{product.name}</span>
            <button
              type="button"
              className="rounded-full p-0.5 text-slate-400 hover:bg-purple-200 dark:hover:bg-purple-900 cursor-pointer"
              onClick={() => toggleProduct(product._id)}
              aria-label={`Remove ${product.name}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      </div>

      <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.length === 0 ? (
          <div className="p-4 text-xs font-bold text-slate-400">No products match “{query}”.</div>
        ) : (
          filtered.map((product, index) => {
            const selected = selectedProductIds.includes(product._id);
            const highlighted = index === highlightedIndex;
            return (
              <button
                key={product._id}
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer',
                  highlighted ? 'bg-purple-50 dark:bg-purple-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60',
                  selected ? 'opacity-70' : ''
                )}
                onClick={() => toggleProduct(product._id)}
              >
                <img src={product.image} alt={product.name} className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-900 dark:text-white">{product.name}</div>
                  <div className="truncate text-[11px] font-semibold text-slate-400">
                    {product.categoryName || 'Uncategorized'}
                  </div>
                </div>
                <div className="text-xs font-black text-brand-purple dark:text-purple-400">₹{Number(product.price || 0).toLocaleString('en-IN')}</div>
                {selected && <Check size={16} className="text-brand-purple dark:text-purple-400 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
