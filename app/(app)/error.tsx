"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Stack
      spacing={1.5}
      sx={{
        minHeight: "50vh",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        textAlign: "center",
      }}
    >
      <Typography sx={{ fontSize: 18, fontWeight: 700, color: "text.primary" }}>
        Something went wrong
      </Typography>
      <Typography sx={{ fontSize: "var(--font-size-body)", color: "#6B7280", maxWidth: 440 }}>
        {error.message || "An unexpected error occurred. You can try again."}
      </Typography>
      <Box>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </Box>
    </Stack>
  );
}
