import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => (
  <div className="border-b border-border bg-white px-4 py-3">
    <div className="mx-auto flex max-w-[720px] items-center gap-2 rounded-full border border-border px-4 py-2.5 focus-within:border-brand-purple-light">
      <Search size={18} className="flex-shrink-0 text-ink-muted" />
      <input
        type="text"
        placeholder="Search birthday decor, candlelight dinner..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear search" className="flex-shrink-0 text-ink-muted hover:text-ink">
          <X size={16} />
        </button>
      )}
    </div>
  </div>
);
