import { useState, useCallback } from 'react';
import type { CartItem, AdminProduct, BookingDetails } from '../types';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  });

  const addItem = useCallback((product: AdminProduct, bookingDetails?: BookingDetails) => {
    setItems(prev => {
      const exists = prev.find(i => i._id === product._id);
      if (!exists) {
        fetch(`/api/products/${product._id}/order`, { method: 'POST' }).catch(() => {});
      }
      const next = exists
        ? prev.map(i => i._id === product._id
            ? { ...i, qty: i.qty + 1, bookingDetails: bookingDetails ? [...i.bookingDetails, bookingDetails] : i.bookingDetails }
            : i)
        : [...prev, {
            _id: product._id,
            name: product.name,
            image: product.image,
            price: product.price,
            originalPrice: product.originalPrice,
            categoryName: product.categoryName,
            badge: product.badge,
            badgeColor: product.badgeColor,
            qty: 1,
            bookingDetails: bookingDetails ? [bookingDetails] : [],
          }];
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i._id !== id);
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => {
      const next = prev.map(i => i._id === id ? { ...i, qty } : i);
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart');
  }, []);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return { items, addItem, removeItem, updateQty, clearCart, total, count };
}
