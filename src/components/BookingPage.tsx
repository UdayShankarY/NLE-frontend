import React, { useEffect, useState } from 'react';
import { BackButton } from './BackButton';
import type { AdminProduct, BookingAddonSnapshot, BookingDetails } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { getApiUrl } from '../lib/api';
import { trackBeginCheckout, trackPaymentFailed, trackPurchase } from '../lib/analytics';

interface BookingPageProps {
  product: AdminProduct;
  preferredMethod?: 'razorpay' | 'whatsapp';
  selectedAddOns?: BookingAddonSnapshot[];
  onBack: () => void;
  onConfirm: (product: AdminProduct, details: BookingDetails, method: 'razorpay' | 'whatsapp') => void;
}

type PaymentDialogState = {
  kind: 'success' | 'cancelled' | 'failed';
  title: string;
  message: string;
  details?: string;
} | null;

const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

const loadRazorpayScript = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existingScript) {
    return new Promise<boolean>((resolve) => {
      existingScript.addEventListener('load', () => resolve(Boolean((window as any).Razorpay)), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
    });
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean((window as any).Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const BookingPage: React.FC<BookingPageProps> = ({ product, preferredMethod = 'razorpay', selectedAddOns = [], onBack, onConfirm }) => {
  const [form, setForm] = useState<BookingDetails>({
    name: '',
    mobile: '',
    location: '',
    eventDate: '',
    eventTime: '',
    requests: '',
    addOns: selectedAddOns,
  });
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'whatsapp'>(preferredMethod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState>(null);

  const totalPrice = product.price + form.addOns.reduce((sum, addon) => sum + (addon.price || 0), 0);
  const bookingPayload = { ...form, addOns: form.addOns };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPaymentMethod(preferredMethod);
    setForm(prev => ({ ...prev, addOns: selectedAddOns }));
  }, [product, preferredMethod, selectedAddOns]);

  const createBookingOrder = async (paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled', paymentMeta?: { razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string; }) => {
    const payload = {
      productId: product._id,
      productName: product.name,
      categoryName: product.categoryName,
      subcategory: product.subcategory,
      packagePrice: product.price,
      amount: totalPrice,
      paymentMethod,
      paymentStatus,
      bookingDetails: [{ ...form, addOns: form.addOns }],
      razorpayOrderId: paymentMeta?.razorpayOrderId,
      razorpayPaymentId: paymentMeta?.razorpayPaymentId,
      razorpaySignature: paymentMeta?.razorpaySignature,
    };

    const response = await fetch(getApiUrl('/api/orders'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || 'Unable to save booking.');
    }

    return await response.json();
  };

  const updateField = (field: keyof BookingDetails, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.name || !form.eventDate || !form.eventTime || !form.mobile || !form.location) {
      return false;
    }
    return true;
  };

  const openWhatsApp = async () => {
    const selectedSummary = form.addOns.length > 0
      ? ['*Selected Add-ons / Activities:*', ...form.addOns.map(addon => `- ${addon.name} (+Rs.${addon.price.toLocaleString()})`)]
      : [];
    const message = [
      '*New Booking Request — TheDecorParty*',
      '',
      `*Package:* ${product.name}`,
      `*Category:* ${product.categoryName}${product.subcategory ? ` > ${product.subcategory}` : ''}`,
      `*Amount:* Rs.${totalPrice.toLocaleString()}`,
      '',
      ...selectedSummary,
      '',
      `*Event Date:* ${form.eventDate}`,
      `*Event Time:* ${form.eventTime}`,
      `*Name:* ${form.name}`,
      `*Contact:* +91 ${form.mobile}`,
      `*Location:* ${form.location}`,
      form.requests ? `*Special Requests:* ${form.requests}` : '',
      '',
      'Please confirm availability and payment details. Thank you!',
    ].filter(Boolean).join('\n');

    const payload = { ...form, addOns: selectedAddOns };
    try {
      await createBookingOrder('pending');
    } catch (err: any) {
      console.error('Failed to save WhatsApp booking:', err);
    }
    onConfirm(product, payload, 'whatsapp');
    window.open(`https://wa.me/917022058460?text=${encodeURIComponent(message)}`, '_blank');
  };

  const startPayment = async () => {
    if (!razorpayKey) {
      setError('Razorpay public key is missing. Please configure VITE_RAZORPAY_KEY_ID.');
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !(window as any).Razorpay) {
      setError('Razorpay checkout could not be loaded. Please refresh the page and try again.');
      return;
    }

    trackBeginCheckout(product._id, product.name, product.price);
    setLoading(true);
    setError('');
    setPaymentDialog(null);

    let paymentHandled = false;
    const savePaymentOutcome = async (status: 'paid' | 'failed' | 'cancelled', meta?: { razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string; }, dialog?: PaymentDialogState) => {
      if (paymentHandled) return;
      paymentHandled = true;
      setLoading(false);

      try {
        await createBookingOrder(status, meta);
      } catch (err: any) {
        console.error(`Failed to save ${status} booking:`, err);
      }

      if (dialog) {
        setPaymentDialog(dialog);
      }
    };

    try {
      const response = await fetch(getApiUrl('/api/payment/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          receipt: `booking-${product._id}-${Date.now()}`,
          notes: {
            productId: product._id,
            productName: product.name,
            customerName: form.name,
            contact: form.mobile,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || 'Unable to start payment.');
      }

      const order = await response.json();
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'TheDecorParty',
        description: `Booking ${product.name}`,
        order_id: order.id,
        prefill: {
          name: form.name,
          contact: form.mobile,
        },
        notes: {
          productId: product._id,
          productName: product.name,
        },
        handler: async (paymentResponse: any) => {
          console.log('SUCCESS HANDLER', paymentResponse);
          try {
            const verifyResponse = await fetch(getApiUrl('/api/payment/verify'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              const verifyError = await verifyResponse.json().catch(() => null);
              console.log('VERIFY FAILED', verifyResponse.status, verifyError);
              throw new Error(verifyError?.error || 'Payment verification failed.');
            }

            await savePaymentOutcome('paid', {
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            }, {
              kind: 'success',
              title: 'Payment Successful',
              message: 'Your booking has been saved.',
              details: 'We will confirm your booking details shortly.',
            });
            onConfirm(product, bookingPayload, 'razorpay');
            trackPurchase(`booking-${product._id}-${Date.now()}`, totalPrice);
          } catch (err: any) {
            trackPaymentFailed();
            console.error('Failed to save paid booking:', err);
            await savePaymentOutcome('failed', undefined, {
              kind: 'failed',
              title: 'Payment Failed',
              message: "We couldn't complete your payment.",
              details: err?.message || 'Please try again or confirm your booking via WhatsApp.',
            });
          }
        },
      };

      const rz = new (window as any).Razorpay(options);
      rz.on('payment.failed', async (response: any) => {
        console.log('FAILED HANDLER', response);
        trackPaymentFailed();
        console.error('Razorpay payment failed:', response);
        const reason = response?.error?.description || response?.error?.reason || 'Your payment could not be completed.';
        await savePaymentOutcome('failed', undefined, {
          kind: 'failed',
          title: 'Payment Failed',
          message: "We couldn't complete your payment.",
          details: reason,
        });
      });
      rz.on('modal.ondismiss', async () => {
        console.log('DISMISS HANDLER');
        console.info('Razorpay modal dismissed by the user.');
        await savePaymentOutcome('cancelled', undefined, {
          kind: 'cancelled',
          title: 'Payment Cancelled',
          message: 'Your booking has not been completed.',
          details: 'You can continue where you left off or try payment again anytime.',
        });
      });
      rz.open();
    } catch (err: any) {
      console.log('CATCH BLOCK', err);
      trackPaymentFailed();
      console.error('Razorpay checkout failed:', err);
      setError(err?.message || 'Payment failed.');
      setLoading(false);
    }
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
        <BackButton
          type="button"
          className="mt-1"
          onClick={onBack}
        />
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

              {paymentDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
                  <div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${paymentDialog.kind === 'success' ? 'bg-green-100 text-green-700' : paymentDialog.kind === 'cancelled' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {paymentDialog.kind === 'success' ? '✓' : paymentDialog.kind === 'cancelled' ? '!' : '✕'}
                      </div>
                      <div className="flex-1">
                        <h3 id="payment-dialog-title" className="text-base font-semibold text-ink">{paymentDialog.title}</h3>
                        <p className="mt-1 text-sm text-ink-muted">{paymentDialog.message}</p>
                        {paymentDialog.details && (
                          <p className="mt-2 text-sm text-ink">{paymentDialog.details}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {paymentDialog.kind === 'success' ? (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => {
                            setPaymentDialog(null);
                            onConfirm(product, bookingPayload, 'razorpay');
                          }}
                        >
                          Continue to confirmation
                        </Button>
                      ) : paymentDialog.kind === 'cancelled' ? (
                        <>
                          <Button type="button" variant="primary" onClick={() => { setPaymentDialog(null); void startPayment(); }}>
                            Try Again
                          </Button>
                          <Button type="button" variant="secondary" onClick={() => setPaymentDialog(null)}>
                            Continue Editing
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button type="button" variant="primary" onClick={() => { setPaymentDialog(null); void startPayment(); }}>
                            Retry Payment
                          </Button>
                          <Button type="button" variant="secondary" onClick={() => setPaymentDialog(null)}>
                            Back to Booking
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
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
              <span className="text-ink-muted">Base Price</span>
              <span className="text-ink">Rs.{product.price.toLocaleString()}</span>
            </div>
            {selectedAddOns.length > 0 && (
              <div className="space-y-2 border-t border-border py-3 text-sm text-ink">
                {selectedAddOns.map((addon) => (
                  <div key={addon.id || addon.name} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-ink">{addon.name}</div>
                      <div className="text-xs text-ink-muted">{addon.kind === 'activity' ? 'Activity' : 'Add-on'}</div>
                    </div>
                    <div className="text-right text-sm font-semibold text-ink">
                      +Rs.{addon.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold text-ink">
              <span>Total</span>
              <strong>Rs.{totalPrice.toLocaleString()}</strong>
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
