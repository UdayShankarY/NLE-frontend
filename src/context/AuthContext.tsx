import React, { createContext, useCallback, useMemo, useState } from 'react';
import type { AuthTab, AuthUser } from '../types';

interface AuthState {
  isOpen: boolean;
  tab: AuthTab;
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

interface AuthContextValue extends AuthState {
  open: (tab?: AuthTab) => void;
  close: () => void;
  setTab: (tab: AuthTab) => void;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const user = JSON.parse(savedUser) as AuthUser;
      return {
        isOpen: false,
        tab: 'login' as AuthTab,
        user,
        isLoggedIn: true,
        isAdmin: user.role === 'admin',
      };
    }

    return {
      isOpen: false,
      tab: 'login' as AuthTab,
      user: null,
      isLoggedIn: false,
      isAdmin: false,
    };
  });

  const open = useCallback((tab: AuthTab = 'login') => {
    setState((s) => ({ ...s, isOpen: true, tab }));
    document.body.style.overflow = 'hidden';
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
    document.body.style.overflow = '';
  }, []);

  const setTab = useCallback((tab: AuthTab) => {
    setState((s) => ({ ...s, tab }));
  }, []);

  const login = useCallback((user: AuthUser) => {
    const isAdmin = user.role === 'admin';
    localStorage.setItem('user', JSON.stringify(user));
    setState((s) => ({ ...s, user, isLoggedIn: true, isAdmin, tab: 'success', isOpen: false }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState((s) => ({ ...s, user: null, isLoggedIn: false, isAdmin: false }));
    document.body.style.overflow = '';
  }, []);

  const value = useMemo(
    () => ({ ...state, open, close, setTab, login, logout }),
    [state, open, close, setTab, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthContextConsumer = AuthContext.Consumer;
export default AuthContext;