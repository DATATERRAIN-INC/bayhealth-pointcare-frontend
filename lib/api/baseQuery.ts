import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { getAuthToken, getRefreshToken, isAccessTokenExpired, logout, updateAccessToken } from "@/lib/auth";
import { buildLoginUrl, isSsoSession } from "@/lib/authUtils";
import { getBaseUrl } from "@/lib/api/baseUrl";
import { getApiErrorMessage } from "@/lib/apiError";
import { showPermissionError } from "@/lib/permissionToast";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${getBaseUrl()}/api/ai-call`,
  timeout: 20000,
  prepareHeaders: async (headers, { arg }) => {
    const body = typeof arg === "object" && arg !== null && "body" in arg ? arg.body : undefined;
    if (!(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    let token = getAuthToken();
    if (token && isAccessTokenExpired()) {
      token = (await refreshAccessToken()) || token;
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

function requestUrl(args: string | FetchArgs): string {
  return typeof args === "string" ? args : args.url;
}

function readToken(data: unknown, keys: string[]): string {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  const nested = record.data;
  if (nested && typeof nested === "object") {
    return readToken(nested, keys);
  }
  return "";
}

let refreshRequest: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshRequest) {
    refreshRequest = requestRefresh().finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
}

function isSessionExpired(payload: unknown): boolean {
  if (typeof payload === "string") return payload.toLowerCase().includes("session expired");
  if (!payload || typeof payload !== "object") return false;
  const record = payload as { detail?: unknown; message?: unknown };
  const text = [record.detail, record.message].filter((value): value is string => typeof value === "string").join(" ");
  return text.toLowerCase().includes("session expired");
}

function forceLogin(): void {
  logout();
  if (typeof window === "undefined" || window.location.pathname.startsWith("/login")) return;
  window.location.assign(buildLoginUrl(window.location.pathname, window.location.search));
}

async function requestRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh || refresh.startsWith("local-")) return null;
  if (isSsoSession()) return null;

  try {
    const response = await fetch(`${getBaseUrl()}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (isSessionExpired(data)) return null;
    const access = readToken(data, ["access", "access_token", "token"]);
    if (!access) return null;
    const nextRefresh = readToken(data, ["refresh", "refresh_token"]);
    updateAccessToken(access, nextRefresh || undefined);
    return access;
  } catch {
    return null;
  }
}

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && isSessionExpired(result.error.data)) {
    forceLogin();
    return result;
  }

  if (result.error?.status === 403) {
    showPermissionError(getApiErrorMessage(result.error, "You do not have permission to do that."));
    return result;
  }

  if (result.error?.status !== 401) return result;

  const url = requestUrl(args);
  if (url.includes("/login") || url.includes("/token/refresh")) return result;

  const access = await refreshAccessToken();
  if (!access) {
    forceLogin();
    return result;
  }

  return rawBaseQuery(args, api, extraOptions);
};
