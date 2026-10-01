/**
 * Normalize RTK Query / fetch errors into a safe user-facing string.
 */
export function parseAuthApiError(error: unknown, fallback: string): string {
  try {
    if (typeof error === "object" && error && "data" in error) {
      const data = (error as { data?: unknown }).data;
      const fromData = readErrorPayload(data);
      if (fromData) return fromData;
    }

    if (typeof error === "object" && error && "error" in error) {
      const nested = (error as { error?: unknown }).error;
      if (typeof nested === "string" && nested.trim()) {
        if (nested === "TypeError: Failed to fetch" || nested.includes("NetworkError")) {
          return "Could not reach the service. Check your connection and try again.";
        }
      }
    }

    if (typeof error === "object" && error && "status" in error) {
      const status = (error as { status?: unknown }).status;
      if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") {
        return "Could not reach the service. Check your connection and try again.";
      }
      if (status === "PARSING_ERROR") {
        return "Received an unexpected response from the server.";
      }
      if (status === 429) {
        return "Too many attempts. Please wait a moment and try again.";
      }
      if (status === 500 || status === 502 || status === 503 || status === 504) {
        return "The service is temporarily unavailable. Please try again.";
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return fallback;
    }
  } catch {
    // never throw from error mapper
  }
  return fallback;
}

function readErrorPayload(data: unknown): string {
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return "";
    // Avoid dumping HTML error pages into the UI.
    if (trimmed.startsWith("<!") || trimmed.startsWith("<html") || trimmed.startsWith("<HTML")) {
      return "";
    }
    return trimmed.length > 300 ? `${trimmed.slice(0, 300)}…` : trimmed;
  }

  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;

  for (const key of [
    "detail",
    "message",
    "email",
    "reset_code",
    "token",
    "new_password",
    "confirm_password",
    "password",
    "service_name",
    "reason_for_call",
    "first_name",
    "last_name",
    "phone_number",
    "dob",
    "doctor",
    "address",
    "non_field_errors",
  ]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      return value[0].trim();
    }
  }

  // Fallback: first field-level validation message from the API.
  for (const value of Object.values(record)) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      return value[0].trim();
    }
  }

  if (record.data && typeof record.data === "object") {
    return readErrorPayload(record.data);
  }

  return "";
}
