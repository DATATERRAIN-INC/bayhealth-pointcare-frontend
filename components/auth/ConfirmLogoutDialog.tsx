"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

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
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: "12px", p: 0.5 },
        },
      }}
    >
      <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: "text.primary", pb: 0.5 }}>
        Sign out?
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: "var(--font-size-body)", color: "#6B7280" }}>
          Are you sure you want to sign out of Point of Care?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary" sx={{ textTransform: "none" }} autoFocus>
          Sign out
        </Button>
      </DialogActions>
    </Dialog>
  );
}
