import React from 'react';
import { ShoppingCart, X, Minus, Plus, Trash2, Rocket } from 'lucide-react';
import type { CartItem } from '../types';

interface CartPageProps {
  items: CartItem[];
  total: number;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onClear: () => void;
  onClose: () => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  items, total, onRemove, onUpdateQty, onClear, onClose, isLoggedIn, onLoginClick,
}) => {
  const handleCheckout = () => {
    if (!isLoggedIn) { onLoginClick(); return; }

    const D = String.fromCodePoint(0x2501).repeat(22);

    const lines = items.flatMap(i => {
      if (i.bookingDetails.length === 0) {
        return [
          D,
          String.fromCodePoint(0x1F4E6) + ' *Package*',
          '    ' + i.name + '  x' + i.qty,
          String.fromCodePoint(0x1F4B0) + ' *Price:* Rs.' + (i.price * i.qty).toLocaleString(),
        ].join('\n');
      }
      return i.bookingDetails.map((b, idx) => {
        const label = i.bookingDetails.length > 1 ? ' — Booking ' + (idx + 1) : '';
        const parts = [
          D,
          String.fromCodePoint(0x1F4E6) + ' *Package' + label + '*',
          '    ' + i.name,
          String.fromCodePoint(0x1F4B0) + ' *Price:* Rs.' + i.price.toLocaleString() + (i.originalPrice ? '  ~Rs.' + i.originalPrice.toLocaleString() + '~' : ''),
          String.fromCodePoint(0x1F4C5) + ' *Event Date:* ' + b.eventDate + ' at ' + b.eventTime,
          String.fromCodePoint(0x1F4CD) + ' *Venue:* ' + b.location,
          String.fromCodePoint(0x1F4DE) + ' *Contact:* +91 ' + b.mobile,
        ];
        if (b.requests) parts.push(String.fromCodePoint(0x1F4DD) + ' *Special Requests:* ' + b.requests);
        return parts.join('\n');
      });
    }).join('\n\n');

    const msg = [
      String.fromCodePoint(0x1F389) + ' *New Booking Request — TheDecorParty*',
      '',
      lines,
      '',
      D,
      String.fromCodePoint(0x1F4B3) + ' *Order Total: Rs.' + total.toLocaleString() + '*',
      D,
      '',
      'Kindly confirm availability and share payment details. Thank you! ' + String.fromCodePoint(0x1F64F),
    ].join('\n');

    window.open('https://wa.me/917022058460?text=' + encodeURIComponent(msg), '_blank');
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/45" onClick={onClose}>
      <div
        className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 text-lg font-bold text-ink">
            <ShoppingCart size={20} />
            Your Cart
            {items.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-purple px-1.5 text-xs font-bold text-white">
                {items.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </div>
          <button className="rounded-md p-1.5 text-ink-muted hover:bg-black/5" onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <ShoppingCart size={44} strokeWidth={1.5} className="mb-1 text-ink-muted" />
            <h3 className="text-base font-semibold text-ink">Your cart is empty</h3>
            <p className="text-sm text-ink-muted">Add some amazing experiences!</p>
            <button
              className="mt-3 rounded-lg bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple-dark"
              onClick={onClose}
            >
              Browse Events
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-4">
                {items.map(item => (
                  <div className="flex gap-3" key={item._id}>
                    <img src={item.image} alt={item.name} className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{item.name}</div>
                      <div className="text-xs text-ink-muted">{item.categoryName}</div>
                      <div className="mt-1 text-sm font-bold text-brand-purple">&#8377;{item.price.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button className="text-ink-muted hover:text-red-500" onClick={() => onRemove(item._id)} aria-label="Remove item">
                        <Trash2 size={16} />
                      </button>
                      <div className="flex items-center gap-2 rounded-full border border-border px-1.5 py-0.5">
                        <button
                          className="flex h-6 w-6 items-center justify-center text-ink hover:text-brand-purple"
                          onClick={() => item.qty === 1 ? onRemove(item._id) : onUpdateQty(item._id, item.qty - 1)}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-4 text-center text-sm font-medium">{item.qty}</span>
                        <button
                          className="flex h-6 w-6 items-center justify-center text-ink hover:text-brand-purple"
                          onClick={() => onUpdateQty(item._id, item.qty + 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border p-5">
              <div className="mb-4 flex items-center justify-between text-base font-bold text-ink">
                <span>Total</span>
                <span>&#8377;{total.toLocaleString()}</span>
              </div>
              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-purple py-3 text-sm font-semibold text-white hover:bg-brand-purple-dark"
                onClick={handleCheckout}
              >
                {isLoggedIn ? <>Checkout via WhatsApp <Rocket size={15} /></> : 'Login to Checkout'}
              </button>
              <button
                className="mt-2 w-full py-2 text-sm font-medium text-ink-muted hover:text-red-500"
                onClick={onClear}
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
