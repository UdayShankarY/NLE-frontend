import React, { useState } from 'react';
import { ChevronDown, LogIn, Menu } from 'lucide-react';
import type { AdminCategory, AuthTab, AuthUser } from '../types';
import { AssistantTrigger } from './AssistantPanel';
import { cn } from '../lib/utils';

const LOGO = (
  <img
    src="/final_logo.jpeg"
    alt="TheDecorParty"
    className="h-9 w-9 object-contain"
  />
);

interface MobCatItemProps {
  cat: AdminCategory;
  onSelect: (catName: string, subName?: string) => void;
}

const MobCatItem: React.FC<MobCatItemProps> = ({ cat, onSelect }) => {
  const [open, setOpen] = useState(false);
  const subs = (cat.subcategories || []).filter(
    (s): s is { name: string; image: string } => typeof s === 'object' && s !== null
  );
  return (
    <div className="border-b border-border/70 last:border-0">
      <button
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-ink"
        onClick={() => (subs.length > 0 ? setOpen(o => !o) : onSelect(cat.name))}
      >
        <span>{cat.name}</span>
        {subs.length > 0 && (
          <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
        )}
      </button>
      {open && subs.length > 0 && (
        <div className="flex flex-col gap-1 pb-3 pl-3">
          <button
            className="rounded-md px-2 py-1.5 text-left text-sm text-ink-muted hover:bg-brand-purple/5"
            onClick={() => onSelect(cat.name, '__all__')}
          >
            All {cat.name}
          </button>
          {subs.map((s, i) => (
            <button
              key={i}
              className="rounded-md px-2 py-1.5 text-left text-sm text-ink-muted hover:bg-brand-purple/5"
              onClick={() => onSelect(cat.name, s.name)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface AuthSlice {
  isLoggedIn: boolean;
  user: AuthUser | null;
  open: (tab?: AuthTab) => void;
  logout: () => void;
}

export interface HeaderProps {
  auth: AuthSlice;
  onLogoClick: () => void;
  /** Home page shows an assistant shortcut inline next to the account button. */
  showAssistantButton?: boolean;
  /** Booking flow hides the hamburger + mobile category drawer entirely. */
  showMobileMenu?: boolean;
  onAssistantOpen: () => void;
  categories?: AdminCategory[];
  onSelectCategory?: (catName: string, subName?: string) => void;
}

/**
 * Site header. Previously duplicated verbatim across three branches of App.tsx
 * (home / product detail / booking) as `.nh` markup — now one component
 * driven by props so each page's real differences (mobile menu, assistant
 * button) are explicit instead of copy-pasted.
 */
export const Header: React.FC<HeaderProps> = ({
  auth,
  onLogoClick,
  showAssistantButton = false,
  showMobileMenu = false,
  onAssistantOpen,
  categories = [],
  onSelectCategory,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userButton = auth.isLoggedIn ? (
    <div className="relative group">
      <button className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 hover:border-brand-purple-light">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white">
          {auth.user?.firstName?.[0]?.toUpperCase()}
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-xs font-semibold text-ink">Hello, {auth.user?.firstName}</span>
          <span className="text-[11px] text-ink-muted">Account &amp; Orders</span>
        </span>
        <ChevronDown size={12} className="text-ink-muted" />
      </button>
      <div className="invisible absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-border bg-white py-1.5 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
        <button
          className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-brand-purple/5"
          onClick={auth.logout}
        >
          Sign out
        </button>
      </div>
    </div>
  ) : (
    <button
      className="flex items-center gap-2 rounded-full border border-border py-1.5 pl-3 pr-3 hover:border-brand-purple-light"
      onClick={() => auth.open('login')}
    >
      <LogIn size={18} className="text-ink" />
      <span className="hidden flex-col items-start leading-tight sm:flex">
        <span className="text-xs font-semibold text-ink">Hello, Sign in</span>
        <span className="text-[11px] text-ink-muted">Account &amp; Orders</span>
      </span>
    </button>
  );

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:px-6">
        <a
          className="flex flex-shrink-0 items-center gap-2 text-lg font-extrabold text-ink md:text-xl"
          href="#"
          onClick={e => { e.preventDefault(); onLogoClick(); }}
        >
          {LOGO}
          <span>
            TheDecor<em className="not-italic text-brand-purple">Party</em>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {showAssistantButton && <AssistantTrigger onOpen={onAssistantOpen} />}
          {userButton}
          {showMobileMenu && (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-black/5 md:hidden"
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
        </div>
      </div>

      {showMobileMenu && (
        <>
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-[100] bg-black/40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          <div
            className={cn(
              'fixed inset-y-0 right-0 z-[101] w-[82%] max-w-xs overflow-y-auto bg-white p-4 shadow-2xl transition-transform duration-300 md:hidden',
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            <div className="flex flex-col">
              {categories.map(cat => (
                <MobCatItem
                  key={cat._id}
                  cat={cat}
                  onSelect={(catName, subName) => {
                    onSelectCategory?.(catName, subName);
                    setMobileMenuOpen(false);
                  }}
                />
              ))}
            </div>
            <div className="my-3 h-px bg-border" />
            <AssistantTrigger
              mobile
              onOpen={() => {
                onAssistantOpen();
                setMobileMenuOpen(false);
              }}
            />
            {!auth.isLoggedIn ? (
              <button
                className="mt-2 w-full rounded-lg bg-brand-purple py-3 text-sm font-semibold text-white hover:bg-brand-purple-dark"
                onClick={() => { auth.open('login'); setMobileMenuOpen(false); }}
              >
                Sign in / Register
              </button>
            ) : (
              <button
                className="mt-2 w-full rounded-lg bg-brand-purple py-3 text-sm font-semibold text-white hover:bg-brand-purple-dark"
                onClick={() => { auth.logout(); setMobileMenuOpen(false); }}
              >
                Sign out
              </button>
            )}
          </div>
        </>
      )}
    </header>
  );
};
