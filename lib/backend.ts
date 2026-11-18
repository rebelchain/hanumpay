// Resolves API endpoints either to the standalone Oracle Cloud VPS backend
// (when NEXT_PUBLIC_BACKEND_URL is configured) or to same-origin Next.js /api/* routes.

const rawBase = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim().replace(/\/+$/, '');

export const BACKEND_BASE_URL = rawBase;
export const IS_EXTERNAL_BACKEND = Boolean(rawBase);

export function backendUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return rawBase ? `${rawBase}${normalizedPath}` : normalizedPath;
}
