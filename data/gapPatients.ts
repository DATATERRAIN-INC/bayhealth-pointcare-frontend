export type PatientSource = "Manual" | "Excel";

export interface PatientRecord {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  address: string;
  dateOfBirth: string;
  doctor: string;
  source: PatientSource;
  countryCode: string;
  phoneNumber: string;
  /** Reason for call / service name */
  serviceName: string;
  blocked: boolean;
}

export const DOCTORS = ["Dr. Alan Brooks", "Dr. Priya Shah"] as const;

export function formatPatientDob(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Formats country code + national number, e.g. "+1 3025550101". */
export function formatPatientPhone(countryCode: string, phoneNumber: string): string {
  const phone = phoneNumber.trim();
  if (!phone) return "—";
  const code = countryCode.trim() || "+1";
  const normalized = code.startsWith("+") ? code : `+${code}`;
  return `${normalized} ${phone}`;
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Formats typed digits into MM/DD/YYYY, inserting `/` automatically. */
export function formatDobInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Accepts MM/DD/YYYY, M/D/YYYY, or YYYY-MM-DD. */
export function parseDobInput(value: string): Date | null {
  const trimmed = value.trim();
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (us) {
    const date = new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
    if (
      date.getFullYear() === Number(us[3]) &&
      date.getMonth() === Number(us[1]) - 1 &&
      date.getDate() === Number(us[2])
    ) {
      return date;
    }
    return null;
  }
  return parseIsoDate(trimmed);
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);
  return compare.getTime() > today.getTime();
}
