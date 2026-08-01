import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { getApiUrl } from '../lib/api';
import type { AdminProduct } from '../types';

interface WishlistResponse {
  wishlist: AdminProduct[];
}

export function useWishlist() {
  const auth = useAuth();
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchWishlist = useCallback(async () => {
    if (inFlight.current) {
      return;
    }

    if (!auth.isLoggedIn || !auth.user?.id) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setItems([]);
      setError('Your session expired. Please log in again.');
      setLoading(false);
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    console.debug('[useWishlist] fetchWishlist start', { userId: auth.user?.id, time: Date.now() });

    try {
      const response = await fetch(getApiUrl('/api/wishlist'), {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      console.debug('[useWishlist] fetchWishlist response received', { status: response.status, time: Date.now() });
      clearTimeout(timeout);

      const payload = (await response.json().catch(() => null)) as WishlistResponse | null;
      if (!response.ok || !payload?.wishlist) {
        const msg = (payload as any)?.msg || 'Failed to load wishlist';
        console.error('Wishlist fetch failed:', response.status, msg, payload);
        throw new Error(msg);
      }

      if (mountedRef.current) {
        setItems(payload.wishlist);
        const newIds = payload.wishlist.map((product) => String(product._id));
        const oldIds = Array.isArray(auth.user?.wishlist) ? auth.user!.wishlist.map(String) : [];
        const oldSet = new Set(oldIds);
        const equal = newIds.length === oldIds.length && newIds.every((id) => oldSet.has(id));
        if (!equal) {
          auth.updateUser({ wishlist: newIds });
        }
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        console.error('Wishlist fetch aborted (timeout)');
        if (mountedRef.current) {
          setError('Request timed out. Please retry.');
        }
      } else {
        console.error('Wishlist fetch error:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
      if (mountedRef.current) {
        setItems([]);
      }
    } finally {
      inFlight.current = false;
      clearTimeout(timeout);
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [auth]);

  useEffect(() => {
    if (!auth.isLoggedIn || !auth.user?.id) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    void fetchWishlist();
  }, [auth.isLoggedIn, auth.user?.id, fetchWishlist]);

  const wishlistIds = useMemo(() => new Set(items.map((product) => product._id)), [items]);

  const toggleWishlist = useCallback(
    async (product: AdminProduct, wished: boolean) => {
      if (!auth.isLoggedIn || !auth.user) {
        auth.open('login');
        return false;
      }

      try {
        const token = localStorage.getItem('token');
        const url = getApiUrl(`/api/wishlist/${product._id}`);
        const response = await fetch(url, {
          method: wished ? 'POST' : 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = (await response.json().catch(() => null)) as WishlistResponse | null;
        if (!response.ok || !payload?.wishlist) {
          throw new Error((payload as any)?.msg || 'Failed to update wishlist');
        }

        setItems(payload.wishlist);
        auth.updateUser({
          wishlist: payload.wishlist.map((item) => String(item._id)),
        });
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    [auth]
  );

  const isWished = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  return {
    items,
    loading,
    error,
    fetchWishlist,
    wishlistIds,
    isWished,
    toggleWishlist,
  };
}
