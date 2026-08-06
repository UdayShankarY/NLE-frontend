import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogIn, Menu, Moon, Sun, User, LogOut, Gift, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AdminCategory, AuthTab, AuthUser, Translations } from '../types';
import { AssistantTrigger } from './AssistantPanel';
import Avatar from './Avatar';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

const LOGO = (
  <img
    src="/final_logo.jpeg"
    alt="TheDecorParty"
    className="h-9 w-9 object-contain rounded-lg"
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
    <div className="border-b border-gray-100 dark:border-slate-800 last:border-0">
      <button
        className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-gray-800 dark:text-slate-200 transition-colors hover:text-brand-purple dark:hover:text-purple-300"
        onClick={() => (subs.length > 0 ? setOpen(o => !o) : onSelect(cat.name))}
      >
        <span>{cat.name}</span>
        {subs.length > 0 && (
          <ChevronDown size={14} className={cn('text-gray-400 dark:text-slate-500 transition-transform duration-200', open && 'rotate-180')} />
        )}
      </button>
      {open && subs.length > 0 && (
        <div className="flex flex-col gap-0.5 pb-3 pl-4 animate-fade-in">
          <button
            className="rounded-lg px-3 py-2 text-left text-sm text-gray-500 dark:text-slate-400 transition-colors hover:bg-brand-purple/10 dark:hover:bg-purple-950/30 hover:text-brand-purple dark:hover:text-purple-300"
            onClick={() => onSelect(cat.name, '__all__')}
          >
            All {cat.name}
          </button>
          {subs.map((s, i) => (
            <button
              key={i}
              className="rounded-lg px-3 py-2 text-left text-sm text-gray-500 dark:text-slate-400 transition-colors hover:bg-brand-purple/10 dark:hover:bg-purple-950/30 hover:text-brand-purple dark:hover:text-purple-300"
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
 * Site header — sticky with glassmorphism, premium dropdown, smooth mobile drawer.
 */
export const Header: React.FC<HeaderProps> = ({
  auth,
  t,
  onLogoClick,
  showAssistantButton = false,
  showMobileMenu = true,
  onAssistantOpen,
  categories = [],
  onSelectCategory,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownXOffset, setDropdownXOffset] = useState(0);
  const accountRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Scroll-aware shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fix dropdown overflow: measure rendered dropdown and shift right if it bleeds off left edge
  useEffect(() => {
    if (!accountOpen || !dropdownRef.current) {
      setDropdownXOffset(0);
      return;
    }
    // Small delay to allow transition to start
    const id = requestAnimationFrame(() => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const overflow = rect.left < 8 ? 8 - rect.left : 0;
      setDropdownXOffset(overflow);
    });
    return () => cancelAnimationFrame(id);
  }, [accountOpen]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setAccountOpen(false); setMobileMenuOpen(false); }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const isAdmin = auth.user?.role === 'admin';

  const userButton = auth.isLoggedIn ? (
    <div ref={accountRef} className="relative">
      <button
        type="button"
        aria-expanded={accountOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 pl-1 pr-3 text-gray-900 dark:text-white shadow-sm transition-all duration-200 hover:border-brand-purple-light hover:shadow-md"
        onClick={() => setAccountOpen(open => !open)}
      >
        <Avatar user={auth.user} alt={auth.user?.name || auth.user?.email || 'User avatar'} className="h-8 w-8 ring-2 ring-brand-purple/20" />
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-xs font-semibold text-gray-900 dark:text-white">Hello, {auth.user?.firstName}</span>
          <span className="text-[10px] text-gray-500 dark:text-slate-400">{t.mob_acc_title}</span>
        </span>
        <ChevronDown size={12} className={cn('transition-transform duration-200 text-gray-400 dark:text-slate-400', accountOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={cn(
          'absolute right-0 top-[calc(100%+8px)] z-50 w-72 origin-top-right rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-2 shadow-glass dark:shadow-purple-950/20 transition-all duration-200 sm:w-80',
          accountOpen ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        )}
        style={{ transform: `translateX(${dropdownXOffset}px)` }}
        role="menu"
      >
        {/* User card header */}
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-purple/10 to-brand-purple-light/10 p-3">
          <Avatar user={auth.user} alt={auth.user?.name || auth.user?.email || 'User avatar'} className="h-10 w-10 ring-2 ring-brand-purple/30" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-gray-900 dark:text-white">{auth.user?.name}</div>
            <div className="truncate text-xs text-gray-500 dark:text-slate-400">{auth.user?.email}</div>
          </div>
        </div>

        {/* Menu items */}
        <div className="mt-2 flex flex-col gap-0.5">
          <button
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
            onClick={() => { setAccountOpen(false); navigate('/profile'); }}
            role="menuitem"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-brand-purple dark:bg-slate-800 dark:text-purple-300">
              <User size={16} />
            </span>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{t.profile_tab || 'Profile'}</div>
              <div className="text-[11px] text-gray-500 dark:text-slate-400">View and edit personal details</div>
            </div>
          </button>

          <button
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
            onClick={() => { setAccountOpen(false); navigate('/wishlist'); }}
            role="menuitem"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-brand-purple dark:bg-slate-800 dark:text-purple-300">
              <Gift size={16} />
            </span>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">My Wishlist</div>
              <div className="text-[11px] text-gray-500 dark:text-slate-400">Saved packages &amp; favorites</div>
            </div>
          </button>

          {isAdmin && (
            <button
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/30"
              onClick={() => { setAccountOpen(false); navigate('/admin'); }}
              role="menuitem"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple text-white">
                👑
              </span>
              <div>
                <div className="font-semibold text-brand-purple dark:text-purple-300">Admin Portal</div>
                <div className="text-[11px] text-gray-500 dark:text-slate-400">Manage products &amp; orders</div>
              </div>
            </button>
          )}
        </div>

        {/* Sign out */}
        <div className="mt-2 border-t border-gray-100 pt-1.5 dark:border-slate-800">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => { auth.logout(); setAccountOpen(false); navigate('/'); }}
            role="menuitem"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/50">
              <LogOut size={16} />
            </span>
            {t.sign_out || 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  ) : (
    <button
      className="flex items-center gap-2 rounded-full border border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700 py-1.5 pl-3 pr-4 shadow-sm transition-all duration-200 hover:border-brand-purple-light hover:shadow-md"
      onClick={() => auth.open('login')}
    >
      <LogIn size={16} className="text-brand-purple dark:text-purple-300" />
      <span className="hidden flex-col items-start leading-tight sm:flex">
        <span className="text-xs font-semibold text-gray-900 dark:text-white">Hello, Sign in</span>
        <span className="text-[10px] text-gray-500 dark:text-slate-400">Account &amp; Orders</span>
      </span>
    </button>
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass dark:glass-dark shadow-sm border-b border-white/60 dark:border-slate-800'
          : 'bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800'
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1920px] items-center gap-3 px-4 md:px-8 lg:px-12">
        {/* Logo */}
        <a
          className="flex flex-shrink-0 items-center gap-2.5 text-lg font-extrabold text-gray-900 dark:text-white md:text-xl"
          href="#"
          onClick={e => { e.preventDefault(); onLogoClick(); }}
        >
          {LOGO}
          <span className="tracking-tight">
            TheDecor<em className="not-italic text-gradient-purple">Party</em>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {showAssistantButton && <AssistantTrigger onOpen={onAssistantOpen} />}
          <button
            type="button"
            aria-label="Toggle light/dark theme"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-90"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
          </button>
          {userButton}
          {showMobileMenu && (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 md:hidden"
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              'fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden',
              mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className={cn(
              'fixed inset-y-0 right-0 z-[110] flex h-[100dvh] w-[85%] max-w-xs flex-col bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.1,0.64,1)] md:hidden overflow-hidden',
              mobileMenuOpen ? 'translate-x-0 opacity-100 visible pointer-events-auto' : 'translate-x-full opacity-0 invisible pointer-events-none'
            )}
          >
            {/* Drawer header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-slate-800 px-5 py-4">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Browse Categories</span>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {categories.length === 0 ? (
                <div className="py-10 text-center text-xs font-bold text-gray-400 dark:text-slate-500">
                  Loading categories...
                </div>
              ) : (
                categories.map(cat => (
                  <MobCatItem
                    key={cat._id}
                    cat={cat}
                    onSelect={(catName, subName) => {
                      onSelectCategory?.(catName, subName);
                      setMobileMenuOpen(false);
                    }}
                  />
                ))
              )}
            </div>

            {/* Drawer footer */}
            <div className="shrink-0 border-t border-gray-100 dark:border-slate-800 p-4 space-y-2 bg-white dark:bg-slate-900">
              {auth.isLoggedIn && (
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-purple text-white py-2.5 text-xs font-bold shadow-md transition-all hover:bg-brand-purple-dark active:scale-[0.98] cursor-pointer"
                  onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                >
                  <User size={15} /> My Profile &amp; Orders
                </button>
              )}
              <AssistantTrigger
                mobile
                onOpen={() => {
                  onAssistantOpen();
                  setMobileMenuOpen(false);
                }}
              />
              {!auth.isLoggedIn ? (
                <button
                  className="w-full rounded-xl bg-gradient-to-r from-brand-purple to-brand-purple-light py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg hover:opacity-90 cursor-pointer"
                  onClick={() => { auth.open('login'); setMobileMenuOpen(false); }}
                >
                  Sign in / Register
                </button>
              ) : (
                <button
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                  onClick={() => { auth.logout(); setMobileMenuOpen(false); }}
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
