"use client";

import { CircularProgress, Stack, Typography } from "@mui/material";

export function AppLoadingFallback({ label = "Loading Gap in Care…" }: { label?: string }) {
  return (
    <Stack
      spacing={1.5}
      sx={{
        minHeight: "40vh",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "transparent",
      }}
    >
      <CircularProgress size={24} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}
