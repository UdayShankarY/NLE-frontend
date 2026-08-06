import { trackApiError } from './analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export function getApiUrl(path: string) {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (import.meta.env.DEV) {
    return path;
  }

  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

export async function fetchWithTracking(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) {
      const urlStr = typeof input === 'string' ? input : input.toString();
      trackApiError(urlStr, res.status, res.statusText);
    }
    return res;
  } catch (err: any) {
    const urlStr = typeof input === 'string' ? input : input.toString();
    trackApiError(urlStr, 0, err?.message || 'Network error');
    throw err;
  }
}