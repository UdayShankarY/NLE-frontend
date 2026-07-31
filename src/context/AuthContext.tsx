import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthTab, AuthUser } from '../types';
export interface AuthRedirect {
  pathname: string;
  search?: string;
  hash?: string;
  state?: unknown;
}

interface AuthState {
  isOpen: boolean;
  tab: AuthTab;
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  initialized: boolean;
  authRedirect: AuthRedirect | null;
}

interface AuthContextValue extends AuthState {
  open: (tab?: AuthTab) => void;
  close: () => void;
  setTab: (tab: AuthTab) => void;
  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
  setAuthRedirect: (redirect: AuthRedirect) => void;
  clearAuthRedirect: () => void;
}

const initialAuthState: AuthState = {
  isOpen: false,
  tab: 'login' as AuthTab,
  user: null,
  isLoggedIn: false,
  isAdmin: false,
  isLoading: true,
  initialized: false,
  authRedirect: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialAuthState);

  useEffect(() => {
    if (state.initialized) return;

    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (savedUser && token) {
        const user = JSON.parse(savedUser) as AuthUser;
        setState({
          isOpen: false,
          tab: 'login' as AuthTab,
          user,
          isLoggedIn: true,
          isAdmin: user.role === 'admin',
          isLoading: false,
          initialized: true,
          authRedirect: null,
        });
        return;
      }
    } catch {
      // Fall back to an unauthenticated state if the stored value is invalid.
    }

    setState((prev) => ({ ...prev, isLoading: false, initialized: true }));
  }, [state.initialized]);

  const open = useCallback((tab: AuthTab = 'login') => {
    setState((s) => ({ ...s, isOpen: true, tab }));
    document.body.style.overflow = 'hidden';
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false, authRedirect: null }));
    document.body.style.overflow = '';
  }, []);

  const setTab = useCallback((tab: AuthTab) => {
    setState((s) => ({ ...s, tab }));
  }, []);

  const login = useCallback((user: AuthUser, token?: string) => {
    const isAdmin = user.role === 'admin';

    if (token) {
      localStorage.setItem('token', token);
    }

    localStorage.setItem('user', JSON.stringify(user));

    setState((prev) => ({
      ...prev,
      user,
      isLoggedIn: true,
      isAdmin,
      tab: 'success',
      isOpen: false,
      isLoading: false,
      initialized: true,
    }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState((prev) => ({
      ...prev,
      user: null,
      isLoggedIn: false,
      isAdmin: false,
      tab: 'login',
      isOpen: false,
      isLoading: false,
      initialized: true,
      authRedirect: null,
    }));
    document.body.style.overflow = '';
  }, []);

  const setAuthRedirect = useCallback((redirect: AuthRedirect) => {
    setState((prev) => ({ ...prev, authRedirect: redirect }));
  }, []);

  const clearAuthRedirect = useCallback(() => {
    setState((prev) => ({ ...prev, authRedirect: null }));
  }, []);

  const value = useMemo(
    () => ({ ...state, open, close, setTab, login, logout, setAuthRedirect, clearAuthRedirect }),
    [state, open, close, setTab, login, logout, setAuthRedirect, clearAuthRedirect]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthContextConsumer = AuthContext.Consumer;
export default AuthContext;