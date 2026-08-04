import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp, Zap, Lock, Palette, Share2 } from 'lucide-react';
import type { AdminProduct, BookingAddonSnapshot } from '../types';
import { cn } from '../lib/utils';
import { BackButton } from './BackButton';
import { ShareDialog } from './shared/ShareDialog';
import { trackBookingStarted, trackWhatsappClick } from '../lib/analytics';
import { useLanguage } from '../hooks/useLanguage';
import { GlobalAddonsActivitiesModule } from './GlobalAddonsActivitiesModule';

interface Props {
  product: AdminProduct;
  onBack: () => void;
  onBook: (product: AdminProduct, method?: 'razorpay' | 'whatsapp', selectedAddOns?: BookingAddonSnapshot[]) => void;
}

const TERMS = [
  'Booking is confirmed only after advance payment and written confirmation from our team.',
  'Cancellations made 48+ hours before the event are eligible for a full refund.',
  'Cancellations within 24-48 hours will incur a 50% cancellation fee.',
  'No refund for cancellations made less than 24 hours before the event.',
  'The venue/location must be accessible at least 2 hours before the event start time for setup.',
  'Any damage to props or decor caused by guests will be charged separately.',
  'Add-ons must be confirmed at least 24 hours in advance.',
  'TheDecorParty reserves the right to substitute items of equal or greater value if specific items are unavailable.',
  'Prices are inclusive of setup and breakdown. GST applicable as per government norms.',
  'For outdoor events, we are not responsible for weather-related disruptions.',
];

const HOW_IT_WORKS = [
  { icon: '📋', title: 'Choose Your Package', desc: 'Browse and select the package that fits your celebration.' },
  { icon: '💬', title: 'Confirm via WhatsApp', desc: 'Chat with us to confirm date, time, venue and any customisations.' },
  { icon: '💳', title: 'Pay Advance', desc: 'Secure your booking with a small advance payment.' },
  { icon: '🎉', title: 'We Set It Up', desc: 'Our team arrives on time and creates the perfect experience for you.' },
];

const WA_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

const badgeColorClass: Record<string, string> = {
  purple: 'bg-brand-purple text-white',
  gold: 'bg-brand-gold text-white',
  green: 'bg-emerald-500 text-white',
  red: 'bg-red-500 text-white',
};

const BookButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => (
  <button
    className={cn('rounded-lg bg-brand-purple px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-purple-dark', className)}
    onClick={onClick}
  >
    Book Now
  </button>
);

const WhatsAppButton: React.FC<{ onClick?: () => void; href?: string; className?: string }> = ({ onClick, href, className }) => {
  const classes = cn(
    'flex items-center justify-center gap-2 rounded-lg border-2 border-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50',
    className
  );
  if (href) {
    return (
      <a className={classes} href={href} target="_blank" rel="noreferrer">
        {WA_SVG} Add via WhatsApp
      </a>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick}>
      {WA_SVG} Book via WhatsApp
    </button>
  );
};

export const ProductDetailPage: React.FC<Props> = ({ product, onBack, onBook }) => {
  const { t } = useLanguage();
  const allImages = [product.image, ...(product.moreImages || [])];
  const [activeIdx, setActiveIdx] = useState(0);
  const [termsOpen, setTermsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [globalSelections, setGlobalSelections] = useState<{ addons: BookingAddonSnapshot[]; activities: BookingAddonSnapshot[] }>({ addons: [], activities: [] });
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveIdx(0);
  }, [product._id]);

  const goTo = (idx: number) => setActiveIdx(Math.max(0, Math.min(allImages.length - 1, idx)));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? goTo(activeIdx + 1) : goTo(activeIdx - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const location = useLocation();
  const showDebugAddons = new URLSearchParams(location.search).get('debugAddons') === '1';

  const selectedGlobalAddons = globalSelections.addons.map((item) => ({ ...item, qty: 1, kind: 'addon' as const }));
  const selectedGlobalActivities = globalSelections.activities.map((item) => ({ ...item, qty: 1, kind: 'activity' as const }));
  const bookingSelections = [...selectedGlobalAddons, ...selectedGlobalActivities];
  const totalPrice = product.price + selectedGlobalAddons.reduce((sum, addon) => sum + (addon.price || 0), 0) + selectedGlobalActivities.reduce((sum, activity) => sum + (activity.price || 0), 0);

  const handleGlobalSelectionChange = useCallback((addons: BookingAddonSnapshot[], activities: BookingAddonSnapshot[]) => {
    setGlobalSelections({
      addons: addons.map((item) => ({ ...item, qty: 1 })),
      activities: activities.map((item) => ({ ...item, qty: 1 })),
    });
  }, []);



  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 md:px-6">

      {/* Breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        <BackButton onClick={onBack} className="text-ink hover:text-brand-purple">{t.back || 'Back'}</BackButton>
        <span>/</span>
        <span>{product.categoryName}</span>
        {product.subcategory && (
          <>
            <span>/</span>
            <span>{product.subcategory}</span>
          </>
        )}
        <span>/</span>
        <span className="font-medium text-ink">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* Image gallery with swipe */}
        <div>
          <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-gray-100"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img src={allImages[activeIdx]} alt={product.name} className="h-full w-full object-cover" />
            {product.badge && (
              <span className={cn('absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold', badgeColorClass[product.badgeColor || 'purple'])}>
                {product.badge}
              </span>
            )}
            {allImages.length > 1 && (
              <>
                <button
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow disabled:opacity-30"
                  onClick={() => goTo(activeIdx - 1)}
                  disabled={activeIdx === 0}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow disabled:opacity-30"
                  onClick={() => goTo(activeIdx + 1)}
                  disabled={activeIdx === allImages.length - 1}
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {allImages.map((_, i) => (
                    <span
                      key={i}
                      className={cn('h-1.5 w-1.5 cursor-pointer rounded-full', i === activeIdx ? 'bg-white' : 'bg-white/50')}
                      onClick={() => goTo(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {allImages.map((img, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2',
                    i === activeIdx ? 'border-brand-purple' : 'border-transparent'
                  )}
                  onClick={() => goTo(i)}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="text-sm font-medium text-brand-purple">
            {product.categoryName}{product.subcategory ? ` · ${product.subcategory}` : ''}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-ink md:text-3xl">{product.name}</h1>

          <div className="mt-2 text-sm text-ink-muted">
            {product.categoryName}{product.subcategory ? ` · ${product.subcategory}` : ''}
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-ink">Rs.{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <>
                <span className="text-base text-ink-muted line-through">Rs.{product.originalPrice.toLocaleString()}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% off
                </span>
              </>
            )}
          </div>

          {product.description && <p className="mt-4 text-sm leading-relaxed text-ink-muted">{product.description}</p>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <BookButton onClick={() => {
              trackBookingStarted();
              onBook(product, 'razorpay', bookingSelections);
            }} className="flex-1" />
            <WhatsAppButton onClick={() => {
              trackWhatsappClick();

              setTimeout(() => {
                onBook(product, "whatsapp", bookingSelections);
              }, 500);
            }} className="flex-1" />
            <button
              type="button"
              onClick={async () => {
                const shareUrl = `${window.location.origin}/share/product/${product._id}`;
                if (navigator.share) {
                  try {
                    await navigator.share({ url: shareUrl });
                    return;
                  } catch (error) {
                    // If native share is cancelled or unavailable, fallback to dialog
                  }
                }
                setShareOpen(true);
              }}
              className="flex-1 rounded-lg border border-border bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gray-100"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Share2 size={16} /> Share
              </span>
            </button>
          </div>

          <div className="mt-4 rounded-card border border-border bg-gray-50 p-4">
            <div className="mb-2 flex items-center justify-between text-sm text-ink-muted">
              <span>Base package</span>
              <span>Rs.{product.price.toLocaleString()}</span>
            </div>
            {(globalSelections.addons.length > 0 || globalSelections.activities.length > 0) && (
              <div className="space-y-2 border-t border-border pt-3 text-sm text-ink">
                {globalSelections.addons.map((addon) => (
                  <div key={addon.id || addon.name} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-ink">{addon.name}</div>
                      <div className="text-xs text-ink-muted">Shared add-on</div>
                    </div>
                    <div className="text-right text-sm font-semibold text-ink">
                      Rs.{(addon.price || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
                {globalSelections.activities.map((activity) => (
                  <div key={activity.id || activity.name} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-ink">{activity.name}</div>
                      <div className="text-xs text-ink-muted">Shared activity</div>
                    </div>
                    <div className="text-right text-sm font-semibold text-ink">
                      Rs.{(activity.price || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-base font-bold text-ink">
              <span>Total</span>
              <span>Rs.{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1"><Zap size={13} /> Same Day Setup</span>
            <span className="flex items-center gap-1"><Lock size={13} /> Secure Booking</span>
            <span className="flex items-center gap-1"><Palette size={13} /> Fully Customisable</span>
          </div>
        </div>
      </div>
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={product.name}
        text={product.description || 'Check out this package'}
        url={`${window.location.origin}/product/${product._id}`}
      />

      <div className="mt-10 flex flex-col gap-8">

        {product.inclusions?.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl">✅</span>
              <h2 className="text-lg font-bold text-ink">{t.whats_included || "What's Included"}</h2>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {product.inclusions.map((inc, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink">
                  <Check size={15} className="flex-shrink-0 text-emerald-600" />
                  <span>{inc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <GlobalAddonsActivitiesModule onSelectionChange={handleGlobalSelectionChange} />

        {/* Debug panel (enable by appending ?debugAddons=1 to URL) */}
        {showDebugAddons && (
          <div className="mt-4 rounded-card border border-yellow-200 bg-yellow-50 p-3 text-sm text-ink">
            <div className="font-semibold">Debug: shared add-ons payload</div>
            <div className="mt-1 text-xs text-ink-muted">selected global add-ons: {globalSelections.addons.length}</div>
            <div className="text-xs text-ink-muted">selected global activities: {globalSelections.activities.length}</div>
            <pre className="mt-2 max-h-40 overflow-auto text-xs">{JSON.stringify(globalSelections, null, 2)}</pre>
          </div>
        )}


        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <h2 className="text-lg font-bold text-ink">{t.how_it_works || 'How It Works'}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative rounded-card border border-border bg-white p-4 text-center">
                <div className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-purple text-xs font-bold text-white">
                  {i + 1}
                </div>
                <div className="mb-2 mt-4 text-3xl">{step.icon}</div>
                <div className="text-sm font-semibold text-ink">{step.title}</div>
                <div className="mt-1 text-xs text-ink-muted">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div
            className="flex cursor-pointer items-center gap-2 border-b border-border pb-3"
            onClick={() => setTermsOpen(o => !o)}
          >
            <span className="text-xl">📋</span>
            <h2 className="flex-1 text-lg font-bold text-ink">Terms &amp; Conditions</h2>
            {termsOpen ? <ChevronUp size={18} className="text-ink-muted" /> : <ChevronDown size={18} className="text-ink-muted" />}
          </div>
          {termsOpen && (
            <ol className="mt-3 flex flex-col gap-2 pl-5 text-sm text-ink-muted marker:text-brand-purple marker:font-semibold">
              {TERMS.map((t, i) => <li key={i} className="list-decimal pl-1">{t}</li>)}
            </ol>
          )}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 rounded-card bg-brand-purple/5 p-6 sm:flex-row sm:items-center">
          <div>
            <div className="text-base font-bold text-ink">
              Ready to book <span className="text-brand-purple">{product.name}</span>?
            </div>
            <div className="mt-1 text-sm text-ink-muted">Chat with us on WhatsApp to confirm your date and customise your experience.</div>
          </div>
          <div className="flex w-full flex-shrink-0 gap-3 sm:w-auto">
            <BookButton onClick={() => onBook(product, 'razorpay', bookingSelections)} className="flex-1 sm:flex-none" />
            <WhatsAppButton onClick={() => onBook(product, 'whatsapp', bookingSelections)} className="flex-1 sm:flex-none" />
          </div>
        </div>

      </div>
    </div>
  );
};
