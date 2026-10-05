import { getApiErrorMessage } from "@/lib/apiError";

/**
 * Normalize RTK Query / fetch errors into a safe user-facing string.
 */
export function parseAuthApiError(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, fallback);
}
