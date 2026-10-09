"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronDown, Volume2 } from "lucide-react";
import {
  fetchRecordingBlobUrl,
  recordingNeedsAuthFetch,
  resolveRecordingUrl,
} from "@/lib/api/callRecording";

export function CallRecordingPlayer({
  url,
  label = "AI Call recording",
}: {
  url: string | null | undefined;
  label?: string;
}) {
  const trimmed = url?.trim() ?? "";
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!trimmed) {
      setAudioSrc(null);
      setLoading(false);
      setError(false);
      return;
    }

    if (!recordingNeedsAuthFetch(trimmed)) {
      setAudioSrc(resolveRecordingUrl(trimmed));
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(false);
    setAudioSrc(null);

    void fetchRecordingBlobUrl(trimmed)
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        objectUrl = blobUrl;
        setAudioSrc(blobUrl);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [trimmed]);

  if (!trimmed) return null;

  return (
    <Box>
      {loading ? (
        <Skeleton variant="rounded" height={40} sx={{ bgcolor: "#E9EEF4", borderRadius: "8px" }} />
      ) : error ? (
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#D92D20" }}>
          Could not load this recording. Try again or contact support if it persists.
        </Typography>
      ) : audioSrc ? (
        <Box
          component="audio"
          controls
          preload="metadata"
          src={audioSrc}
          aria-label={label}
          sx={{
            display: "block",
            width: "100%",
            height: 40,
          }}
        />
      ) : null}
    </Box>
  );
}

function RecordingAccordion({
  title,
  url,
  defaultExpanded = false,
}: {
  title: string;
  url: string;
  defaultExpanded?: boolean;
}) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        mb: 0,
        border: "1px solid #D5E2F0",
        borderRadius: "10px !important",
        bgcolor: "#F8FAFC",
        "&:before": { display: "none" },
        "&.Mui-expanded": { margin: 0 },
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={<ChevronDown size={18} strokeWidth={2.25} color="#64748B" />}
        sx={{
          minHeight: 48,
          px: 1.5,
          py: 0,
          "& .MuiAccordionSummary-content": {
            my: 1.25,
            alignItems: "center",
            gap: 0.75,
          },
        }}
      >
        <Volume2 size={16} strokeWidth={2.25} color="#1D5F9A" aria-hidden />
        <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 650, color: "text.primary" }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
        <CallRecordingPlayer url={url} label={title} />
      </AccordionDetails>
    </Accordion>
  );
}

/** Renders AI/call and live-agent recordings in titled accordions when URLs are present. */
export function CallRecordingsList({
  recordingUrl,
  liveAgentRecordingUrl,
}: {
  recordingUrl?: string | null;
  liveAgentRecordingUrl?: string | null;
}) {
  const callUrl = recordingUrl?.trim() ?? "";
  const liveAgentUrl = liveAgentRecordingUrl?.trim() ?? "";
  if (!callUrl && !liveAgentUrl) return null;

  return (
    <Stack spacing={1.25} sx={{ mb: 2 }}>
      {callUrl ? <RecordingAccordion title="AI Call recording" url={callUrl} /> : null}
      {liveAgentUrl ? <RecordingAccordion title="Live agent recording" url={liveAgentUrl} /> : null}
    </Stack>
  );
}
