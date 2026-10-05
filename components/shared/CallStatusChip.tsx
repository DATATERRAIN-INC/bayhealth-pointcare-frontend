"use client";

import { Box, Typography } from "@mui/material";

export type CallStatus = "in_progress" | "completed" | "not_attended" | "callback";

const CALL_STATUS_META: Record<CallStatus, { label: string; color: string; bg: string }> = {
  in_progress: { label: "In progress", color: "#F08A1A", bg: "#FFF4E8" },
  completed: { label: "Completed", color: "#178A45", bg: "#E5F6EC" },
  not_attended: { label: "Not attended", color: "#D14343", bg: "#FDECEC" },
  callback: { label: "Callback", color: "#B45309", bg: "#FEF3C7" },
};

export function parseCallStatus(value: unknown): CallStatus | null {
  const status = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (status === "in_progress" || status === "completed" || status === "not_attended" || status === "callback") {
    return status;
  }
  return null;
}

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
