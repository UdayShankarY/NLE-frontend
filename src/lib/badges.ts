export interface BadgeColorOption {
  value: string;
  label: string;
  badgeClass: string;
  adminBadgeClass: string;
}

export const BADGE_COLORS: BadgeColorOption[] = [
  {
    value: 'purple',
    label: 'Purple (Royal)',
    badgeClass: 'bg-purple-600 text-white shadow-xs',
    adminBadgeClass: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    value: 'pink',
    label: 'Pink (Trending)',
    badgeClass: 'bg-pink-600 text-white shadow-xs',
    adminBadgeClass: 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  },
  {
    value: 'gold',
    label: 'Gold (Premium)',
    badgeClass: 'bg-amber-500 text-slate-950 font-bold shadow-xs',
    adminBadgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    value: 'green',
    label: 'Green (New Launch)',
    badgeClass: 'bg-emerald-600 text-white shadow-xs',
    adminBadgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    value: 'rose',
    label: 'Rose (Hot Sale)',
    badgeClass: 'bg-rose-600 text-white shadow-xs',
    adminBadgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  {
    value: 'red',
    label: 'Red (Flash Deal)',
    badgeClass: 'bg-red-600 text-white shadow-xs',
    adminBadgeClass: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  {
    value: 'blue',
    label: 'Blue (Verified)',
    badgeClass: 'bg-sky-600 text-white shadow-xs',
    adminBadgeClass: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    value: 'indigo',
    label: 'Indigo (Popular)',
    badgeClass: 'bg-indigo-600 text-white shadow-xs',
    adminBadgeClass: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    value: 'dark',
    label: 'Black (Luxe Edition)',
    badgeClass: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 shadow-xs',
    adminBadgeClass: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300',
  },
];

const BADGE_MAP: Record<string, string> = BADGE_COLORS.reduce((acc, curr) => {
  acc[curr.value] = curr.badgeClass;
  return acc;
}, {} as Record<string, string>);

const ADMIN_BADGE_MAP: Record<string, string> = BADGE_COLORS.reduce((acc, curr) => {
  acc[curr.value] = curr.adminBadgeClass;
  return acc;
}, {} as Record<string, string>);

export function getBadgeColorClass(color?: string): string {
  if (!color) return BADGE_MAP.purple;
  const key = color.toLowerCase();
  return BADGE_MAP[key] || BADGE_MAP.purple;
}

export function getAdminBadgeColorClass(color?: string): string {
  if (!color) return ADMIN_BADGE_MAP.purple;
  const key = color.toLowerCase();
  return ADMIN_BADGE_MAP[key] || ADMIN_BADGE_MAP.purple;
}
