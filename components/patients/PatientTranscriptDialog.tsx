"use client";

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { OutreachChannel } from "@/data/gapCalls";
import { formatCallDuration, patientOutreachLabel, type PatientRecord } from "@/data/gapPatients";
import { elevation } from "@/lib/theme/tokens";
import { CallRecordingPlayer } from "@/components/calls/CallRecordingPlayer";
import { useGetCallTranscriptQuery } from "@/lib/api/callsApi";

export function OutreachTranscriptPanel({
  active,
  retellCallId,
  channel,
}: {
  active: boolean;
  retellCallId: string;
  channel: OutreachChannel;
}) {
  const canFetch = Boolean(retellCallId.trim());
  const { data, isLoading, isError, isFetching } = useGetCallTranscriptQuery(retellCallId.trim(), {
    skip: !active || !canFetch,
  });
  const lines = data?.transcript ?? [];
  const recordingUrl = data?.recordingUrl ?? null;
  const loading = (isLoading || isFetching) && lines.length === 0 && !recordingUrl;

  if (loading) {
    return (
      <Stack spacing={1.25}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={`outreach-transcript-skeleton-${index}`}
            variant="rounded"
            height={52}
            sx={{ bgcolor: "#E9EEF4", borderRadius: "10px", maxWidth: index % 2 === 0 ? "88%" : "72%" }}
          />
        ))}
      </Stack>
    );
  }

  if (isError) {
    return (
      <EmptyMessage
        text={channel === "text" ? "Could not load this text thread." : "Could not load this transcript."}
      />
    );
  }

  if (!canFetch) {
    return (
      <EmptyMessage
        text={
          channel === "text"
            ? "No message thread is linked to this attempt yet."
            : "No transcript is linked to this attempt yet."
        }
      />
    );
  }

  if (lines.length === 0 && !recordingUrl) {
    return (
      <EmptyMessage
        text={channel === "text" ? "No messages for this text." : "No transcript for this call."}
      />
    );
  }

  return (
    <Stack spacing={1.75}>
      {channel === "call" && recordingUrl ? <CallRecordingPlayer url={recordingUrl} /> : null}
      {lines.map((line, index) => {
        const fromPatient = line.fromPatient;
        return (
          <Box
            key={`${index}-${line.speaker}`}
            sx={{ alignSelf: fromPatient ? "flex-end" : "flex-start", maxWidth: "90%" }}
          >
            <Typography
              sx={{
                mb: 0.5,
                fontSize: "var(--font-size-body)",
                fontWeight: 500,
                color: "#8B93A7",
                textAlign: fromPatient ? "right" : "left",
              }}
            >
              {line.time ? `${line.speaker} · ${line.time}` : line.speaker}
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 1.15,
                borderRadius: "10px",
                bgcolor: fromPatient ? "#F3F4F6" : "#EAF3FB",
                color: "text.primary",
                fontSize: "var(--font-size-body)",
                lineHeight: 1.45,
              }}
            >
              {line.text}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

export function OutreachTranscriptDialog({
  open,
  onClose,
  patientName,
  retellCallId,
  channel,
  subtitle,
  durationLabel,
}: {
  open: boolean;
  onClose: () => void;
  patientName: string;
  retellCallId: string;
  channel: OutreachChannel;
  subtitle: string;
  durationLabel?: string;
}) {
  const duration = durationLabel?.trim() || "—";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        backdrop: { sx: { bgcolor: elevation.backdrop } },
        paper: {
          sx: {
            width: 640,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "min(680px, calc(100vh - 48px))",
            borderRadius: "14px",
            boxShadow: elevation.floating,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle sx={{ px: 2.5, py: 1.75, pr: 6, borderBottom: "1px solid #EEF1F5" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.primary", lineHeight: 1.3 }}>
          {channel === "text" ? "Text thread" : "Transcript"} · {patientName}
        </Typography>
        <Typography sx={{ mt: 0.35, fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
          {subtitle}
          {channel === "call" ? ` · ${duration}` : ""}
        </Typography>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", top: 10, right: 10, color: "#64748B" }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, py: 2, flex: 1, minHeight: 280, overflowY: "auto" }}>
        <OutreachTranscriptPanel active={open} retellCallId={retellCallId} channel={channel} />
      </DialogContent>

      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1.5,
          px: 2.5,
          py: 1.75,
          borderTop: "1px solid #EEF1F5",
        }}
      >
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7", fontWeight: 600 }}>
          Duration · {duration}
        </Typography>
        <Button variant="secondary" onClick={onClose} sx={{ px: 2.25 }}>
          Close
        </Button>
      </Stack>
    </Dialog>
  );
}

export function PatientTranscriptDialog({
  patient,
  open,
  onClose,
}: {
  patient: PatientRecord;
  open: boolean;
  onClose: () => void;
}) {
  const channel = patient.lastCallChannel ?? "call";
  return (
    <OutreachTranscriptDialog
      open={open}
      onClose={onClose}
      patientName={patient.name}
      retellCallId={patient.retellCallId}
      channel={channel}
      subtitle={patientOutreachLabel(patient) ?? "Transcript"}
      durationLabel={formatCallDuration(patient.durationSeconds)}
    />
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 160, px: 2 }}>
      <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7", textAlign: "center" }}>
        {text}
      </Typography>
    </Box>
  );
}
