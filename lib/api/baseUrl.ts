/**
 * Backend API base URL for RTK Query.
 * Prefer NEXT_PUBLIC_BASE_URL (browser-safe in Next.js).
 *
 * Host-only values (no protocol) are treated as relative paths by fetch/RTK Query,
 * which produces broken URLs like:
 *   https://frontend.host/backend.host/api/...
 * Normalize those to absolute https URLs.
 */
export function getBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.REACT_APP_BASE_URL ||
    "http://127.0.0.1:8000";

  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "http://127.0.0.1:8000";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Strip accidental leading slashes so "host" is not path-relative.
  return `https://${trimmed.replace(/^\/+/, "")}`;
}
