import ReactGA from "react-ga4";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (!MEASUREMENT_ID) return;

  ReactGA.initialize(MEASUREMENT_ID);
};

export const trackPageView = (path: string) => {
  ReactGA.send({
    hitType: "pageview",
    page: path,
  });
};

export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  ReactGA.event(eventName, params);
};

/* ---------- Ecommerce ---------- */

export const trackViewItem = (
  id: string,
  name: string,
  category: string,
  price: number
) => {
  ReactGA.event("view_item", {
    currency: "INR",
    value: price,
    items: [
      {
        item_id: id,
        item_name: name,
        item_category: category,
        price,
      },
    ],
  });
};

export const trackViewCategory = (category: string) => {
  ReactGA.event("view_item_list", {
    item_list_name: category,
  });
};

export const trackSearch = (term: string) => {
  ReactGA.event("search", {
    search_term: term,
  });
};

export const trackBeginCheckout = (
  id: string,
  name: string,
  price: number
) => {
  ReactGA.event("begin_checkout", {
    currency: "INR",
    value: price,
    items: [
      {
        item_id: id,
        item_name: name,
        price,
      },
    ],
  });
};

export const trackPurchase = (
  transactionId: string,
  amount: number
) => {
  ReactGA.event("purchase", {
    transaction_id: transactionId,
    currency: "INR",
    value: amount,
  });
};

/* ---------- Authentication ---------- */

export const trackLogin = (method = "email") => {
  ReactGA.event("login", {
    method,
  });
};

export const trackSignup = (method = "email") => {
  ReactGA.event("sign_up", {
    method,
  });
};


/* ---------- Custom Events ---------- */


export const trackBookingStarted = () => {
  ReactGA.event("booking_started");
};

export const trackPaymentFailed = () => {
  ReactGA.event("payment_failed");
};
export const trackWhatsappClick = () => {
  console.log("WhatsApp Event Fired");

  window.gtag?.("event", "whatsapp_click", {
    source: "booking_page",
  });
};
export const trackContactClick = () => {
  ReactGA.event("contact_us");
};

export const trackAssistantOpened = () => {
  ReactGA.event("assistant_opened");
};

export const trackAssistantQuestion = () => {
  ReactGA.event("assistant_question");
};
export const trackTestEvent = () => {
  console.log("Test Event Fired");

  ReactGA.event("test_event");
};

export default ReactGA;