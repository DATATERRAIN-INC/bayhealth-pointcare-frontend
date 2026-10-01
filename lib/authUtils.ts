export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const REDIRECT_LOGOUT_KEY = "redirect_logout";
export const AUTH_PROVIDER_KEY = "auth_provider";
export const AZURE_SSO_KEY = "azure_sso";

const SSO_PROVIDER = "microsoft";

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

/** Decode a JWT payload. Does not verify the signature. */
export function jwtDecode(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const json = JSON.parse(atob(padded)) as unknown;
    if (!json || typeof json !== "object" || Array.isArray(json)) return null;
    return json as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  const token = readStorage(ACCESS_TOKEN_KEY);
  return token && token.trim() ? token : null;
}

export function getRefreshToken(): string | null {
  const token = readStorage(REFRESH_TOKEN_KEY);
  return token && token.trim() ? token : null;
}

/** Logged in means the access token key is present. The backend validates the JWT. */
export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function isSsoSession(): boolean {
  const provider = readStorage(AUTH_PROVIDER_KEY)?.trim().toLowerCase();
  const azure = readStorage(AZURE_SSO_KEY)?.trim().toLowerCase();
  return provider === SSO_PROVIDER || azure === "true" || azure === "1";
}

export function isRedirectingLogout(): boolean {
  return readStorage(REDIRECT_LOGOUT_KEY) === "true";
}

export function consumeRedirectLogout(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REDIRECT_LOGOUT_KEY);
}

export function getTokenEmail(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  const claims = jwtDecode(token);
  if (!claims) return null;
  for (const key of ["email", "cognito:username", "username", "preferred_username", "sub"]) {
    const value = claims[key];
    if (typeof value === "string" && value.includes("@")) return value;
  }
  return null;
}

/** True only when the token says the password still has to be changed, and this is not SSO. */
export function needsPasswordChange(): boolean {
  if (!isAuthenticated() || isSsoSession()) return false;
  const token = getAccessToken();
  if (!token) return false;
  const claims = jwtDecode(token);
  return claims?.is_pwd_changed === false;
}

export function tokenExpiresAt(token: string): Date | null {
  const claims = jwtDecode(token);
  const exp = claims?.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  return new Date(exp * 1000);
}

export function isAccessTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  const expires = tokenExpiresAt(token);
  if (!expires) return false;
  return expires.getTime() <= Date.now();
}

/** Mask email for display, e.g. r*****1@dataterrain.com */
export function maskEmail(email: string): string {
  try {
    const trimmed = (email || "").trim();
    if (!trimmed) return "your email";
    const at = trimmed.indexOf("@");
    if (at <= 0) return trimmed;

    const local = trimmed.slice(0, at);
    const domain = trimmed.slice(at);
    if (!local) return `*****${domain}`;
    if (local.length <= 2) {
      return `${local[0]}*****${domain}`;
    }
    return `${local[0]}${"*".repeat(Math.min(5, local.length - 2))}${local[local.length - 1]}${domain}`;
  } catch {
    return "your email";
  }
}

/**
 * Safe in-app path for post-login navigation.
 * Allows only relative paths. Rejects protocol-relative URLs and /login loops.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  const pathname = path.split(/[?#]/)[0] || "/";
  if (pathname === "/login" || pathname.startsWith("/login/")) return fallback;
  return path;
}

export function buildLoginUrl(pathname: string, search = ""): string {
  const current = `${pathname || "/"}${search || ""}`;
  const target = safeRedirectPath(current, "");
  if (!target) return "/login";
  return `/login?redirect=${encodeURIComponent(target)}`;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_PROVIDER_KEY);
  window.localStorage.removeItem(AZURE_SSO_KEY);
  window.localStorage.removeItem("pointcare_session");
  window.localStorage.removeItem("pointcare_token");
  window.localStorage.setItem(REDIRECT_LOGOUT_KEY, "true");
}
