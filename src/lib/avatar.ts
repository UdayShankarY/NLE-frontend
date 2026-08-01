import type { AuthUser } from '../types';

const avatarColors = ['bg-brand-purple', 'bg-pink-600', 'bg-emerald-600', 'bg-sky-600', 'bg-amber-600'] as const;

export function getAvatarColor(identifier: string) {
  const normalized = identifier?.trim().toLowerCase() || '';
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) >>> 0;
  }
  return avatarColors[hash % avatarColors.length];
}

export function getAvatarIdentifier(user: AuthUser | null | undefined) {
  return user?.id || user?.email || user?.name || '';
}

export function getAvatarInitial(user: AuthUser | null | undefined) {
  const value = user?.name || user?.firstName || user?.email || 'U';
  return value.trim().charAt(0).toUpperCase() || 'U';
}

export function getUserDisplayName(user: AuthUser | null | undefined) {
  return user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';
}
