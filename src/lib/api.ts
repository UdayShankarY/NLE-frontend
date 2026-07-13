const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
console.log("VITE_API_URL =", API_BASE_URL);
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
