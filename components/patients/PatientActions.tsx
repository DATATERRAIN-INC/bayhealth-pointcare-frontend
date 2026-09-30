"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Dialog,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { Ban, Eye, Pencil, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPatientDob, type PatientRecord } from "@/data/gapPatients";
import { useSetPatientBlockedStatusMutation } from "@/lib/api/patientsApi";

function actionErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: { detail?: string; message?: string } }).data;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
  }
  return "Could not update this patient. Please try again.";
}

function initialsFrom(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || "P").toUpperCase();
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        px: 1.5,
        py: 1.25,
        borderRadius: "10px",
        bgcolor: "#F7F9FB",
        border: "1px solid #EEF1F5",
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", color: "#8B93A7" }}>{label}</Typography>
      <Typography sx={{ mt: 0.4, fontSize: "var(--font-size-body)", fontWeight: 600, color: "text.primary", lineHeight: 1.4 }}>
        {value.trim() || "—"}
      </Typography>
    </Box>
  );
}

export function PatientActions({
  patient,
  onBlocked,
}: {
  patient: PatientRecord;
  onBlocked: (message: string) => void;
}) {
  const router = useRouter();
  const [setBlocked, { isLoading: isBlocking }] = useSetPatientBlockedStatusMutation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [blockError, setBlockError] = useState("");

  function openMenu(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    setAnchor(event.currentTarget);
  }

  function closeMenu() {
    setAnchor(null);
  }

  async function toggleBlocked() {
    const blocking = !patient.blocked;
    closeMenu();
    setBlockError("");
    try {
      await setBlocked({ id: patient.id, is_blocked: blocking }).unwrap();
      onBlocked(blocking ? "Patient blocked successfully." : "Patient unblocked successfully.");
    } catch (error) {
      setBlockError(actionErrorMessage(error));
    }
  }

  return (
    <>
      <IconButton
        aria-label={`Actions for ${patient.name}`}
        aria-haspopup="menu"
        aria-expanded={anchor ? "true" : undefined}
        onClick={openMenu}
        sx={{
          width: 36,
          height: 36,
          bgcolor: "#F2F4F7",
          "&:hover": { bgcolor: "#E7EBF0" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }} aria-hidden>
          {[0, 1, 2].map((dot) => (
            <Box
              key={dot}
              sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#E11D48" }}
            />
          ))}
        </Box>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 180, mt: 0.5, borderRadius: "10px" } } }}
      >
        <MenuItem
          onClick={() => {
            closeMenu();
            setViewOpen(true);
          }}
          sx={{ fontSize: "var(--font-size-body)" }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Eye size={16} />
          </ListItemIcon>
          View
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            router.push(`/patients/add?id=${encodeURIComponent(patient.id)}&edit=true`);
          }}
          sx={{ fontSize: "var(--font-size-body)" }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Pencil size={16} />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem
          disabled={isBlocking}
          onClick={() => void toggleBlocked()}
          sx={{ fontSize: "var(--font-size-body)", color: patient.blocked ? "primary.main" : "#D14343" }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
            {patient.blocked ? <ShieldCheck size={16} /> : <Ban size={16} />}
          </ListItemIcon>
          {patient.blocked ? "Unblock" : "Block"}
        </MenuItem>
      </Menu>

      <ViewPatientDialog patient={patient} open={viewOpen} onClose={() => setViewOpen(false)} />
      <Dialog
        open={Boolean(blockError)}
        onClose={() => setBlockError("")}
        maxWidth={false}
        slotProps={{
          paper: { sx: { width: 420, maxWidth: "calc(100vw - 32px)", borderRadius: "12px", p: 3 } },
        }}
      >
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#D92D20" }}>{blockError}</Typography>
        <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 2 }}>
          <Button onClick={() => setBlockError("")} sx={{ px: 2 }}>
            Close
          </Button>
        </Stack>
      </Dialog>
    </>
  );
}

function ViewPatientDialog({
  patient,
  open,
  onClose,
}: {
  patient: PatientRecord;
  open: boolean;
  onClose: () => void;
}) {
  const phone = patient.phoneNumber ? `${patient.countryCode} ${patient.phoneNumber}` : "";
  const liveAgent = patient.liveAgentNumber ? `${patient.liveAgentCountryCode} ${patient.liveAgentNumber}` : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        backdrop: { sx: { bgcolor: "rgba(15, 23, 42, 0.45)" } },
        paper: {
          sx: {
            width: 520,
            maxWidth: "calc(100vw - 32px)",
            borderRadius: "16px",
            boxShadow: "0 24px 48px rgba(15, 23, 42, 0.18)",
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          px: { xs: 2.5, sm: 3 },
          pt: 3,
          pb: 2.5,
          background: "linear-gradient(180deg, #EAF3FB 0%, #FFFFFF 100%)",
        }}
      >
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", top: 12, right: 12, color: "#64748B" }}
        >
          <X size={18} />
        </IconButton>
        <Stack direction="row" spacing={1.75} sx={{ alignItems: "center", pr: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: "16px",
              bgcolor: "#2F72B9",
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {initialsFrom(patient.name)}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "text.primary", lineHeight: 1.2 }}>
              {patient.name}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 0.85, alignItems: "center", flexWrap: "wrap" }}>
              <Box
                component="span"
                sx={{
                  px: 1,
                  py: 0.2,
                  borderRadius: "999px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: patient.blocked ? "#D14343" : "#178A45",
                  bgcolor: patient.blocked ? "#FDECEC" : "#E5F6EC",
                }}
              >
                {patient.blocked ? "Blocked" : "Active"}
              </Box>
              <Box
                component="span"
                sx={{
                  px: 1,
                  py: 0.2,
                  borderRadius: "999px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: patient.source === "Excel" ? "#1D5F9A" : "#526071",
                  bgcolor: patient.source === "Excel" ? "#EAF3FB" : "#F0F2F5",
                }}
              >
                {patient.source}
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.75 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.25,
          }}
        >
          <InfoTile label="Date of birth" value={formatPatientDob(patient.dateOfBirth)} />
          <InfoTile label="Doctor" value={patient.doctor} />
          <InfoTile label="Phone" value={phone} />
          <InfoTile label="Live agent" value={liveAgent} />
          <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
            <InfoTile label="Address" value={patient.address} />
          </Box>
        </Box>
        <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 2.25 }}>
          <Button onClick={onClose} sx={{ px: 2.5, minWidth: 120 }}>
            Close
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
