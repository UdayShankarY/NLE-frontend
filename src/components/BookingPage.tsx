import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { AdminProduct, BookingDetails } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { getApiUrl } from '../lib/api';
import { trackBeginCheckout, trackPaymentFailed, trackPurchase } from '../lib/analytics';

interface BookingPageProps {
  product: AdminProduct;
  preferredMethod?: 'razorpay' | 'whatsapp';
  onBack: () => void;
  onConfirm: (product: AdminProduct, details: BookingDetails, method: 'razorpay' | 'whatsapp') => void;
}

const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

if (!razorpayKey) {
  throw new Error("VITE_RAZORPAY_KEY_ID is missing");
}
// console.log("Frontend Key:", razorpayKey);
export const BookingPage: React.FC<BookingPageProps> = ({ product, preferredMethod = 'razorpay', onBack, onConfirm }) => {
  const [form, setForm] = useState<BookingDetails>({
    name: '',
    mobile: '',
    location: '',
    pincode: '',
    members: '1',
    eventDate: '',
    eventTime: '',
    requests: '',
    addOns: [],
  });
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'whatsapp'>(preferredMethod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPaymentMethod(preferredMethod);
  }, [product, preferredMethod]);

  const updateField = (field: keyof BookingDetails, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.name || !form.eventDate || !form.eventTime || !form.members || !form.mobile || !form.location || !form.pincode) {
      return false;
    }
    return true;
  };

  const openWhatsApp = () => {
    const message = [
      '*New Booking Request — TheDecorParty*',
      '',
      `*Package:* ${product.name}`,
      `*Category:* ${product.categoryName}${product.subcategory ? ` > ${product.subcategory}` : ''}`,
      `*Amount:* Rs.${product.price.toLocaleString()}`,
      '',
      `*Event Date:* ${form.eventDate}`,
      `*Event Time:* ${form.eventTime}`,
      `*Guests:* ${form.members}`,
      `*Name:* ${form.name}`,
      `*Contact:* +91 ${form.mobile}`,
      `*Location:* ${form.location} ${form.pincode}`,
      form.requests ? `*Special Requests:* ${form.requests}` : '',
      '',
      'Please confirm availability and payment details. Thank you!',
    ].filter(Boolean).join('\n');

    onConfirm(product, form, 'whatsapp');
    window.open(`https://wa.me/917022058460?text=${encodeURIComponent(message)}`, '_blank');
  };

 const startPayment = async () => {
  if (!(window as any).Razorpay) {
    setError('Payment gateway is unavailable.');
    return;
  }

  trackBeginCheckout(product._id, product.name, product.price);
  setLoading(true);
  setError('');

  try {
    const response = await fetch(getApiUrl('/api/payment/create-order'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: product.price }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || 'Unable to start payment.');
    }

    const order = await response.json();
    // console.log("Frontend Razorpay Key:", razorpayKey);
  console.log("Order:", order);
    const options = {
      key: razorpayKey,
      amount: order.amount,
      currency: order.currency,
      name: 'TheDecorParty',
      description: `Booking ${product.name}`,
      order_id: order.id,

      handler: () => {
        alert("Payment Successful");
        trackPurchase(`booking-${product._id}-${Date.now()}`, product.price);
        onConfirm(product, form, 'razorpay');
      },
    };

    const rz = new (window as any).Razorpay(options);
    rz.open();

  } catch (err: any) {
    trackPaymentFailed();
    setError(err?.message || 'Payment failed.');
  }

  setLoading(false);
};  

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      setError('Please fill all required booking fields.');
      return;
    }
    if (paymentMethod === 'razorpay') {
      await startPayment();
    } else {
      openWhatsApp();
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
      <div className="mb-6 flex items-start gap-4">
        <button
          type="button"
          className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
          onClick={onBack}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-brand-purple">Booking Details</div>
          <h1 className="mt-1 text-xl font-extrabold text-ink md:text-2xl">Book {product.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">Fill in your event details and choose WhatsApp to send a draft message with your booking request.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,340px]">
        <section>
          <div className="rounded-card border border-border bg-white p-5 md:p-6">
            <h2 className="mb-4 text-base font-bold text-ink">Tell us your event details</h2>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Booker Name"
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  required
                />
                <Input
                  label="Event Date"
                  id="eventDate"
                  type="date"
                  value={form.eventDate}
                  onChange={e => updateField('eventDate', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Event Time"
                  id="eventTime"
                  type="time"
                  value={form.eventTime}
                  onChange={e => updateField('eventTime', e.target.value)}
                  required
                />
                <Input
                  label="Event Capacity"
                  id="members"
                  type="number"
                  min="1"
                  value={form.members}
                  onChange={e => updateField('members', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Phone Number"
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  placeholder="10 digit mobile"
                  value={form.mobile}
                  onChange={e => updateField('mobile', e.target.value)}
                  required
                />
                <Input
                  label="Pin Code"
                  id="pincode"
                  type="text"
                  value={form.pincode}
                  onChange={e => updateField('pincode', e.target.value)}
                  required
                />
              </div>

              <Input
                label="Event Location"
                id="location"
                type="text"
                value={form.location}
                onChange={e => updateField('location', e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="requests" className="text-sm font-medium text-ink">Special Requests</label>
                <textarea
                  id="requests"
                  value={form.requests}
                  onChange={e => updateField('requests', e.target.value)}
                  placeholder="Any notes for your event"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-light"
                />
              </div>

              <div className="rounded-lg border border-border bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-ink">Choose payment method</h3>
                <label className="flex items-center gap-2 py-1.5 text-sm text-ink">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="accent-brand-purple"
                  />
                  Pay with card / UPI
                </label>
                <label className="flex items-center gap-2 py-1.5 text-sm text-ink">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="whatsapp"
                    checked={paymentMethod === 'whatsapp'}
                    onChange={() => setPaymentMethod('whatsapp')}
                    className="accent-brand-purple"
                  />
                  Confirm via WhatsApp
                </label>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</div>
              )}

              <div className="flex flex-col gap-2">
                <Button type="submit" size="lg" loading={loading} disabled={loading}>
                  {paymentMethod === 'razorpay' ? 'Pay Now' : 'Confirm on WhatsApp'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPaymentMethod('whatsapp')}
                >
                  Send booking via WhatsApp instead
                </Button>
              </div>
            </form>
          </div>
        </section>

        <aside>
          <div className="rounded-card border border-border bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-ink">Order summary</h2>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink-muted">Package</span>
              <strong className="text-ink">{product.name}</strong>
            </div>
            <div className="flex items-center justify-between border-t border-border py-2 text-sm">
              <span className="text-ink-muted">Category</span>
              <span className="text-ink">{product.categoryName}</span>
            </div>
            {product.subcategory && (
              <div className="flex items-center justify-between border-t border-border py-2 text-sm">
                <span className="text-ink-muted">Subcategory</span>
                <span className="text-ink">{product.subcategory}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border py-2 text-sm">
              <span className="text-ink-muted">Price</span>
              <span className="text-ink">Rs.{product.price.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold text-ink">
              <span>Total</span>
              <strong>Rs.{product.price.toLocaleString()}</strong>
            </div>
            <div className="mt-4 rounded-lg bg-brand-purple/5 p-3 text-xs text-ink-muted">
              After payment, you will receive confirmation from our team with setup and delivery details.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
