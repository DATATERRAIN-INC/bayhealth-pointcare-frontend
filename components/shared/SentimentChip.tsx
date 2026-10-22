"use client";

import { Box, Typography } from "@mui/material";

/** Retell post-call analysis `user_sentiment`: how the patient felt on the call. */
export type UserSentiment = "Positive" | "Neutral" | "Negative" | "Unknown";

const SENTIMENT_META: Record<UserSentiment, { label: string; color: string }> = {
  Positive: { label: "Positive", color: "#15803D" },
  Neutral: { label: "Neutral", color: "#64748B" },
  Negative: { label: "Negative", color: "#DC2626" },
  Unknown: { label: "Unknown", color: "#6B7280" },
};

export function parseUserSentiment(value: unknown): UserSentiment | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "positive") return "Positive";
  if (text === "neutral") return "Neutral";
  if (text === "negative") return "Negative";
  if (text === "unknown") return "Unknown";
  return null;
}

/**
 * Dot + label sentiment (same pattern as StatusIndicator).
 * Shows "—" until Retell finishes its post-call analysis.
 */
export function SentimentChip({ sentiment }: { sentiment: UserSentiment | null | undefined }) {
  if (!sentiment) {
    return (
      <Typography component="span" sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
        —
      </Typography>
    );
  }

  const meta = SENTIMENT_META[sentiment];
  return (
    <Box
      title="Patient sentiment (Retell post-call analysis)"
      sx={{
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "8px",
        lineHeight: 1,
        verticalAlign: "middle",
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: meta.color,
          flexShrink: 0,
          display: "inline-block",
          alignSelf: "center",
          position: "relative",
          top: "1px",
        }}
      />
      <Box
        component="span"
        sx={{
          fontSize: 14,
          fontWeight: 500,
          color: meta.color,
          lineHeight: 1,
          whiteSpace: "nowrap",
          display: "inline-block",
          m: 0,
          p: 0,
        }}
      >
        {meta.label}
      </Box>
    </Box>
  );
}
