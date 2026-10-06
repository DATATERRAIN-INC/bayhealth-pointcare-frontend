/** National phone digit rules keyed by dialing code (without the number itself). */
import {
  formatPhoneInputValue,
  formatPhoneNumber,
  phoneDigitsOnly,
  phoneInputMaxLength,
} from "@/constants/phone";

export type PhoneLengthRule = {
  min: number;
  max: number;
  region: string;
  /** Digits-only sample shown as the input placeholder. */
  sample: string;
};

const DEFAULT_PHONE_RULE: PhoneLengthRule = {
  min: 7,
  max: 15,
  region: "this country code",
  sample: "5550100",
};

const PHONE_LENGTH_BY_COUNTRY: Record<string, PhoneLengthRule> = {
  "+1": { min: 10, max: 10, region: "US/Canada", sample: "3025550199" },
  "+44": { min: 10, max: 10, region: "UK", sample: "7400123456" },
  "+91": { min: 10, max: 10, region: "India", sample: "9876543210" },
  "+61": { min: 9, max: 9, region: "Australia", sample: "412345678" },
  "+81": { min: 10, max: 10, region: "Japan", sample: "9012345678" },
};

export function normalizeCountryCode(value: string): string {
  const trimmed = value.trim() || "+1";
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

export function getPhoneLengthRule(countryCode: string): PhoneLengthRule {
  return PHONE_LENGTH_BY_COUNTRY[normalizeCountryCode(countryCode)] ?? DEFAULT_PHONE_RULE;
}

export function sanitizePhoneDigits(value: string, countryCode: string): string {
  const rule = getPhoneLengthRule(countryCode);
  return value.replace(/\D/g, "").slice(0, rule.max);
}

export function phoneSamplePlaceholder(countryCode: string): string {
  const rule = getPhoneLengthRule(countryCode);
  return formatPhoneInputValue(rule.sample, rule.max);
}

export { formatPhoneNumber, formatPhoneInputValue, phoneDigitsOnly, phoneInputMaxLength };

/** Returns an error message when invalid; null when empty or valid. */
export function validatePhoneNumber(
  phoneNumber: string,
  countryCode: string,
  options?: { required?: boolean; fieldLabel?: string },
): string | null {
  const digits = phoneNumber.replace(/\D/g, "");
  const label = options?.fieldLabel ?? "phone number";
  if (!digits) {
    return options?.required ? `Enter a ${label}.` : null;
  }

  const rule = getPhoneLengthRule(countryCode);
  const code = normalizeCountryCode(countryCode);

  if (digits.length < rule.min) {
    if (rule.min === rule.max) {
      return `${code} numbers need ${rule.max} digits (${rule.region}).`;
    }
    return `${code} numbers need at least ${rule.min} digits (${rule.region}).`;
  }

  if (digits.length > rule.max) {
    if (rule.min === rule.max) {
      return `${code} numbers must be ${rule.max} digits (${rule.region}).`;
    }
    return `${code} numbers must be at most ${rule.max} digits (${rule.region}).`;
  }

  return null;
}
