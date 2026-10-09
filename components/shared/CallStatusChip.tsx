"use client";

import { Box, Typography } from "@mui/material";

export type CallStatus =
  | "queued"
  | "in_progress"
  | "ongoing"
  | "completed"
  | "not_attended"
  | "callback"
  | "scheduled"
  | "paused"
  | "cancel";

const CALL_STATUS_META: Record<CallStatus, { label: string; color: string; bg: string }> = {
  queued: { label: "Queued", color: "#526071", bg: "#F0F2F5" },
  in_progress: { label: "In progress", color: "#F08A1A", bg: "#FFF4E8" },
  ongoing: { label: "Sent", color: "#178A45", bg: "#E5F6EC" },
  completed: { label: "Completed", color: "#178A45", bg: "#E5F6EC" },
  not_attended: { label: "Not attended", color: "#D14343", bg: "#FDECEC" },
  callback: { label: "Callback", color: "#B45309", bg: "#FEF3C7" },
  scheduled: { label: "Scheduled", color: "#5B4DB5", bg: "#EEEAFE" },
  paused: { label: "Paused", color: "#B45309", bg: "#FEF3C7" },
  cancel: { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6" },
};

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
    status === "completed" ||
    status === "not_attended" ||
    status === "callback" ||
    status === "scheduled" ||
    status === "paused" ||
    status === "cancel" ||
    status === "cancelled" ||
    status === "canceled"
  ) {
    if (status === "cancelled" || status === "canceled") return "cancel";
    return status;
  }
  return null;
}

export function callStatusMeta(status: CallStatus | null | undefined): { label: string; color: string; bg: string } {
  if (!status) return { label: "Unknown", color: "#8B93A7", bg: "#F0F2F5" };
  return CALL_STATUS_META[status];
}

export const CALL_STATUS_FILTER_OPTIONS: { value: CallStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...(Object.entries(CALL_STATUS_META) as [CallStatus, { label: string }][]).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
];

export function CallStatusChip({ status }: { status: CallStatus | null | undefined }) {
  if (!status) {
    return (
      <Typography component="span" sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
        —
      </Typography>
    );
  }

  const meta = CALL_STATUS_META[status];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1,
        py: 0.3,
        borderRadius: "999px",
        bgcolor: meta.bg,
        color: meta.color,
        fontSize: "var(--font-size-body)",
        fontWeight: 650,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </Box>
  );
}
