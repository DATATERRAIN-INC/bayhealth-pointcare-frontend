import type { AuthSession, User } from "@/types/user";
import type { LoginApiResponse, LoginApiUser } from "@/types/auth";

export const SESSION_KEY = "pointcare_session";
export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

function initialsFrom(value: string): string {
  const parts = value.split(/[.\s@_+-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return value.slice(0, 2).toUpperCase() || "PC";
}

function displayNameFrom(user?: LoginApiUser, emailFallback = ""): string {
  if (!user) return emailFallback;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (typeof user.name === "string" && user.name.trim()) return user.name.trim();
  if (typeof user.username === "string" && user.username.trim()) return user.username.trim();
  if (typeof user.email === "string" && user.email.trim()) return user.email.trim();
  return emailFallback;
}

function decodeJwtExp(token: string): Date | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized)) as { exp?: number };
    if (!json.exp) return null;
    return new Date(json.exp * 1000);
  } catch {
    return null;
  }
}

function extractAccessToken(response: LoginApiResponse): string {
  return (
    response.access_token ||
    response.data?.access_token ||
    response.access ||
    response.data?.access ||
    response.token ||
    response.data?.token ||
    response.key ||
    ""
  );
}

function extractRefreshToken(response: LoginApiResponse): string {
  return response.refresh_token || response.data?.refresh_token || response.refresh || "";
}

export function mapLoginResponseToSession(response: LoginApiResponse, email: string): AuthSession {
  const accessToken = extractAccessToken(response);
  const refreshToken = extractRefreshToken(response);
  const apiUser = response.user || response.data?.user;
  const name = displayNameFrom(apiUser, email);
  const userEmail = (typeof apiUser?.email === "string" && apiUser.email) || email;
  const user: User = {
    id: String(apiUser?.id ?? `usr-${Date.now()}`),
    name,
    email: userEmail,
    role: typeof apiUser?.role === "string" ? apiUser.role : "Care team",
    avatarInitials: initialsFrom(name || userEmail),
  };

  const jwtExpiry = accessToken ? decodeJwtExp(accessToken) : null;
  const expires = jwtExpiry ?? new Date(Date.now() + 8 * 60 * 60 * 1000);

  return {
    user,
    accessToken,
    refreshToken,
    expiresAt: expires.toISOString(),
  };
}

export function saveSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

/** Temporary local login — skips the API until CORS/backend is ready. */
export function loginLocally(email: string): AuthSession {
  const trimmed = email.trim();
  const name = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const expires = new Date();
  expires.setHours(expires.getHours() + 8);

  const session: AuthSession = {
    user: {
      id: `local-${Date.now()}`,
      name: name || "User",
      email: trimmed,
      role: "Care team",
      avatarInitials: initialsFrom(name || trimmed || "U"),
    },
    accessToken: `local-access-${Date.now()}`,
    refreshToken: `local-refresh-${Date.now()}`,
    expiresAt: expires.toISOString(),
  };

  saveSession(session);
  return session;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  // Legacy key cleanup
  window.localStorage.removeItem("pointcare_token");
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession & { token?: string };
    const accessToken = parsed.accessToken || parsed.token || window.localStorage.getItem(ACCESS_TOKEN_KEY) || "";
    const refreshToken = parsed.refreshToken || window.localStorage.getItem(REFRESH_TOKEN_KEY) || "";

    const session: AuthSession = {
      user: parsed.user,
      accessToken,
      refreshToken,
      expiresAt: parsed.expiresAt,
    };

    if (!session.accessToken || new Date(session.expiresAt).getTime() < Date.now()) {
      logout();
      return null;
    }
    return session;
  } catch {
    logout();
    return null;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || getSession()?.accessToken || null;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) || getSession()?.refreshToken || null;
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken() && getSession());
}
