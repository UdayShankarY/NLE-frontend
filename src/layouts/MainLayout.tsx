import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthModal } from '../components/AuthModal';
import { AssistantPanel } from '../components/AssistantPanel';
import { CartPage } from '../components/CartPage';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { FloatingActionMenu } from '../components/FloatingActionMenu';
import type { AdminCategory, AuthTab, AuthUser, CartItem, Translations } from '../types';
import type { AssistantMessage } from '../components/AssistantPanel';
import type { AuthRedirect } from '../context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  auth: {
    isLoggedIn: boolean;
    isAdmin: boolean;
    user: AuthUser | null;
    open: (tab?: AuthTab) => void;
    logout: () => void;
    close: () => void;
    setTab: (tab: AuthTab) => void;
    login: (user: AuthUser, token?: string) => void;
    isOpen: boolean;
    tab: AuthTab;
    isLoading: boolean;
    initialized: boolean;
    authRedirect: AuthRedirect | null;
    clearAuthRedirect: () => void;
    updateUser: (user: AuthUser) => void;
  };
  t: Record<string, string> | Translations;
  onAssistantOpen: () => void;
  onLogoClick: () => void;
  showAssistantButton?: boolean;
  showMobileMenu?: boolean;
  categories?: AdminCategory[];
  onSelectCategory?: (catName: string, subName?: string) => void;
  assistantOpen: boolean;
  assistantMessages: AssistantMessage[];
  assistantInput: string;
  assistantInputRef: React.RefObject<HTMLInputElement>;
  onAssistantClose: () => void;
  onAssistantInputChange: (value: string) => void;
  onAssistantSubmit: (e: React.FormEvent) => void;
  cartOpen: boolean;
  cartItems: CartItem[];
  cartTotal: number;
  onCartRemove: (id: string) => void;
  onCartUpdateQty: (id: string, qty: number) => void;
  onCartClear: () => void;
  onCartClose: () => void;
  onCartLoginClick: () => void;
  onTermsPageOpen: (key: 'terms' | 'privacy' | 'refund' | 'about') => void;
  onLogin?: (user: AuthUser, token?: string) => void;
  onCloseAuth: () => void;
  onSetAuthTab: (tab: AuthTab) => void;
  authModalOpen: boolean;
  authModalTab: AuthTab;
  hideShell?: boolean;
}

export default function MainLayout({
  children,
  auth,
  t,
  onAssistantOpen,
  onLogoClick,
  showAssistantButton = false,
  showMobileMenu = true,
  categories = [],
  onSelectCategory,
  assistantOpen,
  assistantMessages,
  assistantInput,
  assistantInputRef,
  onAssistantClose,
  onAssistantInputChange,
  onAssistantSubmit,
  cartOpen,
  cartItems,
  cartTotal,
  onCartRemove,
  onCartUpdateQty,
  onCartClear,
  onCartClose,
  onCartLoginClick,
  onTermsPageOpen,
  onLogin,
  onCloseAuth,
  onSetAuthTab,
  authModalOpen,
  authModalTab,
  hideShell = false,
}: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const handledAuthRedirect = useRef(false);
  const handledAdminLanding = useRef(false);

  useEffect(() => {
    if (!auth.initialized || !auth.isLoggedIn || auth.tab !== 'success') {
      handledAuthRedirect.current = false;
      handledAdminLanding.current = false;
      return;
    }

    if (location.pathname.startsWith('/admin') || location.pathname === '/profile') return;

    if (auth.authRedirect) {
      const redirect = auth.authRedirect;
      const targetSearch = redirect.search || '';
      const targetHash = redirect.hash || '';
      const targetMatches = location.pathname === redirect.pathname
        && location.search === targetSearch
        && location.hash === targetHash;

      if (!targetMatches) {
        navigate(
          { pathname: redirect.pathname, search: redirect.search, hash: redirect.hash },
          { replace: true, state: redirect.state }
        );
        return;
      }

      handledAuthRedirect.current = true;
      auth.clearAuthRedirect();
      return;
    }

    if (auth.isAdmin && !handledAdminLanding.current && !location.pathname.startsWith('/admin')) {
      handledAdminLanding.current = true;
      navigate('/admin', { replace: true });
      return;
    }

    if (handledAuthRedirect.current) return;

    handledAuthRedirect.current = true;
  }, [auth.authRedirect, auth.clearAuthRedirect, auth.initialized, auth.isAdmin, auth.isLoggedIn, auth.tab, location.pathname, navigate]);

  const internalHandleLogin = (user: AuthUser, token?: string) => {
    try {
      auth.login(user, token);
    } catch (err) {
      // fallback: if auth object doesn't expose login, ignore
    }
  };
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      {hideShell ? (
        children
      ) : (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-200">
          <Header
            auth={auth}
            t={t as Translations}
            onLogoClick={onLogoClick}
            onAssistantOpen={onAssistantOpen}
            showAssistantButton={showAssistantButton}
            showMobileMenu={showMobileMenu}
            categories={categories}
            onSelectCategory={onSelectCategory}
          />
          <main className="flex-1 overflow-hidden">{children}</main>
          <Footer t={t as any} onPageOpen={onTermsPageOpen} categories={categories} onSelectCategory={onSelectCategory} />
          <AssistantPanel
            open={assistantOpen}
            onClose={onAssistantClose}
            messages={assistantMessages}
            inputValue={assistantInput}
            onInputChange={onAssistantInputChange}
            onSubmit={onAssistantSubmit}
            inputRef={assistantInputRef}
          />
          {cartOpen && (
            <CartPage
              items={cartItems}
              total={cartTotal}
              onRemove={onCartRemove}
              onUpdateQty={onCartUpdateQty}
              onClear={onCartClear}
              onClose={onCartClose}
              isLoggedIn={auth.isLoggedIn}
              onLoginClick={onCartLoginClick}
            />
          )}
          <AuthModal isOpen={authModalOpen} tab={authModalTab} onClose={onCloseAuth} onSetTab={onSetAuthTab} onLogin={onLogin || internalHandleLogin} />
        </div>
      )}
      {!hideShell && <FloatingActionMenu onAssistantOpen={onAssistantOpen} />}
    </>
  );
}