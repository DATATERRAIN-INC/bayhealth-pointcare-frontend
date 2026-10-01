function readString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

/** Read user-facing message from auth API payloads. */
export function extractAuthMessage(payload: unknown, fallback: string): string {
  try {
    if (!payload || typeof payload !== "object") return fallback;
    const record = payload as { message?: unknown; detail?: unknown; data?: unknown };
    if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
    if (typeof record.detail === "string" && record.detail.trim()) return record.detail.trim();
    if (record.data && typeof record.data === "object") {
      return extractAuthMessage(record.data, fallback);
    }
  } catch {
    // ignore malformed payloads
  }
  return fallback;
}

/** Pull UUID token from verify-reset-code: { email, token }. */
export function extractResetToken(payload: unknown): string {
  try {
    if (!payload || typeof payload !== "object") return "";
    const record = payload as Record<string, unknown>;

    const direct = readString(record.token);
    if (direct) return direct;

    for (const key of ["PASSWORD_RESET_URL", "password_reset_url", "reset_url", "url"]) {
      const url = readString(record[key]);
      if (!url) continue;
      try {
        const token = new URL(url, "http://localhost").searchParams.get("token");
        if (token?.trim()) return token.trim();
      } catch {
        // ignore invalid URL shapes
      }
    }

    const nested = record.data;
    if (nested && typeof nested === "object") {
      return extractResetToken(nested);
    }
  } catch {
    // ignore malformed payloads
  }
  return "";
}

/** True when validate-password-token returns { valid: true }. */
export function isPasswordTokenValid(payload: unknown): boolean {
  try {
    if (!payload || typeof payload !== "object") return false;
    return (payload as { valid?: unknown }).valid === true;
  } catch {
    return false;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed.length > 3 && trimmed.length <= 254 && EMAIL_PATTERN.test(trimmed);
}

/** Cap / sanitize query-string success messages shown on login. */
export function safeStatusMessage(value: string | null | undefined, maxLength = 180): string {
  const text = (value || "").trim();
  if (!text || text.length > maxLength) return "";
  if (/[<>]/.test(text)) return "";
  return text;
}

const AUTH_STATUS_MESSAGE_KEY = "pointcare:auth_status_message";

/** Persist success message across the reset → login redirect. */
export function stashAuthStatusMessage(message: string): void {
  if (typeof window === "undefined") return;
  const safe = safeStatusMessage(message);
  if (!safe) return;
  try {
    window.sessionStorage.setItem(AUTH_STATUS_MESSAGE_KEY, safe);
  } catch {
    // private mode / storage blocked
  }
}

/** Read and clear a stashed auth status message. */
export function consumeAuthStatusMessage(): string {
  if (typeof window === "undefined") return "";
  try {
    const value = window.sessionStorage.getItem(AUTH_STATUS_MESSAGE_KEY);
    window.sessionStorage.removeItem(AUTH_STATUS_MESSAGE_KEY);
    return safeStatusMessage(value);
  } catch {
    return "";
  }
}
