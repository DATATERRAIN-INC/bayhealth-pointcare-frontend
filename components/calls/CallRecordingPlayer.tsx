"use client";

import { useEffect, useId, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { Volume2 } from "lucide-react";
import {
  fetchRecordingBlobUrl,
  recordingNeedsAuthFetch,
  resolveRecordingUrl,
} from "@/lib/api/callRecording";

export function CallRecordingPlayer({ url }: { url: string | null | undefined }) {
  const labelId = useId();
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
    <Box
      sx={{
        mb: 2,
        px: 1.5,
        py: 1.35,
        borderRadius: "10px",
        border: "1px solid #D5E2F0",
        bgcolor: "#F8FAFC",
      }}
    >
      <StackLabel id={labelId} />
      {loading ? (
        <Skeleton variant="rounded" height={40} sx={{ mt: 1, bgcolor: "#E9EEF4", borderRadius: "8px" }} />
      ) : error ? (
        <Typography sx={{ mt: 1, fontSize: "var(--font-size-body)", color: "#D92D20" }}>
          Could not load this recording. Try again or contact support if it persists.
        </Typography>
      ) : audioSrc ? (
        <Box
          component="audio"
          controls
          preload="metadata"
          src={audioSrc}
          aria-labelledby={labelId}
          sx={{
            display: "block",
            width: "100%",
            mt: 1,
            height: 40,
          }}
        />
      ) : null}
    </Box>
  );
}

function StackLabel({ id }: { id: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Volume2 size={16} strokeWidth={2.25} color="#1D5F9A" aria-hidden />
      <Typography id={id} component="span" sx={{ fontSize: "var(--font-size-body)", fontWeight: 650, color: "text.primary" }}>
        Call recording
      </Typography>
    </Box>
  );
}
