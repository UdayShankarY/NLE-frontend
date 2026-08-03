export interface HeroSlide {
  img: string;
  chip: string;
  headline: string;
  sub: string;
  gradient: string;
  cta: string;
  ctaLink: string;
}

export interface CatIcon {
  label: string;
  img: string;
}

export interface Occasion {
  e: string;
  n: string;
}

export interface Product {
  img: string;
  badge: string;
  bc: string;
  title: string;
  price: string;
  orig: string;
  rating: string;
  count: string;
}

export interface NavCategory {
  key: string;
  label: string;
}

export type LangCode = 'en' | 'kn' | 'te' | 'ta';

export interface Language {
  code: LangCode;
  label: string;
  short: string;
  flag: string;
}

export interface Translations {
  logo: string;
  tagline: string;
  search_placeholder: string;
  city: string;
  help: string;
  login: string;
  cart: string;
  login_signup: string;
  help_center: string;
  mob_cat_title: string;
  mob_acc_title: string;
  cat_anniversary: string;
  cat_birthdays: string;
  cat_gifts: string;
  cat_dinners: string;
  cat_decorations: string;
  cat_festivals: string;
  cat_baby: string;
  cat_kids: string;
  cat_proposal: string;
  cat_corporate: string;
  cat_games: string;
  cat_birthday: string;
  occasions_title: string;
  occasions_span: string;
  most_booked: string;
  birthday_title: string;
  birthday_span: string;
  anniversary_title: string;
  anniversary_span: string;
  dinner_title: string;
  dinner_span: string;
  view_all: string;
  book_now: string;
  at_location: string;
  trust1: string; trust1s: string;
  trust2: string; trust2s: string;
  trust3: string; trust3s: string;
  trust4: string; trust4s: string;
  trust5: string; trust5s: string;
  promo1_h: string; promo1_p: string;
  promo2_h: string; promo2_p: string;
  footer_copy: string;
  footer_exp_title: string;
  footer_gifts_title: string;
  footer_company_title: string;
  footer_copy_bottom: string;
  footer_legal_bottom: string;
  occ: string[];
  // hero
  hero0_chip: string; hero0_h: string; hero0_sub: string; hero0_cta: string;
  hero1_chip: string; hero1_h: string; hero1_sub: string; hero1_cta: string;
  hero2_chip: string; hero2_h: string; hero2_sub: string; hero2_cta: string;
  hero3_chip: string; hero3_h: string; hero3_sub: string; hero3_cta: string;
  hero4_chip: string; hero4_h: string; hero4_sub: string; hero4_cta: string;
  // category strip
  ci0: string; ci1: string; ci2: string; ci3: string; ci4: string; ci5: string;
  ci6: string; ci7: string; ci8: string; ci9: string; ci10: string; ci11: string;
  // product titles
  p_mb0: string; p_mb1: string; p_mb2: string; p_mb3: string; p_mb4: string; p_mb5: string;
  p_bd0: string; p_bd1: string; p_bd2: string; p_bd3: string; p_bd4: string; p_bd5: string;
  p_an0: string; p_an1: string; p_an2: string; p_an3: string; p_an4: string; p_an5: string;
  p_cd0: string; p_cd1: string; p_cd2: string; p_cd3: string; p_cd4: string; p_cd5: string;
  // footer links
  gift_flowers: string; gift_explosion: string; gift_personal: string;
  gift_choc: string; gift_photo: string; gift_cards: string;
  footer_about: string; footer_blog: string; footer_careers: string;
  footer_contact: string; footer_partner: string; footer_privacy: string;
  theme_label?: string;
  sign_out?: string;
  profile?: string;
  my_bookings?: string;
  light_mode?: string;
  dark_mode?: string;
  view_details?: string;
  categories_title?: string;
  back?: string;
  no_subcategories?: string;
  view_all_packages?: string;
  whats_included?: string;
  available_addons?: string;
  booking_details?: string;
  how_it_works?: string;
  ask_assistant?: string;
  ai_assistant?: string;
  language_preferences?: string;
}

export type TranslationsMap = Record<string, Translations>;

export interface AuthUser {
  id: string;
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  wishlist?: string[];
  role: 'user' | 'admin';  // Set in MongoDB — admin sees different UI
  phone?: string;
  photoURL?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  createdAt?: string;
}

export interface AdminAddon {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  active: boolean;
  category?: string;
  products?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogAddon {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  active?: boolean;
  category?: string;
}

export interface CatalogActivity {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price?: number;
  active?: boolean;
  category?: string;
}

export interface CatalogSelectionItem {
  id: string;
  name: string;
  price: number;
  kind: 'addon' | 'activity';
}

export type AuthTab = 'login' | 'register' | 'phone' | 'forgot' | 'success';

export interface BookingAddonSnapshot {
  id?: string;
  name: string;
  price: number;
  qty?: number;
  kind?: 'addon' | 'activity';
}

export interface BookingDetails {
  name: string;
  mobile: string;
  location: string;
  eventDate: string;
  eventTime: string;
  requests: string;
  addOns: BookingAddonSnapshot[];
}

export interface CartItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  categoryName: string;
  badge?: string;
  badgeColor: string;
  qty: number;
  bookingDetails: BookingDetails[];
}

// ── Admin Types ──────────────────────────────────────────

export interface Subcategory {
  name: string;
  image: string;
}

export interface AdminCategory {
  _id: string
  name: string
  icon: string
  image?: string
  slug: string
  active: boolean 
  productCount?: number
  subcategories?: (string | Subcategory)[]
}

export interface AdminProduct {
  _id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  subcategory: string;
  price: number;
  originalPrice?: number;
  description: string;
  inclusions: string[];
  addOns: { name: string; price: number }[];
  addons?: (string | AdminAddon)[];
  activities?: Array<string | { name?: string; description?: string; image?: string; active?: boolean }>;
  image: string;
  moreImages: string[];
  badge?: string;
  badgeColor: 'purple' | 'pink' | 'gold' | 'green';
  rating: number;
  reviewCount: number;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSlide {
  _id: string;
  image: string;
  chip: string;
  headline: string;
  subtext: string;
  gradient: string;
  ctaText: string;
  ctaLink: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productId: string;
  productTitle: string;
  categoryName: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  eventDate: string;
  eventAddress: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  lastLogin: string;
  active: boolean;
}

export type AdminView = 'dashboard' | 'categories' | 'products' | 'addons' | 'activities' | 'sliders' | 'orders' | 'users' | 'terms';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  totalUsers: number;
  pendingOrders: number;
  monthlyRevenue: number;
}
