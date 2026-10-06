"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Box,
  Dialog,
  IconButton,
  keyframes,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowLeft, CalendarDays, Check, ClipboardList, Eye, EyeOff, MapPin, Phone, Stethoscope, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CallStatusChip, callStatusMeta } from "@/components/shared/CallStatusChip";
import { OutreachTranscriptPanel } from "@/components/patients/PatientTranscriptDialog";
import { formatPhoneNumber } from "@/constants/phone";
import { channelMeta } from "@/data/gapCalls";
import {
  formatPatientDob,
  formatPatientTryTime,
  type PatientRecord,
  type PatientTryAttempt,
} from "@/data/gapPatients";
import { getApiErrorMessage } from "@/lib/apiError";
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
  return getApiErrorMessage(error, fallback);
}

function initialsFrom(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || "P").toUpperCase();
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" spacing={1.35} sx={{ alignItems: "flex-start" }}>
      <Box
        sx={{
          mt: "2px",
          width: 18,
          flexShrink: 0,
          color: "#94A3B8",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#8B93A7", lineHeight: 1.3 }}>
          {label}
        </Typography>
        <Typography
          sx={{
            mt: 0.2,
            fontSize: "var(--font-size-body)",
            color: "text.primary",
            fontWeight: 600,
            lineHeight: 1.45,
            wordBreak: "break-word",
          }}
        >
          {value.trim() || "—"}
        </Typography>
      </Box>
    </Stack>
  );
}

function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          mb: 1.35,
          fontSize: 12,
          fontWeight: 650,
          letterSpacing: "0.03em",
          color: "#94A3B8",
          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>
      <Stack spacing={1.75}>{children}</Stack>
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
    ? formatPhoneNumber(patient.phoneNumber, patient.countryCode)
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
  patient: PatientRecord | null;
  open: boolean;
  onClose: () => void;
}) {
  const [transcriptTry, setTranscriptTry] = useState<{
    attempt: PatientTryAttempt;
    tryNumber: number;
  } | null>(null);

  if (!patient) return null;

  const phone = patient.phoneNumber
    ? formatPhoneNumber(patient.phoneNumber, patient.countryCode)
    : "";
  const attempts = patient.tryAttempts;
  const tryCount = Math.max(patient.patientTries, attempts.length);

  function closeDetail() {
    setTranscriptTry(null);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={closeDetail}
      maxWidth={false}
      slotProps={{
        backdrop: { sx: { bgcolor: elevation.backdrop } },
        paper: {
          sx: {
            width: 920,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "min(860px, calc(100vh - 40px))",
            borderRadius: "16px",
            boxShadow: elevation.floating,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {transcriptTry ? (
        <>
          <Box
            sx={{
              position: "relative",
              flexShrink: 0,
              px: { xs: 2.5, sm: 3.5 },
              pt: 2.5,
              pb: 2,
              borderBottom: "1px solid #EEF1F5",
              bgcolor: "#FFFFFF",
            }}
          >
            <IconButton
              aria-label="Close"
              onClick={closeDetail}
              sx={{ position: "absolute", top: 12, right: 12, color: "#64748B" }}
            >
              <X size={18} />
            </IconButton>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start", pr: 5 }}>
              <Box
                component="button"
                type="button"
                aria-label="Back to patient details"
                onClick={() => setTranscriptTry(null)}
                sx={{
                  mt: 0.2,
                  display: "grid",
                  placeItems: "center",
                  width: 32,
                  height: 32,
                  p: 0,
                  border: 0,
                  borderRadius: "8px",
                  bgcolor: "#F3F5F8",
                  color: "#526071",
                  cursor: "pointer",
                  flexShrink: 0,
                  "&:hover": { bgcolor: "#EAF3FB", color: "primary.main" },
                }}
              >
                <ArrowLeft size={16} strokeWidth={2.25} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: "text.primary", letterSpacing: "-0.02em" }}>
                  {transcriptTry.attempt.channel === "text" ? "Text thread" : "Transcript"} · {patient.name}
                </Typography>
                <Typography sx={{ mt: 0.35, fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
                  Try {transcriptTry.tryNumber} ·{" "}
                  {transcriptTry.attempt.channel === "text"
                    ? `Text #${transcriptTry.attempt.id}`
                    : `Call #${transcriptTry.attempt.id}`}
                  {" · "}
                  {formatPatientTryTime(transcriptTry.attempt.datetime)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: { xs: 2.5, sm: 3.5 }, py: 2.5 }}>
            <OutreachTranscriptPanel
              active={open}
              retellCallId={transcriptTry.attempt.retellCallId}
              channel={transcriptTry.attempt.channel}
            />
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexShrink: 0,
              justifyContent: "flex-end",
              alignItems: "center",
              px: { xs: 2.5, sm: 3.5 },
              py: 2,
              borderTop: "1px solid #EEF1F5",
              bgcolor: "#FAFBFC",
            }}
          >
            <Button variant="secondary" onClick={() => setTranscriptTry(null)} sx={{ px: 2.25 }}>
              Back
            </Button>
            <Button onClick={closeDetail} sx={{ px: 2.75, minWidth: 100 }}>
              Close
            </Button>
          </Stack>
        </>
      ) : (
        <>
      <Box
        sx={{
          position: "relative",
          flexShrink: 0,
          px: { xs: 2.5, sm: 3.5 },
          pt: 3,
          pb: 2.5,
          background: "linear-gradient(180deg, #EAF3FB 0%, #FFFFFF 78%)",
          borderBottom: "1px solid #EEF1F5",
        }}
      >
        <IconButton
          aria-label="Close"
          onClick={closeDetail}
          sx={{ position: "absolute", top: 12, right: 12, color: "#64748B" }}
        >
          <X size={18} />
        </IconButton>

        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", pr: 5 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              flexShrink: 0,
              borderRadius: "18px",
              bgcolor: "#2F72B9",
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.02em",
              boxShadow: "0 10px 24px rgb(47 114 185 / 0.22)",
            }}
          >
            {initialsFrom(patient.name)}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "text.primary", lineHeight: 1.2 }}>
              {patient.name}
            </Typography>
            <Typography sx={{ mt: 0.55, fontSize: "var(--font-size-body)", color: "#667085" }}>
              Patient record · outreach history
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 1.1, alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
              <Box
                component="span"
                sx={{
                  px: 1.05,
                  py: 0.25,
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
                  px: 1.05,
                  py: 0.25,
                  borderRadius: "999px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: patient.source === "Excel" ? "#1D5F9A" : "#526071",
                  bgcolor: patient.source === "Excel" ? "#EAF3FB" : "#F0F2F5",
                }}
              >
                {patient.source}
              </Box>
              <CallStatusChip status={patient.callStatus} />
              <Box
                component="span"
                sx={{
                  px: 1.05,
                  py: 0.25,
                  borderRadius: "999px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#1C4E8A",
                  bgcolor: "#E8F1FB",
                }}
              >
                {tryCount === 1 ? "1 try" : `${tryCount} tries`}
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: { xs: 2.5, sm: 3.5 }, py: 2.75 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 650, color: "text.primary" }}>
          Patient details
        </Typography>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            mt: 1.75,
            alignItems: "center",
            px: 1.75,
            py: 1.4,
            borderLeft: "3px solid",
            borderColor: "primary.main",
            bgcolor: "#F5F9FD",
            borderRadius: "0 10px 10px 0",
          }}
        >
          <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>
            <Phone size={16} strokeWidth={2.25} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#8B93A7" }}>Primary phone</Typography>
            <Typography
              sx={{
                mt: 0.15,
                fontSize: 15,
                fontWeight: 650,
                color: "text.primary",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.01em",
              }}
            >
              {phone.trim() || "No phone on file"}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            mt: 2.25,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            columnGap: 4.5,
            rowGap: 2.5,
          }}
        >
          <DetailGroup title="Contact">
            <DetailRow icon={<MapPin size={15} strokeWidth={2} />} label="Address" value={patient.address} />
            <DetailRow
              icon={<CalendarDays size={15} strokeWidth={2} />}
              label="Date of birth"
              value={formatPatientDob(patient.dateOfBirth)}
            />
          </DetailGroup>
          <DetailGroup title="Care">
            <DetailRow icon={<Stethoscope size={15} strokeWidth={2} />} label="Doctor" value={patient.doctor} />
            <DetailRow
              icon={<ClipboardList size={15} strokeWidth={2} />}
              label="Reason for call"
              value={patient.serviceName}
            />
          </DetailGroup>
        </Box>

        <Stack
          direction="row"
          sx={{
            mt: 3,
            mb: 1.35,
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "#8B93A7", textTransform: "uppercase" }}>
              Outreach tries
            </Typography>
            <Typography sx={{ mt: 0.35, fontSize: "var(--font-size-body)", color: "#667085" }}>
              When each call or text was attempted
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 650, color: "#1C4E8A" }}>
            {tryCount === 0 ? "No attempts yet" : `${tryCount} total`}
          </Typography>
        </Stack>

        <Box
          sx={{
            border: "1px solid #E6EAF0",
            borderRadius: "14px",
            overflow: "hidden",
            bgcolor: "#FFFFFF",
          }}
        >
          {attempts.length === 0 ? (
            <Typography sx={{ px: 2.25, py: 3.5, textAlign: "center", color: "#8B93A7", fontSize: "var(--font-size-body)" }}>
              {tryCount > 0
                ? `${tryCount} try${tryCount === 1 ? "" : "ies"} recorded, but timed attempt details are not available yet.`
                : "No outreach attempts have been made for this patient."}
            </Typography>
          ) : (
            <Stack spacing={0} divider={<Box sx={{ borderTop: "1px solid #EEF1F5" }} />}>
              {attempts.map((attempt, index) => {
                const tryNumber = index + 1;
                const channel = channelMeta[attempt.channel];
                const status = callStatusMeta(attempt.status);
                const canViewTranscript =
                  attempt.status === "completed" && Boolean(attempt.retellCallId);
                return (
                  <Stack
                    key={attempt.id}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    sx={{
                      px: 2.25,
                      py: 1.75,
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "space-between",
                      bgcolor: tryNumber === attempts.length ? "#F8FBFF" : "transparent",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", minWidth: 0, flex: 1 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          flexShrink: 0,
                          borderRadius: "10px",
                          bgcolor: "#EAF3FB",
                          color: "#2F72B9",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 13,
                          fontWeight: 750,
                        }}
                      >
                        {tryNumber}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "text.primary", letterSpacing: "-0.01em" }}>
                          Try {tryNumber}
                          <Box component="span" sx={{ fontWeight: 500, color: "#667085" }}>
                            {" "}
                            · {formatPatientTryTime(attempt.datetime)}
                          </Box>
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
                          {attempt.channel === "text" ? `Text #${attempt.id}` : `Call #${attempt.id}`}
                          {attempt.callType ? ` · ${attempt.callType}` : ""}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{
                        alignItems: "center",
                        flexShrink: 0,
                        pl: { xs: 6.5, sm: 0 },
                        minWidth: { sm: 236 },
                        justifyContent: "flex-end",
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          width: 52,
                          px: 1,
                          py: 0.25,
                          borderRadius: "999px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: channel.color,
                          bgcolor: channel.bg,
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {channel.label}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          width: 108,
                          px: 1,
                          py: 0.25,
                          borderRadius: "999px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: status.color,
                          bgcolor: status.bg,
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {status.label}
                      </Box>
                      {canViewTranscript ? (
                        <Box
                          component="button"
                          type="button"
                          aria-label={`View transcript for try ${tryNumber}`}
                          onClick={() => setTranscriptTry({ attempt, tryNumber })}
                          sx={{
                            display: "grid",
                            placeItems: "center",
                            width: 28,
                            height: 28,
                            p: 0,
                            border: 0,
                            borderRadius: "8px",
                            bgcolor: "transparent",
                            color: "#64748B",
                            cursor: "pointer",
                            flexShrink: 0,
                            "&:hover": { bgcolor: "#EAF3FB", color: "primary.main" },
                          }}
                        >
                          <Eye size={16} strokeWidth={2.1} />
                        </Box>
                      ) : (
                        <Box
                          aria-label="No transcript available"
                          sx={{
                            display: "grid",
                            placeItems: "center",
                            width: 28,
                            height: 28,
                            color: "#C0C6D1",
                            flexShrink: 0,
                          }}
                        >
                          <EyeOff size={16} strokeWidth={2.1} />
                        </Box>
                      )}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>

      <Stack
        direction="row"
        sx={{
          flexShrink: 0,
          justifyContent: "flex-end",
          px: { xs: 2.5, sm: 3.5 },
          py: 2,
          borderTop: "1px solid #EEF1F5",
          bgcolor: "#FAFBFC",
        }}
      >
        <Button onClick={closeDetail} sx={{ px: 2.75, minWidth: 120 }}>
          Close
        </Button>
      </Stack>
        </>
      )}
    </Dialog>
  );
}
