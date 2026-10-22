"use client";

import { Box, Typography } from "@mui/material";

/** Retell post-call analysis `user_sentiment`: how the patient felt on the call. */
export type UserSentiment = "Positive" | "Neutral" | "Negative" | "Unknown";

const SENTIMENT_META: Record<UserSentiment, { label: string; color: string; bg: string }> = {
  Positive: { label: "Positive", color: "#178A45", bg: "#E5F6EC" },
  Neutral: { label: "Neutral", color: "#526071", bg: "#F0F2F5" },
  Negative: { label: "Negative", color: "#D14343", bg: "#FDECEC" },
  Unknown: { label: "Unknown", color: "#8B93A7", bg: "#F5F6F8" },
};

/** Calls-page filter. `pending` = Retell has not analysed the call yet. */
export type SentimentFilter = "all" | UserSentiment | "pending";

export const SENTIMENT_FILTER_OPTIONS: { value: SentimentFilter; label: string }[] = [
  { value: "all", label: "All sentiments" },
  { value: "Positive", label: "Positive" },
  { value: "Neutral", label: "Neutral" },
  { value: "Negative", label: "Negative" },
  { value: "Unknown", label: "Unknown" },
  { value: "pending", label: "Not analysed yet" },
];

export function parseUserSentiment(value: unknown): UserSentiment | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "positive") return "Positive";
  if (text === "neutral") return "Neutral";
  if (text === "negative") return "Negative";
  if (text === "unknown") return "Unknown";
  return null;
}

/** Shows "—" until Retell finishes its post-call analysis. */
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
      component="span"
      title="Patient sentiment (Retell post-call analysis)"
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
