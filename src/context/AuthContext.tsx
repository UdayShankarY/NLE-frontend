import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthTab, AuthUser } from '../types';
import { getApiUrl } from '../lib/api';

const ADMIN_EMAIL = 'admin@nextlevelevents.com';

function decodeJwtRole(token: string) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base64).split('').map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join(''));
    const parsed = JSON.parse(json) as { role?: unknown };
    return typeof parsed.role === 'string' ? parsed.role : null;
  } catch {
    return null;
  }
}

function isAdminEmail(email: string | undefined) {
  return typeof email === 'string' && email.toLowerCase() === ADMIN_EMAIL;
}

function resolveRole(user: Partial<AuthUser> | null | undefined, token?: string | null) {
  const decodedRole = token ? decodeJwtRole(token) : null;
  const email = typeof user?.email === 'string' ? user.email : '';
  return user?.role === 'admin' || decodedRole === 'admin' || isAdminEmail(email) ? 'admin' : 'user';
}

function normalizeUser(user: AuthUser, token?: string) {
  const normalizedRole = resolveRole(user, token);
  return {
    ...user,
    role: normalizedRole,
    name: user.name?.trim() || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    avatar: user.avatar?.trim() || user.photoURL?.trim() || '',
    wishlist: Array.isArray(user.wishlist) ? user.wishlist.map((id) => String(id)) : [],
    firstName: user.firstName?.trim() || '',
    lastName: user.lastName?.trim() || '',
    photoURL: user.photoURL?.trim() || '',
  } as AuthUser;
}

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
  updateUser: (user: Partial<AuthUser>) => void;
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

    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    console.log('AuthContext init token:', token);
    console.log('AuthContext savedUser:', savedUser);
    const decodedRole = token ? decodeJwtRole(token) : null;
    console.log('AuthContext decoded JWT role:', decodedRole);

    if (!token) {
      localStorage.removeItem('user');
      setState(prev => ({
        ...prev,
        user: null,
        isLoggedIn: false,
        isAdmin: false,
        isLoading: false,
        initialized: true,
        authRedirect: null,
      }));
      return;
    }

    let initialUser: AuthUser | null = null;
    if (savedUser) {
      try {
        initialUser = JSON.parse(savedUser) as AuthUser;
        const restoredRole = resolveRole(initialUser, token);
        const restoredUser = normalizeUser({ ...initialUser, role: restoredRole }, token);
        setState(prev => ({
          ...prev,
          user: restoredUser,
          isLoggedIn: true,
          isAdmin: restoredRole === 'admin',
          isLoading: true,
          initialized: false,
          authRedirect: null,
        }));
      } catch {
        initialUser = null;
        localStorage.removeItem('user');
      }
    } else {
      setState(prev => ({ ...prev, isLoading: true, initialized: false }));
    }

    fetch(getApiUrl('/api/auth/profile'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async response => {
        const payload = await response.json().catch(() => null);
        console.log('/api/auth/profile response:', payload);
        if (!response.ok || !payload?.user) throw new Error('Failed to restore authenticated user');
        return payload.user as AuthUser;
      })
      .then((user) => {
        const normalizedUser = normalizeUser(user as AuthUser, token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        console.log('AuthContext restored user:', normalizedUser);
        setState({
          isOpen: false,
          tab: 'login' as AuthTab,
          user: normalizedUser,
          isLoggedIn: true,
          isAdmin: normalizedUser.role === 'admin',
          isLoading: false,
          initialized: true,
          authRedirect: null,
        });
      })
      .catch((err) => {
        console.log('AuthContext restore failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setState(prev => ({ ...prev, user: null, isLoggedIn: false, isAdmin: false, isLoading: false, initialized: true, authRedirect: null }));
      });
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
    const normalizedUser = normalizeUser(user, token);

    if (token) {
      localStorage.setItem('token', token);
    }

    localStorage.setItem('user', JSON.stringify(normalizedUser));

    setState((prev) => ({
      ...prev,
      user: normalizedUser,
      isLoggedIn: true,
      isAdmin: normalizedUser.role === 'admin',
      tab: 'success',
      isOpen: false,
      isLoading: false,
      initialized: true,
    }));
    document.body.style.overflow = '';
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

  const updateUser = useCallback((user: Partial<AuthUser>) => {
    setState((prev) => {
      const token = localStorage.getItem('token');
      const nextUser = normalizeUser({ ...(prev.user ?? {}), ...user } as AuthUser, token ?? undefined);
      localStorage.setItem('user', JSON.stringify(nextUser));
      return {
        ...prev,
        user: nextUser,
        isLoggedIn: true,
        isAdmin: nextUser.role === 'admin',
      };
    });
  }, []);

  const value = useMemo(
    () => ({ ...state, open, close, setTab, login, logout, setAuthRedirect, clearAuthRedirect, updateUser }),
    [state, open, close, setTab, login, logout, setAuthRedirect, clearAuthRedirect, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthContextConsumer = AuthContext.Consumer;
export default AuthContext;