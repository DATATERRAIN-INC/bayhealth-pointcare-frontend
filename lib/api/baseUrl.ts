/**
 * Backend API base URL for RTK Query.
 * Prefer NEXT_PUBLIC_BASE_URL (browser-safe in Next.js).
 */
export function getBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.REACT_APP_BASE_URL ||
    "http://127.0.0.1:8000";

  return raw.replace(/\/+$/, "");
}
