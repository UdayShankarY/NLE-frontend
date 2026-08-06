import ReactGA from "react-ga4";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export interface GAItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_subcategory?: string;
  price?: number;
  quantity?: number;
  item_variant?: string;
}

let isInitialized = false;

/**
 * Initialize GA4 with VITE_GA_MEASUREMENT_ID.
 * Safe to call multiple times (idempotent).
 */
export const initGA = () => {
  if (isInitialized) return;

  if (!MEASUREMENT_ID) {
    if (import.meta.env.DEV) {
      console.warn("[GA4] VITE_GA_MEASUREMENT_ID is missing. Analytics events will log to console in dev mode.");
    }
    return;
  }

  ReactGA.initialize(MEASUREMENT_ID, {
    testMode: import.meta.env.DEV,
  });

  isInitialized = true;

  if (import.meta.env.DEV) {
    console.log(`[GA4] Initialized with Measurement ID: ${MEASUREMENT_ID}`);
  }
};

/**
 * Set user identity for cross-session GA4 reporting.
 */
export const setGAUser = (userId: string | null, properties?: Record<string, any>) => {
  if (!MEASUREMENT_ID && !import.meta.env.DEV) return;

  if (userId) {
    ReactGA.set({ user_id: userId });
  }

  if (properties) {
    ReactGA.set(properties);
  }
};

/**
 * Send page view hit.
 */
export const trackPageView = (path: string, title?: string) => {
  if (import.meta.env.DEV) {
    console.log(`[GA4] Pageview: ${path}${title ? ` (${title})` : ''}`);
  }

  ReactGA.send({
    hitType: "pageview",
    page: path,
    title: title || document.title,
  });
};

/**
 * Generic event tracker.
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (import.meta.env.DEV) {
    console.log(`[GA4 Event] ${eventName}:`, params);
  }

  ReactGA.event(eventName, params);
};

/* ─────────────────────────────────────────────────── */
/*  Standard GA4 Ecommerce Events                      */
/* ─────────────────────────────────────────────────── */

export const trackViewItem = (item: GAItem) => {
  trackEvent("view_item", {
    currency: "INR",
    value: item.price || 0,
    items: [item],
  });
};

export const trackViewItemList = (listName: string, items: GAItem[] = [], listId?: string) => {
  trackEvent("view_item_list", {
    item_list_id: listId || listName.toLowerCase().replace(/\s+/g, "_"),
    item_list_name: listName,
    items: items.map((it, idx) => ({ ...it, index: idx + 1 })),
  });
};

export const trackSelectItem = (item: GAItem, listName?: string, listId?: string) => {
  trackEvent("select_item", {
    item_list_id: listId || (listName ? listName.toLowerCase().replace(/\s+/g, "_") : undefined),
    item_list_name: listName,
    items: [item],
  });
};

export const trackSearch = (searchTerm: string, categoryFilter?: string, resultsCount?: number) => {
  trackEvent("search", {
    search_term: searchTerm,
    category_filter: categoryFilter || undefined,
    results_count: resultsCount,
  });
};

export const trackAddToCart = (item: GAItem, quantity = 1) => {
  trackEvent("add_to_cart", {
    currency: "INR",
    value: (item.price || 0) * quantity,
    items: [{ ...item, quantity }],
  });
};

export const trackRemoveFromCart = (item: GAItem, quantity = 1) => {
  trackEvent("remove_from_cart", {
    currency: "INR",
    value: (item.price || 0) * quantity,
    items: [{ ...item, quantity }],
  });
};

export const trackViewCart = (items: GAItem[], totalValue: number) => {
  trackEvent("view_cart", {
    currency: "INR",
    value: totalValue,
    items,
  });
};

export const trackBeginCheckout = (items: GAItem[], totalValue: number, coupon?: string) => {
  trackEvent("begin_checkout", {
    currency: "INR",
    value: totalValue,
    coupon: coupon || undefined,
    items,
  });
};

export const trackAddPaymentInfo = (paymentType: 'razorpay' | 'whatsapp', items: GAItem[], totalValue: number) => {
  trackEvent("add_payment_info", {
    currency: "INR",
    value: totalValue,
    payment_type: paymentType,
    items,
  });
};

export const trackPurchase = (
  transactionId: string,
  amount: number,
  items: GAItem[],
  tax = 0,
  shipping = 0
) => {
  trackEvent("purchase", {
    transaction_id: transactionId,
    currency: "INR",
    value: amount,
    tax,
    shipping,
    items,
  });
};

/* ─────────────────────────────────────────────────── */
/*  Standard GA4 User & Engagement Events             */
/* ─────────────────────────────────────────────────── */

export const trackLogin = (method = "email", userId?: string) => {
  if (userId) setGAUser(userId);
  trackEvent("login", { method });
};

export const trackSignup = (method = "email", userId?: string) => {
  if (userId) setGAUser(userId);
  trackEvent("sign_up", { method });
};

export const trackShare = (method: string, contentType: string, itemId?: string) => {
  trackEvent("share", {
    method,
    content_type: contentType,
    item_id: itemId || undefined,
  });
};

/* ─────────────────────────────────────────────────── */
/*  Custom Domain Events                              */
/* ─────────────────────────────────────────────────── */

export const trackBookingStarted = (productId?: string, productName?: string, price?: number) => {
  trackEvent("booking_started", {
    product_id: productId,
    product_name: productName,
    value: price,
  });
};

export const trackPaymentFailed = (reason?: string, productId?: string, amount?: number) => {
  trackEvent("payment_failed", {
    reason: reason || "unknown",
    product_id: productId,
    value: amount,
  });
};

export const trackWhatsappClick = (source = "booking_page", productId?: string, productName?: string) => {
  trackEvent("whatsapp_click", {
    source,
    product_id: productId,
    product_name: productName,
  });
};

export const trackContactClick = (method = "phone", location = "footer") => {
  trackEvent("contact_us", {
    method,
    location,
  });
};

export const trackAssistantOpened = () => {
  trackEvent("assistant_opened");
};

export const trackAssistantQuestion = (query?: string) => {
  trackEvent("assistant_question", {
    query: query || undefined,
  });
};

export const trackAssistantRecommendationClick = (productId: string, productName: string) => {
  trackEvent("assistant_recommendation_click", {
    product_id: productId,
    product_name: productName,
  });
};

export const trackWishlistToggle = (action: 'add' | 'remove', productId: string, productName?: string) => {
  trackEvent("wishlist_toggle", {
    action,
    product_id: productId,
    product_name: productName,
  });
};

export const trackFilterApply = (filterType: string, filterValue: string) => {
  trackEvent("filter_apply", {
    filter_type: filterType,
    filter_value: filterValue,
  });
};

export const trackThemeChange = (theme: 'light' | 'dark') => {
  trackEvent("theme_change", {
    theme,
  });
};

export const trackAdminAction = (action: string, entity: string, entityId?: string) => {
  trackEvent("admin_action", {
    action,
    entity,
    entity_id: entityId,
  });
};

export const trackException = (description: string, fatal = false) => {
  trackEvent("exception", {
    description,
    fatal,
  });
};

export const trackApiError = (endpoint: string, statusCode: number, message: string) => {
  trackEvent("api_error", {
    endpoint,
    status_code: statusCode,
    error_message: message,
  });
};

export const trackTestEvent = () => {
  trackEvent("test_event", { timestamp: new Date().toISOString() });
};

export default ReactGA;