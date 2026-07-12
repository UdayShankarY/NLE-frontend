import type { HeroSlide, CatIcon, Occasion, Product } from '../types';

export const HERO_SLIDES: HeroSlide[] = [
  {
    img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1400&q=85',
    chip: '🎊 Most Popular',
    headline: 'Birthday Decorations\nfor Every Style',
    sub: 'Balloon arches, backdrops & more — done in 2 hours',
    gradient: 'linear-gradient(to right, rgba(76,29,149,.75), rgba(76,29,149,.1))',
    cta: 'Explore Birthdays',
    ctaLink: '#',
  },
  {
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=85',
    chip: '🕯️ Trending Now',
    headline: 'Romantic Candlelight\nDinners in Bangalore',
    sub: 'Private setup at your home or venue — from ₹2,499',
    gradient: 'linear-gradient(to right, rgba(131,24,67,.75), rgba(131,24,67,.1))',
    cta: 'Book a Dinner',
    ctaLink: '#',
  },
  {
    img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1400&q=85',
    chip: '💍 Anniversary Special',
    headline: 'Surprise Your Partner\nWith a Dreamy Setup',
    sub: 'Rose petals, fairy lights, balloons — we handle everything',
    gradient: 'linear-gradient(to right, rgba(17,24,39,.75), rgba(17,24,39,.1))',
    cta: 'Plan Anniversary',
    ctaLink: '#',
  },
  {
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=85',
    chip: '🎁 New Arrivals',
    headline: 'Surprise Explosion\nBoxes & Hampers',
    sub: 'Personalised gifts delivered same day across Bangalore',
    gradient: 'linear-gradient(to right, rgba(6,78,59,.75), rgba(6,78,59,.1))',
    cta: 'Shop Gifts',
    ctaLink: '#',
  },
  {
    img: 'https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?w=1400&q=85',
    chip: '🌸 Festival Season',
    headline: 'Festive Decorations\nfor Every Occasion',
    sub: 'Diwali, Navratri, Christmas & more — book now',
    gradient: 'linear-gradient(to right, rgba(120,53,15,.75), rgba(120,53,15,.1))',
    cta: 'View Festivals',
    ctaLink: '#',
  },
];

export const CAT_ICONS: CatIcon[] = [
  { label: 'Birthday\nDecorations',   img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=100&q=70' },
  { label: 'Same Day\nDelivery',      img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=100&q=70' },
  { label: 'Personalised\nGifts',     img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&q=70' },
  { label: 'Kids Birthday\nDecors',   img: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=100&q=70' },
  { label: 'Corporate\nEvents',       img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&q=70' },
  { label: 'Baby Shower',             img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=100&q=70' },
  { label: 'Balloon\nGifts',          img: 'https://images.unsplash.com/photo-1567696153798-9111f9cd3d0d?w=100&q=70' },
  { label: 'Candlelight\nDinner',     img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&q=70' },
  { label: 'Anniversary\nDecoration', img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=100&q=70' },
  { label: 'Games &\nActivities',     img: 'https://images.unsplash.com/photo-1551966775-a4ddc8df052b?w=100&q=70' },
  { label: 'Proposal\nSetup',         img: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=100&q=70' },
  { label: 'Festival\nDecors',        img: 'https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?w=100&q=70' },
];

export const OCCASIONS: Occasion[] = [
  { e: '🎂', n: 'Birthday' },        { e: '💍', n: 'Anniversary' },
  { e: '💑', n: "Valentine's Day" }, { e: '👶', n: 'Baby Shower' },
  { e: '💍', n: 'Proposal' },        { e: '🎓', n: 'Graduation' },
  { e: '👪', n: 'Family Get-Together' }, { e: '🪔', n: 'Diwali' },
  { e: '🌹', n: 'Rose Day' },        { e: '🎆', n: 'New Year' },
  { e: '🎄', n: 'Christmas' },       { e: '🕌', n: 'Eid Celebration' },
  { e: '🌸', n: 'Navratri' },        { e: '👫', n: 'Karva Chauth' },
  { e: '🎊', n: 'Farewell' },        { e: '🏢', n: 'Corporate Event' },
];

export const MOST_BOOKED: Product[] = [
  { img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80', badge: 'Most Loved', bc: 'badge-purple', title: 'Balloon Arch Birthday Decor', price: '₹1,299', orig: '₹1,850', rating: '4.9', count: '2.3k' },
  { img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80', badge: 'Trending',   bc: 'badge-pink',   title: 'Rooftop Candlelight Dinner', price: '₹2,499', orig: '₹3,200', rating: '4.8', count: '1.8k' },
  { img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80', badge: 'New',        bc: 'badge-green',  title: 'Surprise Explosion Box',     price: '₹999',   orig: '₹1,400', rating: '4.9', count: '5.1k' },
  { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', badge: 'Bestseller', bc: 'badge-gold',   title: 'Luxury Gift Hamper',         price: '₹1,499', orig: '₹2,000', rating: '4.7', count: '1.2k' },
  { img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80', badge: 'Premium',   bc: 'badge-purple', title: 'Marry Me Proposal Setup',    price: '₹8,999', orig: '₹11,000', rating: '5.0', count: '421' },
  { img: 'https://images.unsplash.com/photo-1487530811015-780e0ba2b009?w=400&q=80', badge: 'Same Day',  bc: 'badge-green',  title: 'Fresh Flower Hamper',        price: '₹799',   orig: '₹1,100', rating: '4.8', count: '3.4k' },
];

export const BIRTHDAY: Product[] = [
  { img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80', badge: 'Popular',  bc: 'badge-purple', title: 'Simple Balloon Decoration',    price: '₹999',   orig: '₹1,400', rating: '4.8', count: '4.2k' },
  { img: 'https://images.unsplash.com/photo-1567696153798-9111f9cd3d0d?w=400&q=80', badge: 'New',      bc: 'badge-pink',   title: 'Pastel Balloon Arch Setup',    price: '₹1,499', orig: '₹2,000', rating: '4.9', count: '1.1k' },
  { img: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400&q=80', badge: 'Kids',     bc: 'badge-gold',   title: 'Theme Birthday Decoration',    price: '₹1,799', orig: '₹2,400', rating: '4.7', count: '876' },
  { img: 'https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?w=400&q=80', badge: 'Premium',  bc: 'badge-purple', title: 'Photo Wall Birthday Backdrop', price: '₹2,499', orig: '₹3,200', rating: '4.9', count: '634' },
  { img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80', badge: 'Trending', bc: 'badge-green',  title: 'LED Name Birthday Setup',      price: '₹3,499', orig: '₹4,500', rating: '4.8', count: '541' },
  { img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=80', badge: 'Surprise', bc: 'badge-pink',   title: 'Surprise Midnight Decoration', price: '₹1,999', orig: '₹2,600', rating: '4.9', count: '1.9k' },
];

export const ANNIVERSARY: Product[] = [
  { img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80', badge: 'Popular',  bc: 'badge-purple', title: 'Rose Petal Bedroom Decoration', price: '₹2,999', orig: '₹3,800', rating: '4.9', count: '1.5k' },
  { img: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=400&q=80', badge: 'Romantic', bc: 'badge-pink',   title: 'Candle & Balloon Anniversary',  price: '₹1,999', orig: '₹2,700', rating: '4.8', count: '2.1k' },
  { img: 'https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?w=400&q=80', badge: 'Premium',  bc: 'badge-gold',   title: 'Fairy Light Bedroom Setup',     price: '₹2,499', orig: '₹3,200', rating: '4.9', count: '987' },
  { img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80', badge: 'Surprise', bc: 'badge-purple', title: 'Marry Me Proposal Setup',       price: '₹8,999', orig: '₹11,000', rating: '5.0', count: '421' },
  { img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80', badge: 'Trending', bc: 'badge-green',  title: 'Rooftop Anniversary Dinner',    price: '₹3,499', orig: '₹4,500', rating: '4.8', count: '765' },
  { img: 'https://images.unsplash.com/photo-1487530811015-780e0ba2b009?w=400&q=80', badge: 'New',      bc: 'badge-pink',   title: 'Anniversary Gift Box',          price: '₹1,299', orig: '₹1,800', rating: '4.7', count: '563' },
];

export const DINNERS: Product[] = [
  { img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80', badge: 'Most Loved', bc: 'badge-purple', title: 'Private Rooftop Dinner',       price: '₹2,499', orig: '₹3,200', rating: '4.9', count: '1.8k' },
  { img: 'https://images.unsplash.com/photo-1564758563-83dcea87e075?w=400&q=80', badge: 'Trending',   bc: 'badge-pink',   title: 'In-Room Candlelight Dinner',   price: '₹1,999', orig: '₹2,600', rating: '4.8', count: '1.4k' },
  { img: 'https://images.unsplash.com/photo-1551966775-a4ddc8df052b?w=400&q=80', badge: 'Premium',    bc: 'badge-gold',   title: 'Poolside Dinner Setup',        price: '₹4,999', orig: '₹6,500', rating: '4.9', count: '543' },
  { img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80', badge: 'New',        bc: 'badge-green',  title: 'Garden Candlelight Dinner',    price: '₹2,999', orig: '₹3,800', rating: '4.7', count: '421' },
  { img: 'https://images.unsplash.com/photo-1567696153798-9111f9cd3d0d?w=400&q=80', badge: 'Luxury',    bc: 'badge-purple', title: '5-Star Hotel Dinner Package',  price: '₹6,999', orig: '₹9,000', rating: '4.9', count: '289' },
  { img: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400&q=80', badge: 'Budget',    bc: 'badge-pink',   title: 'Terrace Dinner Decor',         price: '₹1,499', orig: '₹2,000', rating: '4.6', count: '876' },
];

export const TRUST_ITEMS = [
  { icon: '⚡', label: 'trust1', sub: 'trust1s' },
  { icon: '🌟', label: 'trust2', sub: 'trust2s' },
  { icon: '🎨', label: 'trust3', sub: 'trust3s' },
  { icon: '🔒', label: 'trust4', sub: 'trust4s' },
  { icon: '🔄', label: 'trust5', sub: 'trust5s' },
] as const;

export const DESKTOP_CATS = [
  { key: 'cat_anniversary', arrow: true },
  { key: 'cat_birthdays',   arrow: true },
  { key: 'cat_gifts',       arrow: true },
  { key: 'cat_dinners',     arrow: true },
  { key: 'cat_decorations', arrow: true },
  { key: 'cat_festivals',   arrow: true },
  { key: 'cat_baby',        arrow: true },
  { key: 'cat_kids',        arrow: true },
  { key: 'cat_proposal',    arrow: true },
  { key: 'cat_corporate',   arrow: true },
  { key: 'cat_games',       arrow: true },
] as const;

export const MOBILE_CATS = [
  { key: 'cat_birthday',    icon: '🎂' },
  { key: 'cat_anniversary', icon: '💍' },
  { key: 'cat_gifts',       icon: '🎁' },
  { key: 'cat_dinners',     icon: '🕯️' },
  { key: 'cat_decorations', icon: '🎈' },
  { key: 'cat_festivals',   icon: '🪔' },
  { key: 'cat_baby',        icon: '👶' },
  { key: 'cat_kids',        icon: '🧒' },
  { key: 'cat_proposal',    icon: '💑' },
  { key: 'cat_corporate',   icon: '🏢' },
  { key: 'cat_games',       icon: '🎮' },
] as const;

export const FOOTER_LINKS = {
  experiences: [
    { key: 'cat_birthday' }, { key: 'cat_anniversary' }, { key: 'cat_dinners' },
    { key: 'cat_proposal' }, { key: 'cat_baby' }, { key: 'cat_kids' },
  ],
  gifts: [
    { key: 'gift_flowers' }, { key: 'gift_explosion' }, { key: 'gift_personal' },
    { key: 'gift_choc' }, { key: 'gift_photo' }, { key: 'gift_cards' },
  ],
  company: [
    { key: 'footer_about' }, { key: 'footer_blog' }, { key: 'footer_careers' },
    { key: 'footer_contact' }, { key: 'footer_partner' }, { key: 'footer_privacy' },
  ],
} as const;
