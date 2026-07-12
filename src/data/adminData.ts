import type {
  AdminCategory, AdminProduct, AdminSlide, AdminOrder, AdminUser, DashboardStats
} from '../types';

// ── Categories ────────────────────────────────────────
export let ADMIN_CATEGORIES: AdminCategory[] = [
  { _id: 'cat_1', name: 'Birthday Decorations', icon: '🎂', slug: 'birthday', productCount: 12, active: true },
  { _id: 'cat_2', name: 'Anniversary Surprises', icon: '💍', slug: 'anniversary', productCount: 8, active: true },
  { _id: 'cat_3', name: 'Candlelight Dinners', icon: '🕯️', slug: 'dinners', productCount: 6, active: true },
  { _id: 'cat_4', name: 'Gifts & Hampers', icon: '🎁', slug: 'gifts', productCount: 15, active: true },
  { _id: 'cat_5', name: 'Proposal Setup', icon: '💑', slug: 'proposal', productCount: 4, active: true },
  { _id: 'cat_6', name: 'Baby Shower', icon: '👶', slug: 'baby', productCount: 5, active: true },
  { _id: 'cat_7', name: 'Corporate Events', icon: '🏢', slug: 'corporate', productCount: 7, active: false },
  { _id: 'cat_8', name: 'Festival Decors', icon: '🪔', slug: 'festivals', productCount: 9, active: true },
];

// ── Products ──────────────────────────────────────────
export let ADMIN_PRODUCTS: AdminProduct[] = [
  { _id: 'p1', name: 'Balloon Arch Birthday Decor', categoryId: 'cat_1', categoryName: 'Birthday Decorations', subcategory: '', price: 1299, originalPrice: 1850, description: 'Premium balloon arch setup with personalized decor at your location. 2-hour installation.', inclusions: [], addOns: [], image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80', moreImages: [], badge: 'Most Loved', badgeColor: 'purple', rating: 4.9, reviewCount: 2300, active: true, featured: true, createdAt: '2026-01-15', updatedAt: '2026-02-20' },
  { _id: 'p2', name: 'Rooftop Candlelight Dinner', categoryId: 'cat_3', categoryName: 'Candlelight Dinners', subcategory: '', price: 2499, originalPrice: 3200, description: 'Romantic rooftop dinner setup with candles, fairy lights, and floral decoration.', inclusions: [], addOns: [], image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80', moreImages: [], badge: 'Trending', badgeColor: 'pink', rating: 4.8, reviewCount: 1800, active: true, featured: true, createdAt: '2026-01-18', updatedAt: '2026-02-22' },
  { _id: 'p3', name: 'Surprise Explosion Box', categoryId: 'cat_4', categoryName: 'Gifts & Hampers', subcategory: '', price: 999, originalPrice: 1400, description: 'Customised explosion box with photos, messages, and chocolates.', inclusions: [], addOns: [], image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80', moreImages: [], badge: 'New', badgeColor: 'green', rating: 4.9, reviewCount: 5100, active: true, featured: false, createdAt: '2026-01-20', updatedAt: '2026-02-25' },
  { _id: 'p4', name: 'Luxury Gift Hamper', categoryId: 'cat_4', categoryName: 'Gifts & Hampers', subcategory: '', price: 1499, originalPrice: 2000, description: 'Luxury hamper with premium chocolates, scented candles, and personalised card.', inclusions: [], addOns: [], image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', moreImages: [], badge: 'Bestseller', badgeColor: 'gold', rating: 4.7, reviewCount: 1200, active: true, featured: false, createdAt: '2026-01-22', updatedAt: '2026-03-01' },
  { _id: 'p5', name: 'Marry Me Proposal Setup', categoryId: 'cat_5', categoryName: 'Proposal Setup', subcategory: '', price: 8999, originalPrice: 11000, description: 'Romantic proposal setup with rose petals, candles, balloons, and photographer.', inclusions: [], addOns: [], image: 'https://images.unsplash.com/photo-1464366400600-7168b9238cd48?w=400&q=80', moreImages: [], badge: 'Premium', badgeColor: 'purple', rating: 5.0, reviewCount: 421, active: true, featured: true, createdAt: '2026-01-25', updatedAt: '2026-03-02' },
  { _id: 'p6', name: 'Rose Petal Bedroom Setup', categoryId: 'cat_2', categoryName: 'Anniversary Surprises', subcategory: '', price: 2999, originalPrice: 3800, description: 'Bedroom decorated with rose petals, fairy lights, and personalised banners.', inclusions: [], addOns: [], image: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=400&q=80', moreImages: [], badge: 'Popular', badgeColor: 'purple', rating: 4.9, reviewCount: 1500, active: true, featured: false, createdAt: '2026-02-01', updatedAt: '2026-03-03' },
  { _id: 'p7', name: 'Baby Shower Decoration', categoryId: 'cat_6', categoryName: 'Baby Shower', subcategory: '', price: 2199, originalPrice: 2800, description: 'Full baby shower setup with balloon garlands, backdrop, and table decor.', inclusions: [], addOns: [], image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=80', moreImages: [], badge: 'Popular', badgeColor: 'pink', rating: 4.8, reviewCount: 890, active: false, featured: false, createdAt: '2026-02-05', updatedAt: '2026-03-04' },
  { _id: 'p8', name: 'Diwali Home Decoration', categoryId: 'cat_8', categoryName: 'Festival Decors', subcategory: '', price: 1799, originalPrice: 2200, description: 'Diwali home decoration with diyas, rangoli, and flower garlands.', inclusions: [], addOns: [], image: 'https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?w=400&q=80', moreImages: [], badge: 'Festive', badgeColor: 'gold', rating: 4.6, reviewCount: 760, active: true, featured: false, createdAt: '2026-02-08', updatedAt: '2026-03-05' },
];

// ── Hero Slides ───────────────────────────────────────
export let ADMIN_SLIDES: AdminSlide[] = [
  { _id: 'sl1', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1400&q=85', chip: '🎊 Most Popular', headline: 'Birthday Decorations\nfor Every Style', subtext: 'Balloon arches, backdrops & more — done in 2 hours', gradient: 'linear-gradient(to right, rgba(76,29,149,.75), rgba(76,29,149,.1))', ctaText: 'Explore Birthdays', ctaLink: '#birthday', order: 1, active: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { _id: 'sl2', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=85', chip: '🕯️ Trending Now', headline: 'Romantic Candlelight\nDinners in Bangalore', subtext: 'Private setup at your home or venue — from ₹2,499', gradient: 'linear-gradient(to right, rgba(131,24,67,.75), rgba(131,24,67,.1))', ctaText: 'Book a Dinner', ctaLink: '#dinners', order: 2, active: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { _id: 'sl3', image: 'https://images.unsplash.com/photo-1464366400600-7168b9238cd48?w=1400&q=85', chip: '💍 Anniversary Special', headline: 'Surprise Your Partner\nWith a Dreamy Setup', subtext: 'Rose petals, fairy lights, balloons — we handle everything', gradient: 'linear-gradient(to right, rgba(17,24,39,.75), rgba(17,24,39,.1))', ctaText: 'Plan Anniversary', ctaLink: '#anniversary', order: 3, active: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { _id: 'sl4', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=85', chip: '🎁 New Arrivals', headline: 'Surprise Explosion\nBoxes & Hampers', subtext: 'Personalised gifts delivered same day across Bangalore', gradient: 'linear-gradient(to right, rgba(6,78,59,.75), rgba(6,78,59,.1))', ctaText: 'Shop Gifts', ctaLink: '#gifts', order: 4, active: false, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { _id: 'sl5', image: 'https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?w=1400&q=85', chip: '🌸 Festival Season', headline: 'Festive Decorations\nfor Every Occasion', subtext: 'Diwali, Navratri, Christmas & more — book now', gradient: 'linear-gradient(to right, rgba(120,53,15,.75), rgba(120,53,15,.1))', ctaText: 'View Festivals', ctaLink: '#festivals', order: 5, active: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

// ── Orders ────────────────────────────────────────────
export let ADMIN_ORDERS: AdminOrder[] = [
  { id: 'ord1', orderNumber: 'NLE-2026-001', customerId: 'u1', customerName: 'Rahul Sharma', customerEmail: 'rahul@email.com', customerPhone: '9876543210', productId: 'p1', productTitle: 'Balloon Arch Birthday Decor', categoryName: 'Birthday Decorations', amount: 1299, status: 'completed', eventDate: '2026-02-14', eventAddress: 'Koramangala, Bangalore', notes: 'Pink and white theme', createdAt: '2026-02-10', updatedAt: '2026-02-14' },
  { id: 'ord2', orderNumber: 'NLE-2026-002', customerId: 'u2', customerName: 'Priya Nair', customerEmail: 'priya@email.com', customerPhone: '9876543211', productId: 'p2', productTitle: 'Rooftop Candlelight Dinner', categoryName: 'Candlelight Dinners', amount: 2499, status: 'confirmed', eventDate: '2026-03-08', eventAddress: 'Indiranagar, Bangalore', notes: 'Veg only please', createdAt: '2026-03-01', updatedAt: '2026-03-02' },
  { id: 'ord3', orderNumber: 'NLE-2026-003', customerId: 'u3', customerName: 'Arun Kumar', customerEmail: 'arun@email.com', customerPhone: '9876543212', productId: 'p5', productTitle: 'Marry Me Proposal Setup', categoryName: 'Proposal Setup', amount: 8999, status: 'in-progress', eventDate: '2026-03-10', eventAddress: 'HSR Layout, Bangalore', notes: 'Need photographer too', createdAt: '2026-03-03', updatedAt: '2026-03-05' },
  { id: 'ord4', orderNumber: 'NLE-2026-004', customerId: 'u4', customerName: 'Divya Menon', customerEmail: 'divya@email.com', customerPhone: '9876543213', productId: 'p3', productTitle: 'Surprise Explosion Box', categoryName: 'Gifts & Hampers', amount: 999, status: 'pending', eventDate: '2026-03-12', eventAddress: 'Whitefield, Bangalore', notes: '', createdAt: '2026-03-05', updatedAt: '2026-03-05' },
  { id: 'ord5', orderNumber: 'NLE-2026-005', customerId: 'u5', customerName: 'Suresh Pillai', customerEmail: 'suresh@email.com', customerPhone: '9876543214', productId: 'p6', productTitle: 'Rose Petal Bedroom Setup', categoryName: 'Anniversary Surprises', amount: 2999, status: 'cancelled', eventDate: '2026-03-07', eventAddress: 'Jayanagar, Bangalore', notes: 'Cancelled by customer', createdAt: '2026-03-01', updatedAt: '2026-03-04' },
  { id: 'ord6', orderNumber: 'NLE-2026-006', customerId: 'u1', customerName: 'Rahul Sharma', customerEmail: 'rahul@email.com', customerPhone: '9876543210', productId: 'p4', productTitle: 'Luxury Gift Hamper', categoryName: 'Gifts & Hampers', amount: 1499, status: 'completed', eventDate: '2026-02-28', eventAddress: 'Koramangala, Bangalore', notes: '', createdAt: '2026-02-25', updatedAt: '2026-02-28' },
];

// ── Users ─────────────────────────────────────────────
export let ADMIN_USERS: AdminUser[] = [
  { id: 'u1', firstName: 'Rahul', lastName: 'Sharma', email: 'rahul@email.com', phone: '9876543210', role: 'user', orderCount: 2, totalSpent: 2798, createdAt: '2026-01-15', lastLogin: '2026-03-05', active: true },
  { id: 'u2', firstName: 'Priya', lastName: 'Nair', email: 'priya@email.com', phone: '9876543211', role: 'user', orderCount: 1, totalSpent: 2499, createdAt: '2026-02-10', lastLogin: '2026-03-01', active: true },
  { id: 'u3', firstName: 'Arun', lastName: 'Kumar', email: 'arun@email.com', phone: '9876543212', role: 'user', orderCount: 1, totalSpent: 8999, createdAt: '2026-02-15', lastLogin: '2026-03-03', active: true },
  { id: 'u4', firstName: 'Divya', lastName: 'Menon', email: 'divya@email.com', phone: '9876543213', role: 'user', orderCount: 1, totalSpent: 999, createdAt: '2026-03-01', lastLogin: '2026-03-05', active: true },
  { id: 'u5', firstName: 'Suresh', lastName: 'Pillai', email: 'suresh@email.com', phone: '9876543214', role: 'user', orderCount: 1, totalSpent: 0, createdAt: '2026-02-20', lastLogin: '2026-03-01', active: true },
  { id: 'adm1', firstName: 'Admin', lastName: 'User', email: 'admin@nextlevelevents.com', phone: '9000000000', role: 'admin', orderCount: 0, totalSpent: 0, createdAt: '2026-01-01', lastLogin: '2026-03-07', active: true },
];

// ── Dashboard Stats ───────────────────────────────────
export function getDashboardStats(): DashboardStats {
  const completed = ADMIN_ORDERS.filter(o => o.status === 'completed');
  const pending = ADMIN_ORDERS.filter(o => o.status === 'pending');
  return {
    totalRevenue: completed.reduce((s, o) => s + o.amount, 0),
    totalOrders: ADMIN_ORDERS.length,
    activeProducts: ADMIN_PRODUCTS.filter(p => p.active).length,
    totalUsers: ADMIN_USERS.filter(u => u.role === 'user').length,
    pendingOrders: pending.length,
    monthlyRevenue: 284500,
  };
}

// ── CRUD helpers (simulate API calls) ────────────────

// Categories
export function addCategory(cat: Omit<AdminCategory, '_id' | 'productCount'>): AdminCategory {
  const newCat: AdminCategory = { ...cat, _id: `cat_${Date.now()}`, productCount: 0 };
  ADMIN_CATEGORIES = [...ADMIN_CATEGORIES, newCat];
  return newCat;
}
export function updateCategory(id: string, updates: Partial<AdminCategory>): void {
  ADMIN_CATEGORIES = ADMIN_CATEGORIES.map(c => c._id === id ? { ...c, ...updates } : c);
}
export function deleteCategory(id: string): void {
  ADMIN_CATEGORIES = ADMIN_CATEGORIES.filter(c => c._id !== id);
}

// Products
export function addProduct(p: Omit<AdminProduct, '_id' | 'createdAt' | 'updatedAt'>): AdminProduct {
  const now = new Date().toISOString().split('T')[0];
  const newP: AdminProduct = { ...p, _id: `p${Date.now()}`, createdAt: now, updatedAt: now };
  ADMIN_PRODUCTS = [...ADMIN_PRODUCTS, newP];
  return newP;
}
export function updateProduct(id: string, updates: Partial<AdminProduct>): void {
  ADMIN_PRODUCTS = ADMIN_PRODUCTS.map(p => p._id === id ? { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : p);
}
export function deleteProduct(id: string): void {
  ADMIN_PRODUCTS = ADMIN_PRODUCTS.filter(p => p._id !== id);
}

// Slides
export function addSlide(s: Omit<AdminSlide, '_id'>): AdminSlide {
  const newS: AdminSlide = { ...s, _id: `sl${Date.now()}` };
  ADMIN_SLIDES = [...ADMIN_SLIDES, newS];
  return newS;
}
export function updateSlide(id: string, updates: Partial<AdminSlide>): void {
  ADMIN_SLIDES = ADMIN_SLIDES.map(s => s._id === id ? { ...s, ...updates } : s);
}
export function deleteSlide(id: string): void {
  ADMIN_SLIDES = ADMIN_SLIDES.filter(s => s._id !== id);
}
export function reorderSlides(ids: string[]): void {
  ADMIN_SLIDES = ids.map((id, i) => {
    const slide = ADMIN_SLIDES.find(s => s._id === id)!;
    return { ...slide, order: i + 1 };
  });
}

// Orders
export function updateOrderStatus(id: string, status: AdminOrder['status']): void {
  ADMIN_ORDERS = ADMIN_ORDERS.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString().split('T')[0] } : o);
}

// Users
export function updateUserRole(id: string, role: 'user' | 'admin'): void {
  ADMIN_USERS = ADMIN_USERS.map(u => u.id === id ? { ...u, role } : u);
}
export function toggleUserActive(id: string): void {
  ADMIN_USERS = ADMIN_USERS.map(u => u.id === id ? { ...u, active: !u.active } : u);
}
