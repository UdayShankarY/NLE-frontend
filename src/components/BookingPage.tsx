import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, Lock, Zap, Calendar, Clock, MapPin, User, Sparkles, X, CreditCard, ChevronRight } from 'lucide-react';
import { BackButton } from './BackButton';
import type { AdminProduct, BookingAddonSnapshot, BookingDetails } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { getApiUrl } from '../lib/api';
import { trackBeginCheckout, trackAddPaymentInfo, trackPaymentFailed, trackPurchase, trackWhatsappClick, type GAItem } from '../lib/analytics';
import AuthContext from "../context/AuthContext";
import { cn } from '../lib/utils';

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

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

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

const WA_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export const BookingPage: React.FC<BookingPageProps> = ({ product, preferredMethod = 'razorpay', selectedAddOns = [], onBack, onConfirm }) => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  
  if (!auth) {
    throw new Error("AuthContext not found");
  }
  
  const { user } = auth;
  const [form, setForm] = useState<BookingDetails>({
    name: '',
    email: '',
    mobile: '',
    location: '',
    eventDate: '',
    eventTime: '',
    requests: '',
    addOns: selectedAddOns,
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'whatsapp'>(preferredMethod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState>(null);

  // Minimum selectable date set to TOMORROW (past & today disabled)
  const minDateString = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Production Validations
  const nameTrimmed = form.name.trim();
  const isNameValid = nameTrimmed.length >= 3 && nameTrimmed.length <= 60 && !/^\d+$/.test(nameTrimmed);
  const nameError = touched.name && !isNameValid
    ? (nameTrimmed.length === 0 ? 'Full Name is required.' : 'Name must be 3-60 characters and contain text.')
    : undefined;

  const cleanPhone = form.mobile.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === 10;
  const phoneError = touched.mobile && !isPhoneValid
    ? 'Enter a valid 10-digit mobile number.'
    : undefined;

  const emailTrimmed = (form.email || '').trim();
  const isEmailValid = emailTrimmed.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const emailError = touched.email && !isEmailValid
    ? 'Enter a valid email address.'
    : undefined;

  const isDateValid = Boolean(form.eventDate && form.eventDate >= minDateString);
  const dateError = touched.eventDate && !isDateValid
    ? 'Please select a date starting from tomorrow onwards.'
    : undefined;

  const isTimeValid = Boolean(form.eventTime);
  const timeError = touched.eventTime && !isTimeValid
    ? 'Please select an event start time.'
    : undefined;

  const locationTrimmed = form.location.trim();
  const isLocationValid = locationTrimmed.length >= 10 && locationTrimmed.length <= 250;
  const locationError = touched.location && !isLocationValid
    ? (locationTrimmed.length === 0 ? 'Venue location address is required.' : 'Location address must be at least 10 characters long.')
    : undefined;

  const isFormValid = isNameValid && isPhoneValid && isEmailValid && isDateValid && isTimeValid && isLocationValid;

  const markAllTouched = () => {
    setTouched({
      name: true,
      mobile: true,
      email: true,
      eventDate: true,
      eventTime: true,
      location: true,
    });
  };
  
  const totalPrice = product.price + form.addOns.reduce((sum, addon) => sum + (addon.price || 0), 0);
  const bookingPayload = { ...form, mobile: cleanPhone, name: nameTrimmed, location: locationTrimmed, addOns: form.addOns };
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPaymentMethod(preferredMethod);
    setForm(prev => ({ ...prev, addOns: selectedAddOns }));
  }, [product, preferredMethod, selectedAddOns]);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user.name || "",
        email: user.email || "",
        mobile: prev.mobile || user.phone || "",
      }));
    }
  }, [user]);

  const removeAddon = (idOrName: string) => {
    setForm(prev => ({
      ...prev,
      addOns: prev.addOns.filter(a => (a.id || a.name) !== idOrName),
    }));
  };
  
  const createBookingOrder = async (paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled', paymentMeta?: { razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string; }) => {
    const token = getAuthToken();
    const payload = {
      userId: user?.id,
      customerId: user?.id,
      productId: product._id,
      productName: product.name,
      productImage: product.image,
      product: {
        id: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        categoryName: product.categoryName,
        subcategory: product.subcategory,
      },
      categoryName: product.categoryName,
      subcategory: product.subcategory,
      packagePrice: product.price,
      amount: totalPrice,
      paymentMethod,
      paymentStatus,
      customer: {
        name: user?.name || nameTrimmed,
        email: user?.email || emailTrimmed,
        phone: user?.phone || cleanPhone,
      },
      addons: form.addOns.filter((item) => item.kind !== 'activity'),
      activities: form.addOns.filter((item) => item.kind === 'activity'),
      bookingDetails: [{ ...bookingPayload }],
      razorpayOrderId: paymentMeta?.razorpayOrderId,
      razorpayPaymentId: paymentMeta?.razorpayPaymentId,
      razorpaySignature: paymentMeta?.razorpaySignature,
    };

    const response = await fetch(getApiUrl('/api/orders'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(responseBody?.error || 'Unable to save booking.');
    }
    
    return responseBody;
  };
  
  const updateField = (field: keyof BookingDetails, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const openWhatsApp = async () => {
    trackWhatsappClick('checkout_page', product._id, product.name);
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
      `*Name:* ${nameTrimmed}`,
      `*Contact:* +91 ${cleanPhone}`,
      `*Location:* ${locationTrimmed}`,
      form.requests ? `*Special Requests:* ${form.requests.trim()}` : '',
      '',
      'Please confirm availability and payment details. Thank you!',
    ].filter(Boolean).join('\n');
    
    try {
      await createBookingOrder('pending');
    } catch (err: any) {
      console.error('Failed to save WhatsApp booking:', err);
    }
    onConfirm(product, bookingPayload, 'whatsapp');
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
    
    const checkoutItems: GAItem[] = [
      {
        item_id: product._id,
        item_name: product.name,
        item_category: product.categoryName,
        item_subcategory: product.subcategory,
        price: product.price,
        quantity: 1,
      },
      ...form.addOns.map((addon) => ({
        item_id: `addon-${addon.name.toLowerCase().replace(/\s+/g, '_')}`,
        item_name: addon.name,
        price: addon.price,
        quantity: 1,
      })),
    ];

    trackBeginCheckout(checkoutItems, totalPrice);
    trackAddPaymentInfo('razorpay', checkoutItems, totalPrice);
    setLoading(true);
    setError('');
    setPaymentDialog(null);
    
    let paymentHandled = false;
    const savePaymentOutcome = async (status: 'paid' | 'failed' | 'cancelled', meta?: { razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string; }, dialog?: PaymentDialogState) => {
      if (paymentHandled) return null;
      paymentHandled = true;
      setLoading(false);
      
      try {
        const createdOrder = await createBookingOrder(status, meta);
        if (dialog) {
          setPaymentDialog(dialog);
        }
        return createdOrder;
      } catch (err: any) {
        console.error(`Failed to save ${status} booking:`, err);
        const errorMessage = err?.message || 'Unable to save booking.';
        setError(`Payment was verified, but the booking could not be saved. ${errorMessage}`);
        if (dialog) {
          setPaymentDialog(dialog);
        }
        return null;
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
            customerName: nameTrimmed,
            contact: cleanPhone,
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
        order_id: order.id,

        name: "TheDecorParty",
        description: `Booking ${product.name}`,
        image: "https://www.thedecorparty.com/final_logo.jpeg",

        prefill: {
          name: user?.name || nameTrimmed,
          email: user?.email || emailTrimmed || "",
          contact: cleanPhone,
        },

        notes: {
          productId: product._id,
          productName: product.name,
          customer: nameTrimmed,
          mobile: cleanPhone,
        },

        theme: {
          color: "#7C3AED",
        },

        retry: {
          enabled: true,
          max_count: 3,
        },

        modal: {
          ondismiss: async () => {
            await savePaymentOutcome("cancelled", undefined, {
              kind: "cancelled",
              title: "Payment Cancelled",
              message: "Your booking has not been completed.",
              details: "You can continue where you left off or try payment again anytime.",
            });
          },
        },
        handler: async (paymentResponse: any) => {
          setLoading(true);
          try {
            const token = getAuthToken();
            const verifyResponse = await fetch(getApiUrl('/api/payment/verify'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,

                orderPayload: {
                  userId: user?.id,
                  customerId: user?.id,
                  productId: product._id,
                  productName: product.name,
                  productImage: product.image,
                  product: {
                    id: product._id,
                    name: product.name,
                    image: product.image,
                    price: product.price,
                    categoryName: product.categoryName,
                    subcategory: product.subcategory,
                  },
                  customer: {
                    name: user?.name || nameTrimmed,
                    email: user?.email || emailTrimmed,
                    phone: user?.phone || cleanPhone,
                  },
                  categoryName: product.categoryName,
                  subcategory: product.subcategory,
                  packagePrice: product.price,
                  amount: totalPrice,

                  paymentMethod: "razorpay",
                  paymentStatus: "paid",

                  addons: form.addOns.filter(a => a.kind !== "activity"),
                  activities: form.addOns.filter(a => a.kind === "activity"),

                  bookingDetails: [
                    {
                      ...bookingPayload,
                      email: user?.email || emailTrimmed || "",
                      addOns: form.addOns,
                    },
                  ],
                },
              }),
            });

            const verifyBody = await verifyResponse.json().catch(() => null);

            if (!verifyResponse.ok) {
              throw new Error(verifyBody?.error || 'Payment verification failed.');
            }

            onConfirm(product, bookingPayload, 'razorpay');
            const purchasedItems: GAItem[] = [
              {
                item_id: product._id,
                item_name: product.name,
                item_category: product.categoryName,
                item_subcategory: product.subcategory,
                price: product.price,
                quantity: 1,
              },
              ...form.addOns.map((addon) => ({
                item_id: `addon-${addon.name.toLowerCase().replace(/\s+/g, '_')}`,
                item_name: addon.name,
                price: addon.price,
                quantity: 1,
              })),
            ];
            trackPurchase(paymentResponse.razorpay_payment_id || `order-${Date.now()}`, totalPrice, purchasedItems);

            const createdOrder = verifyBody?.order || verifyBody;
            const orderId = createdOrder?._id || createdOrder?.id || createdOrder?.orderId;
            
            toast.success("Payment successful! Your booking is confirmed.");

            if (orderId && typeof orderId === 'string' && orderId.length > 5) {
              navigate(`/orders/${orderId}`, { replace: true });
            } else if (product?._id) {
              navigate(`/product/${product._id}`, { replace: true });
            } else {
              navigate('/profile', { replace: true });
            }
          } catch (err: any) {
            trackPaymentFailed(err?.message || 'Payment verification failed', product._id, totalPrice);
            console.error('Failed to save paid booking:', err);
            setError(err?.message || 'Payment verification failed.');
            setLoading(false);
          }
        },
      };

      const rz = new (window as any).Razorpay(options);
      rz.on('payment.failed', async (response: any) => {
        const reason = response?.error?.description || response?.error?.reason || 'Your payment could not be completed.';
        trackPaymentFailed(reason, product._id, totalPrice);
        await savePaymentOutcome('failed', undefined, {
          kind: 'failed',
          title: 'Payment Failed',
          message: "We couldn't complete your payment.",
          details: reason,
        });
      });
      rz.on('modal.ondismiss', async () => {
        await savePaymentOutcome('cancelled', undefined, {
          kind: 'cancelled',
          title: 'Payment Cancelled',
          message: 'Your booking has not been completed.',
          details: 'You can continue where you left off or try payment again anytime.',
        });
      });
      rz.open();
    } catch (err: any) {
      trackPaymentFailed();
      setError(
        typeof err === "string"
          ? err
          : err?.message || err?.error?.description || "Payment failed."
      );
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    markAllTouched();

    const missingFields: string[] = [];
    if (!isNameValid) missingFields.push('Full Name');
    if (!isPhoneValid) missingFields.push('10-Digit Mobile Number');
    if (!isEmailValid) missingFields.push('Valid Email Address');
    if (!isDateValid) missingFields.push('Event Date');
    if (!isTimeValid) missingFields.push('Event Start Time');
    if (!isLocationValid) missingFields.push('Venue Location Address');

    if (missingFields.length > 0) {
      const errorMsg = `Please fill in the required field(s): ${missingFields.join(', ')}.`;
      setError(errorMsg);

      setTimeout(() => {
        const firstInvalid = document.querySelector('[aria-invalid="true"]') || document.querySelector('.border-red-500');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (firstInvalid as HTMLElement).focus?.();
        }
      }, 100);

      return;
    }

    setError('');
    if (paymentMethod === 'razorpay') {
      await startPayment();
    } else {
      openWhatsApp();
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 animate-fadeIn pb-24 sm:pb-12">

      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-slate-400">
          <BackButton onClick={onBack} className="hover:text-brand-purple dark:hover:text-purple-300">
            Back to Package
          </BackButton>
          <span>/</span>
          <span className="font-bold text-gray-900 dark:text-white">Checkout</span>
        </div>

        {/* 3-STEP PROGRESS INDICATOR */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4 shadow-xs">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">

            {/* Step 1: Details */}
            <div className="flex items-center gap-2.5 z-10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple text-white text-xs font-bold shadow-md ring-4 ring-purple-100 dark:ring-purple-950/50">
                1
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">Booking Details</span>
            </div>

            {/* Connecting line */}
            <div className="absolute left-[20%] right-[20%] top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-slate-700" />

            {/* Step 2: Review */}
            <div className="flex items-center gap-2.5 z-10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 text-xs font-bold">
                2
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400 hidden min-[480px]:inline">Review</span>
            </div>

            {/* Step 3: Payment */}
            <div className="flex items-center gap-2.5 z-10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 text-xs font-bold">
                3
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400 hidden min-[480px]:inline">Payment</span>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">

        {/* LEFT COLUMN: FORM SECTIONS (8 COLS) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>

            {/* 1. PERSONAL DETAILS CARD */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-5 sm:p-6 shadow-xs">
              <div className="mb-4 flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-700/60 pb-3">
                <User size={18} className="text-brand-purple dark:text-purple-300" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">1. Personal Details</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  required
                  error={nameError}
                />
                
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="mobile" className="text-sm font-medium text-slate-900 dark:text-slate-200">
                    Phone Number <span className="text-red-600 dark:text-red-400 ml-0.5">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 pr-2">
                      +91
                    </span>
                    <input
                      id="mobile"
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      value={form.mobile}
                      onChange={e => updateField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onBlur={() => handleBlur('mobile')}
                      required
                      aria-invalid={!!phoneError || undefined}
                      className={cn(
                        "w-full h-10 rounded-lg border bg-white dark:bg-slate-900 pl-16 pr-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all",
                        phoneError
                          ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                          : "border-slate-200 dark:border-slate-700 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/40"
                      )}
                    />
                  </div>
                  {phoneError && <p className="text-xs text-red-600 dark:text-red-400 font-medium" role="alert">{phoneError}</p>}
                </div>
              </div>

              <div className="mt-4">
                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={form.email || ''}
                  onChange={e => updateField('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  error={emailError}
                />
              </div>
            </div>

            {/* 2. EVENT DETAILS CARD */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-5 sm:p-6 shadow-xs">
              <div className="mb-4 flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-700/60 pb-3">
                <Calendar size={18} className="text-brand-purple dark:text-purple-300" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">2. Event Setup Details</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Event Date"
                  id="eventDate"
                  type="date"
                  min={minDateString}
                  value={form.eventDate}
                  onChange={e => updateField('eventDate', e.target.value)}
                  onBlur={() => handleBlur('eventDate')}
                  required
                  error={dateError}
                  hint="Select a date starting from tomorrow onwards"
                />
                
                <Input
                  label="Event Start Time"
                  id="eventTime"
                  type="time"
                  value={form.eventTime}
                  onChange={e => updateField('eventTime', e.target.value)}
                  onBlur={() => handleBlur('eventTime')}
                  required
                  error={timeError}
                />
              </div>

              <div className="mt-4">
                <Input
                  label="Complete Venue Location / Address"
                  id="location"
                  type="text"
                  placeholder="Flat / House No, Street, Area, City"
                  value={form.location}
                  onChange={e => updateField('location', e.target.value)}
                  onBlur={() => handleBlur('location')}
                  required
                  error={locationError}
                />
              </div>
            </div>

            {/* 3. SELECTED ADD-ONS & ACTIVITIES CARD */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-5 sm:p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-700/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className="text-brand-purple dark:text-purple-300" />
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">3. Selected Add-ons &amp; Activities</h2>
                </div>
                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                  {form.addOns.length} item{form.addOns.length === 1 ? '' : 's'}
                </span>
              </div>

              {form.addOns.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-4 text-center text-xs font-medium text-gray-400 dark:text-slate-500">
                  No add-ons selected
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form.addOns.map((addon) => (
                    <div
                      key={addon.id || addon.name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/60 p-3 shadow-2xs transition-all hover:border-purple-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {(addon as any).image ? (
                          <img src={(addon as any).image} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple font-bold text-xs">
                            {addon.kind === 'activity' ? 'ACT' : 'ADD'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-gray-900 dark:text-white">{addon.name}</div>
                          <div className="text-[11px] font-semibold text-brand-purple dark:text-purple-300">
                            +₹{addon.price.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAddon(addon.id || addon.name)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-800 text-gray-400 hover:text-rose-500 hover:bg-rose-50 border border-gray-200 dark:border-slate-700 transition-all cursor-pointer"
                        title="Remove item"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. SPECIAL REQUESTS CARD */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-5 sm:p-6 shadow-xs">
              <label htmlFor="requests" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                4. Special Instructions or Requests (Optional)
              </label>
              <textarea
                id="requests"
                value={form.requests}
                onChange={e => updateField('requests', e.target.value)}
                placeholder="Mention any specific color preferences, entry timings, or venue access details..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/40 transition-all"
              />
            </div>

            {/* 5. PAYMENT METHOD SELECTION CARD */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">5. Select Payment Option</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Razorpay Option */}
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border-2 p-4 cursor-pointer transition-all",
                    paymentMethod === 'razorpay'
                      ? "border-brand-purple bg-brand-purple/5 dark:bg-purple-950/30 ring-2 ring-brand-purple/20"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-gray-300"
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 accent-brand-purple"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-extrabold text-sm text-gray-900 dark:text-white">
                      <CreditCard size={16} className="text-brand-purple" /> Pay via Razorpay
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      Instant &amp; secure payment using UPI, GPay, PhonePe, Cards, or Netbanking.
                    </p>
                  </div>
                </div>

                {/* WhatsApp Option */}
                <div
                  onClick={() => setPaymentMethod('whatsapp')}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border-2 p-4 cursor-pointer transition-all",
                    paymentMethod === 'whatsapp'
                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-600/20"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-gray-300"
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="whatsapp"
                    checked={paymentMethod === 'whatsapp'}
                    onChange={() => setPaymentMethod('whatsapp')}
                    className="mt-1 accent-emerald-600"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                      {WA_SVG} Confirm via WhatsApp
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      Send booking request directly to our decor team on WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Desktop Action Row */}
            <div className="hidden sm:flex flex-col gap-2 mt-2">
              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={!isFormValid || loading}
                className="w-full h-14 rounded-2xl text-base font-extrabold shadow-lg shadow-purple-600/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {paymentMethod === 'razorpay' ? 'Proceed to Payment' : 'Confirm via WhatsApp'}
              </Button>
              {!isFormValid && (
                <p className="text-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Please complete all required fields accurately to proceed.
                </p>
              )}
            </div>

          </form>
        </section>

        {/* RIGHT COLUMN: STICKY INVOICE ORDER SUMMARY (4/5 COLS) */}
        <aside className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-5 sm:p-6 shadow-lg flex flex-col gap-5">
            
            <div className="border-b border-gray-100 dark:border-slate-700/60 pb-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs text-brand-purple dark:text-purple-300">
                Booking Summary
              </h2>
            </div>

            {/* Product Card Row */}
            <div className="flex gap-3.5 items-center">
              <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-contain bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-1 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">{product.name}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <span className="font-semibold">{product.categoryName}</span>
                  {product.subcategory && <span>• {product.subcategory}</span>}
                </div>
              </div>
            </div>

            {/* Event Time & Date Badges */}
            {(form.eventDate || form.eventTime || locationTrimmed) && (
              <div className="rounded-xl border border-gray-100 dark:border-slate-700/80 bg-gray-50/60 dark:bg-slate-900/60 p-3 flex flex-col gap-2 text-xs text-gray-700 dark:text-slate-300">
                {form.eventDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-brand-purple" />
                    <span className="font-semibold">{form.eventDate}</span>
                  </div>
                )}
                {form.eventTime && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-brand-purple" />
                    <span className="font-semibold">{form.eventTime}</span>
                  </div>
                )}
                {locationTrimmed && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-brand-purple flex-shrink-0 mt-0.5" />
                    <span className="truncate">{locationTrimmed}</span>
                  </div>
                )}
              </div>
            )}

            {/* Itemized Price Breakdown */}
            <div className="flex flex-col gap-2.5 border-t border-gray-100 dark:border-slate-700/60 pt-4 text-xs">
              <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                <span>Base Package</span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{product.price.toLocaleString()}</span>
              </div>

              {form.addOns.map((addon) => (
                <div key={addon.id || addon.name} className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span className="truncate pr-2">{addon.name}</span>
                  <span className="font-semibold text-brand-purple dark:text-purple-300 flex-shrink-0">
                    +₹{addon.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold text-gray-400 dark:text-slate-500 block">Total Amount</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">₹{totalPrice.toLocaleString()}</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                Inclusive of Taxes
              </span>
            </div>

            {/* Primary Action Button for Desktop */}
            <button
              type="button"
              onClick={() => {
                const fakeEvent = { preventDefault: () => {} } as any;
                handleSubmit(fakeEvent);
              }}
              disabled={loading}
              className="w-full h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-purple hover:bg-brand-purple-dark text-white font-bold text-base shadow-lg shadow-purple-600/25 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {paymentMethod === 'razorpay' ? 'Proceed to Payment' : 'Confirm via WhatsApp'}
              <ChevronRight size={18} />
            </button>

            {/* Trust & Guarantee Badges */}
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex flex-col gap-2 text-[11px] font-semibold text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-2"><Lock size={14} className="text-emerald-500" /> 100% Secure Razorpay Payments</span>
              <span className="flex items-center gap-2"><Zap size={14} className="text-brand-purple" /> Instant Booking Confirmation</span>
              <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-pink-500" /> No Hidden Setup Charges</span>
            </div>

          </div>
        </aside>

      </div>

      {/* Payment Dialog Modal */}
      {paymentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl" role="dialog">
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white font-bold text-lg",
                paymentDialog.kind === 'success' ? 'bg-emerald-500' : paymentDialog.kind === 'cancelled' ? 'bg-amber-500' : 'bg-rose-500'
              )}>
                {paymentDialog.kind === 'success' ? '✓' : paymentDialog.kind === 'cancelled' ? '!' : '✕'}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{paymentDialog.title}</h3>
                <p className="mt-1 text-xs text-gray-600 dark:text-slate-300 leading-relaxed">{paymentDialog.message}</p>
                {paymentDialog.details && (
                  <p className="mt-2 text-xs font-semibold text-gray-700 dark:text-slate-200">{paymentDialog.details}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5 justify-end">
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

      {/* STICKY MOBILE BOTTOM BOOKING BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 shadow-2xl sm:hidden flex items-center justify-between gap-3 pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500">Grand Total</div>
          <div className="text-lg font-black text-gray-900 dark:text-white">₹{totalPrice.toLocaleString()}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            const fakeEvent = { preventDefault: () => {} } as any;
            handleSubmit(fakeEvent);
          }}
          disabled={loading}
          className="rounded-2xl bg-brand-purple hover:bg-brand-purple-dark text-white px-6 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/25 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {paymentMethod === 'razorpay' ? 'Proceed to Payment' : 'Confirm via WhatsApp'}
        </button>
      </div>

    </div>
  );
};
