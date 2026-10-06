import type { CallStatus } from "@/components/shared/CallStatusChip";
import type { OutreachChannel } from "@/data/gapCalls";
import { formatPhoneNumber } from "@/constants/phone";

export type PatientSource = "Manual" | "Excel";

export interface PatientTryAttempt {
  id: string;
  datetime: string | null;
  callType: string;
  channel: OutreachChannel;
  status: CallStatus | null;
  retellCallId: string;
}

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
  callStatus: CallStatus | null;
  /** Latest outreach id when the API includes it. */
  lastCallId: string | null;
  lastCallChannel: OutreachChannel | null;
  retellCallId: string;
  hasTranscript: boolean;
  /** Latest call duration in seconds from the patients API. */
  durationSeconds: number | null;
  /** Outreach attempt count from `patient_tries.count`. */
  patientTries: number;
  /** Timed outreach attempts from `patient_tries.attempts`. */
  tryAttempts: PatientTryAttempt[];
}

const TRY_TIME_ZONE = "America/New_York";

/** Formats an attempt timestamp for UI, e.g. "Oct 6, 2026 at 4:10 AM". */
export function formatPatientTryTime(iso: string | null | undefined): string {
  if (!iso) return "Time unavailable";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: TRY_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: TRY_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${day} at ${time}`;
}

/** Formats call duration for UI, e.g. "10s" or "1m 5s". */
export function formatCallDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "—";
  const mins = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  if (mins === 0) return `${remainder}s`;
  return `${mins}m ${remainder}s`;
}

export function patientOutreachLabel(patient: PatientRecord): string | null {
  if (!patient.lastCallId) return null;
  const channel = patient.lastCallChannel ?? "call";
  return channel === "text" ? `Text #${patient.lastCallId}` : `Call #${patient.lastCallId}`;
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

/** Formats a phone number for UI display only, e.g. "(256) 264-5996". Never use for API bodies. */
export function formatPatientPhone(countryCode: string, phoneNumber: string): string {
  return formatPhoneNumber(phoneNumber, countryCode);
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
