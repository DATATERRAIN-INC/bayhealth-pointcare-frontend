"use client";

import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  channelMeta,
  type OutreachCall,
  type OutreachChannel,
} from "@/data/gapCalls";
import { CallStatusChip } from "@/components/shared/CallStatusChip";
import { CallRecordingPlayer } from "@/components/calls/CallRecordingPlayer";
import { elevation } from "@/lib/theme/tokens";

export const DESKTOP_PANEL_HEIGHT = 640;

const surface = {
  bgcolor: "#FFFFFF",
  border: "1px solid #E5E9EF",
  borderRadius: "10px",
  boxShadow: elevation.floatingPanel,
} as const;

export function ChannelChip({ channel }: { channel: OutreachChannel }) {
  const meta = channelMeta[channel];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.1,
        py: 0.35,
        borderRadius: "999px",
        bgcolor: meta.bg,
        color: meta.color,
        fontSize: "var(--font-size-body)",
        fontWeight: 600,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {meta.label}
    </Box>
  );
}

function transcriptText(call: OutreachCall): string {
  return call.messages
    .map((line) => (line.time ? `${line.speaker} · ${line.time}\n${line.text}` : `${line.speaker}\n${line.text}`))
    .join("\n\n");
}

function copyWithTextarea(value: string) {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.focus();
  area.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(area);
  if (!copied) {
    throw new Error("Copy failed");
  }
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText && document.hasFocus()) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Clipboard can reject when the document is not focused.
    }
  }
  copyWithTextarea(value);
}

export function TranscriptBody({
  call,
  loading = false,
  error = false,
}: {
  call: OutreachCall;
  loading?: boolean;
  error?: boolean;
}) {
  if (call.messages.length === 0) {
    const message = loading
      ? call.channel === "text"
        ? "Loading messages…"
        : "Loading transcript…"
      : error
        ? call.channel === "text"
          ? "Could not load this text thread."
          : "Could not load this transcript."
        : call.channel === "call" && call.status === "in_progress"
          ? "Transcript available after the call ends."
          : call.channel === "text"
            ? "No messages for this text."
            : "No transcript for this call.";
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
          px: 2,
        }}
      >
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7", textAlign: "center" }}>
          {message}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.75}>
      {call.messages.map((line, index) => {
        const fromPatient = line.speaker === "Patient";
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

export function TranscriptPanel({
  call,
  loading = false,
  error = false,
  onClose,
}: {
  call: OutreachCall | undefined;
  loading?: boolean;
  error?: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!call || call.messages.length === 0) return;
    try {
      await copyText(transcriptText(call));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (!call) {
    return (
      <Box
        sx={{
          ...surface,
          height: DESKTOP_PANEL_HEIGHT,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2.25, pt: 2, pb: 1.75, borderBottom: "1px solid #F0F2F5" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 650, color: "text.primary", letterSpacing: "-0.01em" }}>
            Transcript
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2.25,
            py: 2,
          }}
        >
          <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7", textAlign: "center" }}>
            Select a call to view its transcript.
          </Typography>
        </Box>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.25,
            py: 1.5,
            borderTop: "1px solid #F0F2F5",
            bgcolor: "#FAFBFC",
          }}
        >
          <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7" }}>No call selected</Typography>
          <Button variant="secondary" size="sm" disabled sx={{ px: 1.75 }}>
            Copy transcript
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...surface,
        height: DESKTOP_PANEL_HEIGHT,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          px: 2.25,
          pt: 2,
          pb: 1.75,
          borderBottom: "1px solid #F0F2F5",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 650, color: "text.primary", letterSpacing: "-0.01em" }}>
            {call.channel === "text" ? "Text thread" : "Transcript"} · {call.patientName}
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: "var(--font-size-body)", color: "#8B93A7", lineHeight: 1.4 }}>
            {call.channel === "text" ? `Text #${call.callNumber}` : `Call #${call.callNumber}`} · {call.dateLabel}
            {call.windowLabel ? ` · ${call.windowLabel}` : ""}
            {call.channel === "call" && (call.hasTranscript || call.messages.length > 0) ? ` · ${call.duration}` : ""}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignItems: "center" }}>
          <ChannelChip channel={call.channel} />
          <CallStatusChip status={call.status} />
          <Box
            component="button"
            type="button"
            aria-label="Close transcript"
            onClick={onClose}
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
              "&:hover": { bgcolor: "#F1F4F8" },
            }}
          >
            <X size={16} />
          </Box>
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2.25, py: 2 }}>
        {call.channel === "call" && call.recordingUrl ? <CallRecordingPlayer url={call.recordingUrl} /> : null}
        <TranscriptBody call={call} loading={loading} error={error} />
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.25,
          py: 1.5,
          borderTop: "1px solid #F0F2F5",
          bgcolor: "#FAFBFC",
        }}
      >
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
          {call.messages.length > 0
            ? `End of transcript · ${call.messages.length} messages`
            : loading
              ? "Loading transcript…"
              : "Transcript pending"}
        </Typography>
        <Button
          variant="secondary"
          size="sm"
          disabled={call.messages.length === 0}
          onClick={() => void onCopy()}
          sx={{ px: 1.75 }}
        >
          {copied ? "Copied" : "Copy transcript"}
        </Button>
      </Stack>
    </Box>
  );
}
