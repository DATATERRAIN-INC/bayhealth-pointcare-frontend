"use client";

import { StatusIndicator, statusColors, statusText } from "@/components/shared/StatusIndicator";

export type CallStatus =
  | "queued"
  | "in_progress"
  | "ongoing"
  | "sent"
  | "waiting"
  | "connect_live_agent"
  | "completed"
  | "not_attended"
  | "voicemail_reached"
  | "callback"
  | "scheduled"
  | "paused"
  | "cancel";

const CALL_STATUS_KEYS: CallStatus[] = [
  "queued",
  "in_progress",
  "ongoing",
  "sent",
  "waiting",
  "connect_live_agent",
  "completed",
  "not_attended",
  "voicemail_reached",
  "callback",
  "scheduled",
  "paused",
  "cancel",
];

export function parseCallStatus(value: unknown): CallStatus | null {
  const status = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (
    status === "queued" ||
    status === "paused" ||
    status === "in_progress" ||
    status === "ongoing" ||
    status === "waiting" ||
    status === "connect_live_agent" ||
    status === "completed" ||
    status === "not_attended" ||
    status === "voicemail_reached" ||
    status === "callback" ||
    status === "scheduled" ||
    status === "cancel" ||
    status === "cancelled" ||
    status === "canceled" ||
    status === "sent"
  ) {
    if (status === "cancelled" || status === "canceled") return "cancel";
    return status as CallStatus;
  }
  return null;
}

/** Backend statuses for a call that is still on the line (AI, waiting, or with an agent). */
export const LIVE_CALL_STATUSES = ["in_progress", "ongoing", "waiting", "connect_live_agent"] as const;

export function isLiveCallStatus(status: string | null | undefined): boolean {
  return (LIVE_CALL_STATUSES as readonly string[]).includes(String(status ?? ""));
}

export function callStatusMeta(
  status: CallStatus | null | undefined,
): { label: string; color: string; bg: string } {
  if (!status) return { label: "Unknown", color: "#6E6E6E", bg: "transparent" };
  return {
    label: statusText[status] || status,
    color: statusColors[status] || "#6E6E6E",
    bg: "transparent",
  };
}

export const CALL_STATUS_FILTER_OPTIONS: { value: CallStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...CALL_STATUS_KEYS.filter((value) => value !== "sent").map((value) => ({
    value,
    label: statusText[value] || value,
  })),
];

/** Status column renderer — colored 10px dot + label (no pill). */
export function CallStatusChip({ status }: { status: CallStatus | null | undefined }) {
  return <StatusIndicator status={status ?? undefined} />;
}
