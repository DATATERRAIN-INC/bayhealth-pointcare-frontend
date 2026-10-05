"use client";

import { useEffect } from "react";
import { Box, Dialog, Typography } from "@mui/material";
import { Check } from "lucide-react";

import { elevation } from "@/lib/theme/tokens";

interface SuccessDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  /** Ignored — this design has no action button. */
  confirmLabel?: string;
  autoCloseMs?: number;
  onClose: () => void;
}

/** Minimal centered success popup (checkmark + message, no buttons). */
export function SuccessDialog({
  open,
  title,
  message = "Patient added successfully.",
  autoCloseMs = 2500,
  onClose,
}: SuccessDialogProps) {
  const text = title || message;

  useEffect(() => {
    if (!open || autoCloseMs <= 0) return;
    const timer = window.setTimeout(() => onClose(), autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [open, autoCloseMs, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        backdrop: {
          sx: { bgcolor: elevation.backdrop },
        },
        paper: {
          sx: {
            width: 440,
            maxWidth: "calc(100vw - 40px)",
            borderRadius: "12px",
            boxShadow: elevation.floating,
            overflow: "hidden",
            m: 2,
          },
        },
      }}
    >
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          px: 4,
          py: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            bgcolor: "#E8F8EF",
            display: "grid",
            placeItems: "center",
            mb: 2.5,
          }}
        >
          <Check size={36} strokeWidth={3} color="#22C55E" />
        </Box>

        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 500,
            color: "#3B82F6",
            lineHeight: 1.45,
            maxWidth: 340,
          }}
        >
          {text}
        </Typography>
      </Box>
    </Dialog>
  );
}
