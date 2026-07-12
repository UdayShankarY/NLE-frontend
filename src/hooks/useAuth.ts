import { useState, useCallback, useEffect } from 'react';
import type { AuthTab, AuthUser } from '../types';

interface AuthState {
  isOpen: boolean;
  tab: AuthTab;
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const user = JSON.parse(savedUser);
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
    setState(s => ({ ...s, isOpen: true, tab }));
    document.body.style.overflow = 'hidden';
  }, []);

  const close = useCallback(() => {
    setState(s => ({ ...s, isOpen: false }));
    document.body.style.overflow = '';
  }, []);

  const setTab = useCallback((tab: AuthTab) => {
    setState(s => ({ ...s, tab }));
  }, []);

  const login = useCallback((user: AuthUser) => {
    const isAdmin = user.role === 'admin';
    localStorage.setItem('user', JSON.stringify(user));
    setState(s => ({ ...s, user, isLoggedIn: true, isAdmin, tab: 'success' }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState(s => ({ ...s, user: null, isLoggedIn: false, isAdmin: false }));
    document.body.style.overflow = '';
  }, []);

  return { ...state, open, close, setTab, login, logout };
}
