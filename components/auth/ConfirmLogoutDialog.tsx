"use client";

import { Box, Dialog, Stack, Typography } from "@mui/material";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmLogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmLogoutDialog({ open, onClose, onConfirm }: ConfirmLogoutDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        backdrop: {
          sx: { bgcolor: "rgba(0, 0, 0, 0.45)" },
        },
        paper: {
          sx: {
            width: 440,
            maxWidth: "calc(100vw - 40px)",
            borderRadius: "10px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18)",
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
            bgcolor: "#E8F3FC",
            display: "grid",
            placeItems: "center",
            mb: 2.5,
          }}
        >
          <LogOut size={32} strokeWidth={2.25} color="#3B82F6" />
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
          Sign out?
        </Typography>
        <Typography
          sx={{
            mt: 1,
            fontSize: "var(--font-size-body)",
            color: "#6B7280",
            lineHeight: 1.5,
            maxWidth: 320,
          }}
        >
          Are you sure you want to sign out of Gap in Care?
        </Typography>

        <Stack direction="row" spacing={1.5} sx={{ mt: 3.5, width: "100%", maxWidth: 320 }}>
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button onClick={onConfirm} fullWidth autoFocus>
            Sign out
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
