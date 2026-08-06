import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  category?: string | null;
  subcategory?: string | null;
  productName?: string | null;
}

export function getPageContextPlaceholder({
  category,
  subcategory,
  productName,
  customPlaceholder,
}: {
  category?: string | null;
  subcategory?: string | null;
  productName?: string | null;
  customPlaceholder?: string;
}): string {
  if (customPlaceholder) return customPlaceholder;

  // Specific Product Page
  if (productName) {
    return 'Search Decoration Packages...';
  }

  // Subcategory Product Listing (e.g. Mascots, Magicians, Caricatures)
  if (subcategory && subcategory !== '__all__') {
    const sub = subcategory.trim();
    if (/package/i.test(sub)) return `Search ${sub}...`;
    return `Search ${sub} Packages...`;
  }

  // Category Page (e.g. Kids Activities, Birthday Decoration)
  if (category) {
    const cat = category.trim();
    return `Search within ${cat}...`;
  }

  // Default Landing Page
  return 'Search Birthday Decorations...';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
  category,
  subcategory,
  productName,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const targetSentence = useMemo(() => {
    return getPageContextPlaceholder({
      category,
      subcategory,
      productName,
      customPlaceholder: placeholder,
    });
  }, [category, subcategory, productName, placeholder]);

  // Reset typewriter when target sentence changes
  useEffect(() => {
    setDisplayText('');
    setIsDeleting(false);
  }, [targetSentence]);

  useEffect(() => {
    // Stop animation when input is focused or user has entered text
    if (isFocused || value) {
      setDisplayText('');
      setIsDeleting(false);
      return;
    }

    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayText.length < targetSentence.length) {
        // Typing character by character
        timer = setTimeout(() => {
          setDisplayText(targetSentence.slice(0, displayText.length + 1));
        }, 55);
      } else {
        // Pause for 2 seconds after sentence is completely typed
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
      }
    } else {
      if (displayText.length > 0) {
        // Deleting character by character
        timer = setTimeout(() => {
          setDisplayText(targetSentence.slice(0, displayText.length - 1));
        }, 30);
      } else {
        // Pause briefly before re-typing the exact SAME sentence
        timer = setTimeout(() => {
          setIsDeleting(false);
        }, 300);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, isFocused, value, targetSentence]);

  // Active placeholder string shown to user
  const activePlaceholder = isFocused || value
    ? targetSentence
    : (displayText || targetSentence);

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 px-4 py-3 md:py-4 transition-colors">
      <div
        className={`mx-auto flex max-w-[680px] items-center gap-3 rounded-2xl border bg-white dark:bg-slate-800/90 px-4 py-3 cursor-text transition-all duration-200 ${
          isFocused
            ? 'border-brand-purple/60 shadow-md shadow-purple-950/5 ring-2 ring-brand-purple/10 dark:border-purple-500'
            : 'border-gray-200/90 dark:border-slate-700 shadow-xs hover:border-gray-300 dark:hover:border-slate-600'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <Search
          size={18}
          className={`flex-shrink-0 transition-colors duration-200 ${
            isFocused ? 'text-brand-purple dark:text-purple-400' : 'text-gray-400 dark:text-slate-400'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={activePlaceholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent text-sm text-gray-800 dark:text-slate-100 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500 placeholder:transition-opacity placeholder:duration-150 font-normal"
        />
        {value && (
          <button
            onClick={e => {
              e.stopPropagation();
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-300 transition-all duration-150 hover:bg-gray-300 dark:hover:bg-slate-600 active:scale-90"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
