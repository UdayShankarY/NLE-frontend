import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogIn, Menu, Moon, Sun, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AdminCategory, AuthTab, AuthUser, Translations } from '../types';
import { AssistantTrigger } from './AssistantPanel';
import Avatar from './Avatar';
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
  t: Translations;
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
  t,
  onLogoClick,
  showAssistantButton = false,
  showMobileMenu = false,
  onAssistantOpen,
  categories = [],
  onSelectCategory,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const accountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const userButton = auth.isLoggedIn ? (
    <div ref={accountRef} className="relative">
      <button
        type="button"
        aria-expanded={accountOpen}
        aria-haspopup="menu"
        className={cn('flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors', darkMode ? 'border-slate-700 bg-slate-900 text-white hover:border-brand-purple-light' : 'border-border bg-white hover:border-brand-purple-light')}
        onClick={() => setAccountOpen(open => !open)}
      >
        <Avatar user={auth.user} alt={auth.user?.name || auth.user?.email || 'User avatar'} className="h-8 w-8" />
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className={cn('text-xs font-semibold', darkMode ? 'text-white' : 'text-ink')}>Hello, {auth.user?.firstName}</span>
          <span className={darkMode ? 'text-[11px] text-slate-300' : 'text-[11px] text-ink-muted'}>{t.mob_acc_title}</span>
        </span>
        <ChevronDown size={12} className={cn('transition-transform', accountOpen && 'rotate-180', darkMode ? 'text-slate-300' : 'text-ink-muted')} />
      </button>
      <div className={cn('absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] origin-top-right rounded-xl border p-2 shadow-xl transition-all duration-200', accountOpen ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-1 scale-95 opacity-0', darkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-border bg-white text-ink')} role="menu">
        <div className="flex items-center gap-3 border-b border-current/10 px-3 py-3">
          <Avatar user={auth.user} alt={auth.user?.name || auth.user?.email || 'User avatar'} className="h-11 w-11 flex-shrink-0" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{[auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ')}</div>
            <div className={cn('truncate text-xs', darkMode ? 'text-slate-300' : 'text-ink-muted')}>{auth.user?.email}</div>
          </div>
        </div>
        <div className="py-2">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-brand-purple/10" onClick={() => { setAccountOpen(false); navigate('/profile'); }}>
            <User size={17} /> {t.profile || 'Profile'}
          </button>
          <div className="mt-1 border-t border-current/10 px-3 pt-2">
            <div className="mb-2 flex items-center gap-3 text-sm"><Moon size={17} /> {t.theme_label || 'Theme'}</div>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/10">
              <button className={cn('flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs', !darkMode && 'bg-white font-semibold shadow-sm')} onClick={() => setDarkMode(false)}><Sun size={14} /> {t.light_mode || 'Light'}</button>
              <button className={cn('flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs', darkMode && 'bg-slate-700 font-semibold')} onClick={() => setDarkMode(true)}><Moon size={14} /> {t.dark_mode || 'Dark'}</button>
            </div>
          </div>
        </div>
        <div className="border-t border-current/10 pt-2">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => { auth.logout(); setAccountOpen(false); navigate('/'); }}>
            <LogOut size={17} /> {t.sign_out || 'Sign Out'}
          </button>
        </div>
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
