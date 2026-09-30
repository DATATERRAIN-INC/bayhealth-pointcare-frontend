"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "gap_in_care_settings";

const timezones = [
  "America/New_York (EDT)",
  "America/Chicago (CDT)",
  "America/Denver (MDT)",
  "America/Los_Angeles (PDT)",
] as const;

interface CallingSettings {
  start: string;
  end: string;
  timezone: string;
  recording: boolean;
}

const defaultSettings: CallingSettings = {
  start: "09:00 AM",
  end: "05:00 PM",
  timezone: timezones[0],
  recording: true,
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    bgcolor: "#FFFFFF",
    overflow: "hidden",
    "& fieldset": { borderColor: "#E2E5EC" },
    "&:hover fieldset": { borderColor: "#C5CAD6" },
    "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1 },
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "var(--font-size-body)",
    py: 0,
    height: "100%",
    boxSizing: "border-box",
    "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active":
      {
        WebkitTextFillColor: "#0F172A",
        caretColor: "#0F172A",
        borderRadius: "inherit",
        transition: "background-color 99999s ease-out 0s",
        boxShadow: "0 0 0 1000px #FFFFFF inset",
        WebkitBoxShadow: "0 0 0 1000px #FFFFFF inset",
      },
  },
} as const;

const labelSx = {
  mb: 0.65,
  fontSize: "var(--font-size-body)",
  fontWeight: 600,
  color: "#5C6478",
  letterSpacing: "0.01em",
} as const;

const surface = {
  bgcolor: "#FFFFFF",
  border: "1px solid #E8EAEE",
  borderRadius: "12px",
} as const;

function loadSettings(): CallingSettings {
  if (typeof window === "undefined") return defaultSettings;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultSettings;
  try {
    return { ...defaultSettings, ...(JSON.parse(raw) as CallingSettings) };
  } catch {
    return defaultSettings;
  }
}

function minutesFromLabel(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  const minutes = Number(match[2]);
  if (minutes > 59) return null;
  return hours * 60 + minutes;
}

function windowSummary(settings: CallingSettings): string {
  const start = minutesFromLabel(settings.start);
  const end = minutesFromLabel(settings.end);
  const zone = settings.timezone.match(/\(([^)]+)\)/)?.[1] ?? "local";
  if (start === null || end === null) {
    return "Enter a start and end time like 09:00 AM.";
  }
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;
  const hours = Math.round((diff / 60) * 10) / 10;
  const hourLabel = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `Calls run ${settings.start.replace(/^0/, "")} – ${settings.end.replace(/^0/, "")} ${zone} (${hourLabel} hours). Calls outside this window wait until it opens.`;
}

export function SettingsWorkspace() {
  const [saved, setSaved] = useState<CallingSettings>(defaultSettings);
  const [draft, setDraft] = useState<CallingSettings>(defaultSettings);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const stored = loadSettings();
    setSaved(stored);
    setDraft(stored);
  }, []);

  const summary = useMemo(() => windowSummary(draft), [draft]);

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setSaved(draft);
    setNotice("Settings saved.");
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "text.primary",
              lineHeight: 1.2,
            }}
          >
            Settings
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: "var(--font-size-body)", color: "#6B7280", lineHeight: 1.45 }}>
            Basic calling options for the Gap in Care module.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
          {notice ? (
            <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 500, color: "#1F7A4D", display: { xs: "none", md: "block" } }}>
              {notice}
            </Typography>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(saved);
              setNotice("");
            }}
            sx={{ px: 2 }}
          >
            Discard changes
          </Button>
          <Button onClick={save} sx={{ px: 2.25 }}>
            Save settings
          </Button>
        </Stack>
      </Stack>

      {notice ? (
        <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 500, color: "#1F7A4D", display: { md: "none" } }}>
          {notice}
        </Typography>
      ) : null}

      <Stack spacing={2}>
            <Box sx={{ ...surface, overflow: "hidden" }}>
              <Box sx={{ px: 2.5, pt: 2.1, pb: 1.75, borderBottom: "1px solid #F0F2F5" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 650, color: "text.primary", letterSpacing: "-0.01em" }}>
                  Calling window
                </Typography>
                <Typography sx={{ mt: 0.4, fontSize: "var(--font-size-body)", color: "#6B7280", lineHeight: 1.45 }}>
                  Calls are only placed between these times, in the selected timezone.
                </Typography>
              </Box>

              <Box sx={{ px: 2.5, py: 2.25 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1.25fr" },
                    gap: 1.75,
                  }}
                >
                  <Box>
                    <Typography sx={labelSx}>Start time</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={draft.start}
                      onChange={(event) => {
                        setNotice("");
                        setDraft((current) => ({ ...current, start: event.target.value }));
                      }}
                      sx={fieldSx}
                    />
                  </Box>
                  <Box>
                    <Typography sx={labelSx}>End time</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={draft.end}
                      onChange={(event) => {
                        setNotice("");
                        setDraft((current) => ({ ...current, end: event.target.value }));
                      }}
                      sx={fieldSx}
                    />
                  </Box>
                  <Box>
                    <Typography sx={labelSx}>Timezone</Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={draft.timezone}
                      onChange={(event) => {
                        setNotice("");
                        setDraft((current) => ({ ...current, timezone: event.target.value }));
                      }}
                      sx={fieldSx}
                      slotProps={{
                        select: {
                          IconComponent: () => (
                            <ChevronDown size={15} style={{ marginRight: 10, color: "#6B7280" }} />
                          ),
                        },
                      }}
                    >
                      {timezones.map((zone) => (
                        <MenuItem key={zone} value={zone}>
                          {zone}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: "8px",
                    bgcolor: "#F7F8FA",
                    border: "1px solid #EEF0F4",
                  }}
                >
                  <Typography sx={{ fontSize: "var(--font-size-body)", color: "#5C6478", lineHeight: 1.45 }}>{summary}</Typography>
                </Box>
              </Box>
            </Box>

            <Stack
              direction="row"
              sx={{
                ...surface,
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                px: 2.5,
                py: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 650, color: "text.primary", letterSpacing: "-0.01em" }}>
                  Call recording
                </Typography>
                <Typography sx={{ mt: 0.4, fontSize: "var(--font-size-body)", color: "#6B7280", lineHeight: 1.45 }}>
                  Record calls so they can be reviewed later. Transcripts are shown either way.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                <Switch
                  checked={draft.recording}
                  onChange={(event) => {
                    setNotice("");
                    setDraft((current) => ({ ...current, recording: event.target.checked }));
                  }}
                  sx={{
                    width: 42,
                    height: 24,
                    p: 0,
                    "& .MuiSwitch-switchBase": {
                      p: "2px",
                      color: "#FFFFFF",
                      "&.Mui-checked": {
                        transform: "translateX(18px)",
                        color: "#FFFFFF",
                        "& + .MuiSwitch-track": {
                          bgcolor: "primary.main",
                          opacity: 1,
                        },
                      },
                    },
                    "& .MuiSwitch-thumb": {
                      width: 20,
                      height: 20,
                      bgcolor: "#FFFFFF",
                      boxShadow: "0 1px 2px rgb(15 23 42 / 0.18)",
                    },
                    "& .MuiSwitch-track": {
                      borderRadius: 12,
                      bgcolor: "#D5D9E2",
                      opacity: 1,
                    },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "var(--font-size-body)",
                    fontWeight: 600,
                    color: draft.recording ? "primary.main" : "#6B7280",
                    minWidth: 24,
                  }}
                >
                  {draft.recording ? "On" : "Off"}
                </Typography>
              </Stack>
            </Stack>
      </Stack>
    </Stack>
  );
}
