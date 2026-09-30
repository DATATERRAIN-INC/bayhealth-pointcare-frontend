import type { AuthSession, User } from "@/types/user";
import type { LoginApiResponse, LoginApiUser } from "@/types/auth";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearSession,
  getAccessToken,
  getRefreshToken as readRefreshToken,
  getTokenEmail,
  isAuthenticated as hasAccessToken,
  jwtDecode,
  tokenExpiresAt,
} from "@/lib/authUtils";

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };
export const SESSION_KEY = "pointcare_session";

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
  return tokenExpiresAt(token);
}

function userFromToken(token: string, emailFallback = ""): User {
  const claims = jwtDecode(token);
  const email =
    getTokenEmail() ||
    (typeof claims?.email === "string" ? claims.email : "") ||
    emailFallback;
  const given = typeof claims?.given_name === "string" ? claims.given_name : "";
  const family = typeof claims?.family_name === "string" ? claims.family_name : "";
  const claimName = typeof claims?.name === "string" ? claims.name : "";
  const name = [given, family].filter(Boolean).join(" ").trim() || claimName || email || "User";
  const role = typeof claims?.role === "string" && claims.role.trim() ? claims.role : "Care team";
  return {
    id: String(claims?.sub ?? claims?.user_id ?? "usr"),
    name,
    email,
    role,
    avatarInitials: initialsFrom(name || email || "User"),
  };
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
  if (session.refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  }
}

export function updateAccessToken(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(SESSION_KEY);
  let current: AuthSession | null = null;
  if (raw) {
    try {
      current = JSON.parse(raw) as AuthSession;
    } catch {
      current = null;
    }
  }

  const expires = decodeJwtExp(accessToken) ?? new Date(Date.now() + 8 * 60 * 60 * 1000);
  saveSession({
    user: current?.user ?? {
      id: "usr",
      name: "User",
      email: "",
      role: "Care team",
      avatarInitials: "PC",
    },
    accessToken,
    refreshToken: refreshToken || current?.refreshToken || window.localStorage.getItem(REFRESH_TOKEN_KEY) || "",
    expiresAt: expires.toISOString(),
  });
}

export function logout(): void {
  clearSession();
  if (typeof window === "undefined") return;
  queueMicrotask(() => {
    void import("@/lib/store").then((mod) => mod.resetClientStore());
  });
}

export function getSession(): AuthSession | null {
  const accessToken = getAccessToken();
  if (!accessToken || typeof window === "undefined") return null;

  const refreshToken = readRefreshToken() || "";
  const expiresAt = (tokenExpiresAt(accessToken) ?? new Date(Date.now() + 8 * 60 * 60 * 1000)).toISOString();
  const raw = window.localStorage.getItem(SESSION_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AuthSession & { token?: string };
      if (parsed.user) {
        return {
          user: parsed.user,
          accessToken,
          refreshToken: parsed.refreshToken || refreshToken,
          expiresAt: parsed.expiresAt || expiresAt,
        };
      }
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }

  return {
    user: userFromToken(accessToken),
    accessToken,
    refreshToken,
    expiresAt,
  };
}

export function isAccessTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  const expires = tokenExpiresAt(token);
  if (!expires) return false;
  return expires.getTime() <= Date.now();
}

export function getAuthToken(): string | null {
  return getAccessToken();
}

export function getRefreshToken(): string | null {
  return readRefreshToken();
}

export function isAuthenticated(): boolean {
  return hasAccessToken();
}
