/**
 * Shared phone **display** helpers used across the app.
 * Display style: +1 (256) 264-5996
 *
 * IMPORTANT: Use `formatPhoneNumber` only in the UI.
 * Never send formatted values in POST/PATCH/PUT bodies — strip with
 * `phoneDigitsOnly` / `sanitizePhoneDigits` from `@/lib/phone` instead.
 */

/** Digits only from any phone-like input (safe for API payloads). */
export function phoneDigitsOnly(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "");
}

/** Normalize dialing code for display, e.g. "1" → "+1", "+91" → "+91". */
export function formatCountryCode(countryCode?: string | null): string {
  const trimmed = String(countryCode ?? "").trim();
  if (!trimmed) return "";
  const digits = phoneDigitsOnly(trimmed);
  if (!digits) return "";
  return `+${digits}`;
}

function nationalDisplay(digits: string): string {
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length > 6) {
    return `${digits.slice(0, digits.length - 4)}-${digits.slice(-4)}`;
  }
  return digits;
}

/**
 * Progressive national formatting for phone **inputs** (no country code).
 * Keeps typing smooth while showing `(256) 264-5996`.
 *
 * Store/API values must still be digits-only via `sanitizePhoneDigits`.
 */
export function formatPhoneInputValue(
  phone: string | null | undefined,
  maxDigits = 10,
): string {
  const digits = phoneDigitsOnly(phone).slice(0, Math.max(1, maxDigits));
  if (!digits) return "";

  if (maxDigits === 10 || digits.length <= 10) {
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  // Longer national numbers: keep a readable trailing group
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, digits.length - 4)}-${digits.slice(-4)}`;
}

/** Max character length for a formatted phone input (parens, spaces, dashes). */
export function phoneInputMaxLength(maxDigits: number): number {
  if (maxDigits <= 10) return 14; // (XXX) XXX-XXXX
  return maxDigits + 4;
}

/**
 * Formats a phone number for **UI display only**, including country code:
 * `+1 (256) 264-5996`, `+91 (987) 654-3210`.
 *
 * Do not use this for API request bodies.
 *
 * @example
 * formatPhoneNumber("2562645996", "+1") // "+1 (256) 264-5996"
 * formatPhoneNumber("9876543210", "+91") // "+91 (987) 654-3210"
 * formatPhoneNumber("+12562645996") // "+1 (256) 264-5996"
 */
export function formatPhoneNumber(
  phone: string | null | undefined,
  countryCode?: string | null,
): string {
  const raw = String(phone ?? "").trim();
  if (!raw) return "—";

  let digits = phoneDigitsOnly(raw);
  if (!digits) return "—";

  let displayCode = formatCountryCode(countryCode);

  if (displayCode) {
    const codeDigits = phoneDigitsOnly(displayCode);
    if (codeDigits && digits.startsWith(codeDigits) && digits.length > codeDigits.length) {
      digits = digits.slice(codeDigits.length);
    }
  } else if (raw.startsWith("+")) {
    // Infer dialing code from E.164 when countryCode was not passed
    if (digits.startsWith("1") && digits.length >= 11) {
      displayCode = "+1";
      digits = digits.slice(1);
    } else if (digits.startsWith("91") && digits.length >= 12) {
      displayCode = "+91";
      digits = digits.slice(2);
    } else if (digits.length > 10) {
      // Best-effort: treat leading digits beyond the last 10 as the country code
      displayCode = `+${digits.slice(0, digits.length - 10)}`;
      digits = digits.slice(-10);
    }
  } else if (digits.length === 11 && digits.startsWith("1")) {
    displayCode = "+1";
    digits = digits.slice(1);
  }

  const national = nationalDisplay(digits);
  return displayCode ? `${displayCode} ${national}` : national;
}
