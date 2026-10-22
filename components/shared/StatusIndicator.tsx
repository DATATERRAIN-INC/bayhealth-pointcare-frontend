"use client";

import type { ReactNode } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Box, type SxProps, type Theme } from "@mui/material";

/**
 * High-contrast, visually distinct hues (spread across the spectrum
 * so adjacent statuses do not look alike).
 */
export const WCAG_COLORS = {
  green: "#15803D",
  teal: "#0F766E",
  cyan: "#0891B2",
  sky: "#0284C7",
  blue: "#2563EB",
  indigo: "#4F46E5",
  violet: "#7C3AED",
  purple: "#9333EA",
  magenta: "#C026D3",
  rose: "#E11D48",
  red: "#DC2626",
  orange: "#EA580C",
  amber: "#D97706",
  yellow: "#CA8A04",
  lime: "#65A30D",
  slate: "#64748B",
  gray: "#6B7280",
  stone: "#78716C",
} as const;

/** Dot/label colors keyed by status string (call, queue, and common keys). */
export const statusColors: Record<string, string> = {
  // Common
  Active: WCAG_COLORS.lime,
  active: WCAG_COLORS.lime,
  Inactive: WCAG_COLORS.stone,
  inactive: WCAG_COLORS.stone,
  Deactive: WCAG_COLORS.gray,
  Pending: WCAG_COLORS.yellow,
  pending: WCAG_COLORS.yellow,
  Approved: WCAG_COLORS.teal,
  approved: WCAG_COLORS.teal,
  Rejected: WCAG_COLORS.rose,
  rejected: WCAG_COLORS.rose,
  Blocked: WCAG_COLORS.magenta,
  new: WCAG_COLORS.indigo,
  draft: WCAG_COLORS.slate,
  "Not Submitted": WCAG_COLORS.gray,

  // Call / outreach — far apart on the color wheel
  queued: WCAG_COLORS.slate,
  Queued: WCAG_COLORS.slate,
  in_progress: WCAG_COLORS.orange,
  "In progress": WCAG_COLORS.orange,
  ongoing: WCAG_COLORS.teal,
  Ongoing: WCAG_COLORS.teal,
  sent: WCAG_COLORS.green,
  Sent: WCAG_COLORS.green,
  waiting: WCAG_COLORS.amber,
  "Waiting for agent": WCAG_COLORS.amber,
  connect_live_agent: WCAG_COLORS.blue,
  "With live agent": WCAG_COLORS.blue,
  completed: WCAG_COLORS.green,
  Completed: WCAG_COLORS.green,
  not_attended: WCAG_COLORS.red,
  "Not attended": WCAG_COLORS.red,
  voicemail_reached: WCAG_COLORS.violet,
  Voicemail: WCAG_COLORS.violet,
  callback: WCAG_COLORS.cyan,
  Callback: WCAG_COLORS.cyan,
  scheduled: WCAG_COLORS.purple,
  Scheduled: WCAG_COLORS.purple,
  paused: WCAG_COLORS.yellow,
  Paused: WCAG_COLORS.yellow,
  cancel: WCAG_COLORS.gray,
  cancelled: WCAG_COLORS.gray,
  canceled: WCAG_COLORS.gray,
  Cancelled: WCAG_COLORS.gray,
  failed: WCAG_COLORS.magenta,
  Failed: WCAG_COLORS.magenta,
};

export const statusText: Record<string, string> = {
  Active: "Active",
  Inactive: "Inactive",
  Deactive: "Deactive",
  Pending: "Pending",
  Approved: "Approved",
  Rejected: "Rejected",
  Blocked: "Blocked",
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  rejected: "Rejected",
  approved: "Approved",
  new: "New",
  draft: "Draft",
  "Not Submitted": "Not Submitted",

  queued: "Queued",
  in_progress: "In progress",
  ongoing: "Ongoing",
  sent: "Sent",
  waiting: "Waiting for agent",
  connect_live_agent: "With live agent",
  not_attended: "Not attended",
  voicemail_reached: "Voicemail",
  callback: "Callback",
  scheduled: "Scheduled",
  paused: "Paused",
  cancel: "Cancelled",
  failed: "Failed",
  Failed: "Failed",

  Queued: "Queued",
  "In progress": "In progress",
  Ongoing: "Ongoing",
  Sent: "Sent",
  "Waiting for agent": "Waiting for agent",
  "With live agent": "With live agent",
  Completed: "Completed",
  "Not attended": "Not attended",
  Voicemail: "Voicemail",
  Callback: "Callback",
  Scheduled: "Scheduled",
  Paused: "Paused",
  Cancelled: "Cancelled",
};

const statusWithIcons: Record<
  string,
  typeof CheckCircleIcon | typeof CancelIcon
> = {
  Approved: CheckCircleIcon,
  Rejected: CancelIcon,
  approved: CheckCircleIcon,
  rejected: CancelIcon,
  passed: CheckCircleIcon,
  failed: CancelIcon,
  completed: CheckCircleIcon,
  cancel: CancelIcon,
  cancelled: CancelIcon,
};

export type StatusIndicatorProps = {
  status?: string | null;
  useIcon?: boolean;
  sx?: SxProps<Theme>;
};

/**
 * Dot + label status (not a pill chip).
 */
export function StatusIndicator({
  status,
  useIcon = false,
  sx = {},
}: StatusIndicatorProps) {
  if (!status) {
    return <MoreHorizIcon sx={{ color: WCAG_COLORS.gray, fontSize: "1.2rem" }} />;
  }

  const statusColor = statusColors[status] || WCAG_COLORS.gray;
  const displayText = statusText[status] || status;
  const showDot = status !== "Not Submitted";
  const IconComponent = useIcon ? statusWithIcons[status] : undefined;

  return (
    <Box
      sx={[
        {
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "8px",
          lineHeight: 1,
          verticalAlign: "middle",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {showDot && !IconComponent ? (
        <Box
          component="span"
          aria-hidden
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: statusColor,
            flexShrink: 0,
            display: "inline-block",
            alignSelf: "center",
            // Cap-height text sits optically high in the em-box; nudge the
            // dot down so its center matches the middle of the letters.
            position: "relative",
            top: "1px",
          }}
        />
      ) : null}
      {showDot && IconComponent ? (
        <IconComponent
          sx={{
            color: statusColor,
            fontSize: 16,
            display: "block",
            flexShrink: 0,
            alignSelf: "center",
          }}
        />
      ) : null}
      <Box
        component="span"
        sx={{
          fontSize: 14,
          fontWeight: 500,
          color: statusColor,
          lineHeight: 1,
          letterSpacing: 0,
          whiteSpace: "nowrap",
          display: "inline-block",
          m: 0,
          p: 0,
        }}
      >
        {displayText}
      </Box>
    </Box>
  );
}

export function StatusIndicatorWithAction({
  status,
  useIcon = false,
  action,
  sx = {},
}: StatusIndicatorProps & { action?: ReactNode }) {
  return (
    <Box
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          gap: 1,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <StatusIndicator status={status} useIcon={useIcon} />
      {action}
    </Box>
  );
}

export default StatusIndicator;
