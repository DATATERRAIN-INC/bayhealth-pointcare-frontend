"use client";

import { useEffect } from "react";
import {
  Box,
  Dialog,
  IconButton,
  keyframes,
  Stack,
  Typography,
} from "@mui/material";
import { Check, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPatientDob, type PatientRecord } from "@/data/gapPatients";
import { elevation } from "@/lib/theme/tokens";

type CallUiPhase = "calling" | "success";

const pulseRing = keyframes`
  0% { transform: scale(0.85); opacity: 0.55; }
  70% { transform: scale(1.35); opacity: 0; }
  100% { transform: scale(1.35); opacity: 0; }
`;

const softBounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

export function actionErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: { detail?: string; message?: string; error?: string } }).data;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
  }
  return fallback;
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

export function CallInitiatingDialog({
  open,
  phase,
  patient,
  onSuccessDone,
}: {
  open: boolean;
  phase: CallUiPhase;
  patient: PatientRecord;
  onSuccessDone: () => void;
}) {
  const phone = patient.phoneNumber
    ? `${patient.countryCode} ${patient.phoneNumber}`
    : "No phone on file";
  const calling = phase === "calling";

  useEffect(() => {
    if (!open || phase !== "success") return;
    const timer = window.setTimeout(() => onSuccessDone(), 1600);
    return () => window.clearTimeout(timer);
  }, [open, phase, onSuccessDone]);

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (calling && (reason === "backdropClick" || reason === "escapeKeyDown")) return;
        onSuccessDone();
      }}
      maxWidth={false}
      slotProps={{
        root: {
          sx: { zIndex: (theme) => theme.zIndex.modal + 2 },
        },
        backdrop: {
          sx: { bgcolor: elevation.backdrop },
        },
        paper: {
          sx: {
            width: 420,
            maxWidth: "calc(100vw - 40px)",
            borderRadius: "14px",
            boxShadow: elevation.floating,
            overflow: "hidden",
            m: 2,
          },
        },
      }}
    >
      <Box
        sx={{
          px: 4,
          py: 4.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          bgcolor: "#FFFFFF",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: 96,
            height: 96,
            display: "grid",
            placeItems: "center",
            mb: 2.5,
          }}
        >
          {calling
            ? [0, 1].map((ring) => (
                <Box
                  key={ring}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: "primary.main",
                    animation: `${pulseRing} 1.8s ease-out infinite`,
                    animationDelay: `${ring * 0.55}s`,
                  }}
                />
              ))
            : null}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              bgcolor: calling ? "#EAF3FB" : "#E8F8EF",
              color: calling ? "primary.main" : "#22C55E",
              display: "grid",
              placeItems: "center",
              animation: calling ? `${softBounce} 1.2s ease-in-out infinite` : "none",
              boxShadow: calling
                ? "0 8px 20px rgb(47 114 185 / 0.18)"
                : "0 8px 20px rgb(34 197 94 / 0.16)",
            }}
          >
            {calling ? <Phone size={30} strokeWidth={2.25} /> : <Check size={34} strokeWidth={3} />}
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "text.primary",
            lineHeight: 1.3,
          }}
        >
          {calling ? "Placing outbound call…" : "Call initiated"}
        </Typography>
        <Typography
          sx={{
            mt: 0.75,
            fontSize: "var(--font-size-body)",
            color: "#667085",
            lineHeight: 1.45,
            maxWidth: 300,
          }}
        >
          {calling
            ? `Connecting with ${patient.name}. This may take a moment.`
            : `Outbound call started for ${patient.name}.`}
        </Typography>

        <Box
          sx={{
            mt: 2.25,
            px: 1.75,
            py: 1.1,
            borderRadius: "10px",
            bgcolor: "#F7F9FB",
            border: "1px solid #EEF1F5",
            minWidth: 220,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#98A2B3", letterSpacing: "0.04em" }}>
            PATIENT
          </Typography>
          <Typography sx={{ mt: 0.35, fontSize: "var(--font-size-body)", fontWeight: 650, color: "text.primary" }}>
            {patient.name}
          </Typography>
          <Typography sx={{ mt: 0.2, fontSize: 13, color: "#667085" }}>{phone}</Typography>
        </Box>

        {calling ? (
          <Stack direction="row" spacing={0.75} sx={{ mt: 2.5, alignItems: "center" }}>
            {[0, 1, 2].map((dot) => (
              <Box
                key={dot}
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  opacity: 0.35,
                  animation: `${softBounce} 1s ease-in-out infinite`,
                  animationDelay: `${dot * 0.18}s`,
                }}
              />
            ))}
          </Stack>
        ) : null}
      </Box>
    </Dialog>
  );
}

export function ViewPatientDialog({
  patient,
  open,
  onClose,
}: {
  patient: PatientRecord;
  open: boolean;
  onClose: () => void;
}) {
  const phone = patient.phoneNumber ? `${patient.countryCode} ${patient.phoneNumber}` : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        backdrop: { sx: { bgcolor: elevation.backdrop } },
        paper: {
          sx: {
            width: 520,
            maxWidth: "calc(100vw - 32px)",
            borderRadius: "16px",
            boxShadow: elevation.floating,
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
          <InfoTile label="Reason for call" value={patient.serviceName} />
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
