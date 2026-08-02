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
          <div key={product._id} className="flex items-center gap-2 rounded-full border border-border bg-gray-50 px-3 py-1.5 text-sm text-ink">
            <span className="font-medium">{product.name}</span>
            <button
              type="button"
              className="rounded-full p-1 text-ink-muted hover:bg-black/5"
              onClick={() => toggleProduct(product._id)}
              aria-label={`Remove ${product.name}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          ref={inputRef}
          type="text"
          className="adm-input pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      </div>

      <div className="max-h-72 overflow-auto rounded-lg border border-border bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-ink-muted">No products match “{query}”.</div>
        ) : (
          filtered.map((product, index) => {
            const selected = selectedProductIds.includes(product._id);
            const highlighted = index === highlightedIndex;
            return (
              <button
                key={product._id}
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
                  highlighted ? 'bg-brand-purple/10' : 'hover:bg-gray-50',
                  selected ? 'opacity-70' : ''
                )}
                onClick={() => toggleProduct(product._id)}
              >
                <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{product.name}</div>
                  <div className="truncate text-xs text-ink-muted">
                    {product.categoryName || 'Uncategorized'}
                  </div>
                </div>
                <div className="text-sm font-semibold text-brand-purple">₹{product.price.toLocaleString()}</div>
                {selected && <Check size={16} className="text-brand-purple" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
