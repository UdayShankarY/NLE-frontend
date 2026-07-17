import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthModal } from '../components/AuthModal';
import { AssistantPanel } from '../components/AssistantPanel';
import { CartPage } from '../components/CartPage';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import type { AdminCategory, AuthTab, AuthUser, CartItem, Translations } from '../types';
import type { AssistantMessage } from '../components/AssistantPanel';

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

const WA_FAB = (
  <a className="wa-fab" href="https://wa.me/917022058460" target="_blank" rel="noreferrer" title="Chat on WhatsApp">
    <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
  </a>
);

export default function MainLayout({
  children,
  auth,
  t,
  onAssistantOpen,
  onLogoClick,
  showAssistantButton = false,
  showMobileMenu = false,
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

  useEffect(() => {
    if (!auth.initialized || !auth.isLoggedIn || auth.tab !== 'success') return;

    if (location.pathname.startsWith('/admin')) return;

    const redirectPath = auth.isAdmin ? '/admin' : '/';
    if (location.pathname !== redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [auth.initialized, auth.isAdmin, auth.isLoggedIn, auth.tab, location.pathname, navigate]);

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
        <>
          <Header
            auth={auth}
            onLogoClick={onLogoClick}
            onAssistantOpen={onAssistantOpen}
            showAssistantButton={showAssistantButton}
            showMobileMenu={showMobileMenu}
            categories={categories}
            onSelectCategory={onSelectCategory}
          />
          {children}
          <Footer t={t as any} onPageOpen={onTermsPageOpen} />
          <AssistantPanel
            open={assistantOpen}
            onClose={onAssistantClose}
            messages={assistantMessages}
            inputValue={assistantInput}
            onInputChange={onAssistantInputChange}
            onSubmit={onAssistantSubmit}
            inputRef={assistantInputRef}
          />
          {WA_FAB}
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
        </>
      )}
    </>
  );
}