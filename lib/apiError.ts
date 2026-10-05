const MAX_SAFE_LENGTH = 280;

/**
 * Turn an RTK Query / fetch error into a short message that is safe to show.
 * Server debug pages, HTML, and tracebacks are replaced with the fallback.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  try {
    const safe = readSafeMessage(error);
    if (safe) return safe;

    const status = readStatus(error);
    if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") {
      return "Could not reach the server. Check your connection and try again.";
    }
    if (status === 429) {
      return "Too many attempts. Please wait a moment and try again.";
    }
  } catch {
    // Never throw from the error mapper.
  }
  return fallback;
}

function readStatus(error: unknown): unknown {
  if (!error || typeof error !== "object" || !("status" in error)) return undefined;
  return (error as { status?: unknown }).status;
}

function readSafeMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "";

  if ("data" in error) {
    const fromData = readPayload((error as { data?: unknown }).data);
    if (fromData) return fromData;
  }

  if ("error" in error) {
    const nested = (error as { error?: unknown }).error;
    if (typeof nested === "string" && isNetworkFailure(nested)) {
      return "Could not reach the server. Check your connection and try again.";
    }
  }

  return "";
}

function isNetworkFailure(value: string): boolean {
  return value === "TypeError: Failed to fetch" || value.includes("NetworkError");
}

function readPayload(data: unknown, depth = 0): string {
  if (depth > 3) return "";

  if (typeof data === "string") {
    return safeText(data);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) return "";
  const record = data as Record<string, unknown>;

  for (const key of ["detail", "message", "error", "non_field_errors"]) {
    const text = readValue(record[key]);
    if (text) return text;
  }

  for (const value of Object.values(record)) {
    const text = readValue(value);
    if (text) return text;
  }

  if (record.data && typeof record.data === "object") {
    return readPayload(record.data, depth + 1);
  }

  return "";
}

function readValue(value: unknown): string {
  if (typeof value === "string") return safeText(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") {
        const text = safeText(item);
        if (text) return text;
      }
    }
  }
  return "";
}

/** Keep short API messages. Drop HTML debug pages and stack traces. */
function safeText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_SAFE_LENGTH) return "";

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("<!") ||
    lower.startsWith("<html") ||
    lower.startsWith("<head") ||
    lower.startsWith("<body") ||
    lower.includes("<!doctype") ||
    lower.includes("<html") ||
    lower.includes("traceback (most recent call last)") ||
    lower.includes("exception value") ||
    lower.includes("exception type") ||
    lower.includes("programmingerror") ||
    lower.includes("the above exception was the direct cause")
  ) {
    return "";
  }

  return trimmed;
}
