"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SuccessDialog } from "@/components/shared/SuccessDialog";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  type SettingsPayload,
} from "@/lib/api/settingsApi";

const timezones = [
  { value: "America/New_York", label: "America/New_York (EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CDT)" },
  { value: "America/Denver", label: "America/Denver (MDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PDT)" },
] as const;

const COUNTRY_CODES = ["+1", "+44", "+91", "+61", "+81"] as const;

interface CallingSettings {
  callsEnabled: boolean;
  start: string;
  end: string;
  timezone: string;
  maxCallsPerRun: string;
  recording: boolean;
  liveAgentCountryCode: string;
  liveAgentNumber: string;
}

const defaultSettings: CallingSettings = {
  callsEnabled: false,
  start: "09:00 AM",
  end: "05:00 PM",
  timezone: timezones[0].value,
  maxCallsPerRun: "5",
  recording: true,
  liveAgentCountryCode: "+1",
  liveAgentNumber: "",
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

const timeFieldSx = {
  ...fieldSx,
  "& .MuiOutlinedInput-root": {
    ...fieldSx["& .MuiOutlinedInput-root"],
    minHeight: 40,
  },
  "& input[type='time']": {
    minHeight: 40,
  },
  "& input[type='time']::-webkit-calendar-picker-indicator": {
    cursor: "pointer",
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

const switchSx = {
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
} as const;

function apiTimeToLabel(value: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return value;
  const hours24 = Number(match[1]);
  const minutes = match[2];
  if (hours24 > 23) return value;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, "0")}:${minutes} ${suffix}`;
}

function labelToApiTime(value: string): string | null {
  const twelveHour = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  if (twelveHour) {
    const hour = Number(twelveHour[1]);
    const minutes = Number(twelveHour[2]);
    if (hour < 1 || hour > 12 || minutes > 59) return null;
    let hours = hour % 12;
    if (twelveHour[3].toUpperCase() === "PM") hours += 12;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  }

  const twentyFour = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!twentyFour) return null;
  const hours = Number(twentyFour[1]);
  const minutes = Number(twentyFour[2]);
  const seconds = twentyFour[3] ? Number(twentyFour[3]) : 0;
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function normalizeTimezone(value: string): string {
  const trimmed = value.trim();
  const known = timezones.find(
    (zone) => zone.value === trimmed || zone.label === trimmed || trimmed.startsWith(`${zone.value} `),
  );
  return known?.value ?? trimmed.replace(/\s+\([^)]+\)$/, "");
}

function toDraft(payload: SettingsPayload): CallingSettings {
  return {
    callsEnabled: payload.calls_enabled,
    start: apiTimeToLabel(payload.start_time),
    end: apiTimeToLabel(payload.end_time),
    timezone: normalizeTimezone(payload.timezone),
    maxCallsPerRun: String(payload.max_calls_per_run),
    recording: payload.recording_enabled,
    liveAgentCountryCode: payload.live_agent_country_code || "+1",
    liveAgentNumber: payload.live_agent_number || "",
  };
}

function toPayload(settings: CallingSettings): { payload: SettingsPayload } | { error: string } {
  const start = labelToApiTime(settings.start);
  const end = labelToApiTime(settings.end);
  if (!start || !end) {
    return { error: "Choose a start time and an end time." };
  }
  const maxCalls = Number(settings.maxCallsPerRun);
  if (!Number.isInteger(maxCalls) || maxCalls < 1) {
    return { error: "Enter a whole number of calls per run." };
  }
  const timezone = settings.timezone.trim();
  if (!timezone) {
    return { error: "Choose a timezone." };
  }
  const liveAgentNumber = settings.liveAgentNumber.trim();
  if (!liveAgentNumber) {
    return { error: "Live agent phone is required." };
  }
  return {
    payload: {
      calls_enabled: settings.callsEnabled,
      recording_enabled: settings.recording,
      start_time: start,
      end_time: end,
      timezone,
      max_calls_per_run: maxCalls,
      live_agent_country_code: settings.liveAgentCountryCode || "+1",
      live_agent_number: liveAgentNumber,
    },
  };
}

function labelToTimeInput(value: string): string {
  const apiTime = labelToApiTime(value);
  return apiTime ? apiTime.slice(0, 5) : "";
}

function minutesFromLabel(value: string): number | null {
  const apiTime = labelToApiTime(value);
  if (!apiTime) return null;
  const [hours, minutes] = apiTime.split(":").map(Number);
  return hours * 60 + minutes;
}

function windowSummary(settings: CallingSettings): string {
  const start = minutesFromLabel(settings.start);
  const end = minutesFromLabel(settings.end);
  const zone =
    timezones.find((item) => item.value === settings.timezone)?.label.match(/\(([^)]+)\)/)?.[1] ??
    "local";
  if (start === null || end === null) {
    return "Choose a start time and an end time.";
  }
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;
  const hours = Math.round((diff / 60) * 10) / 10;
  const hourLabel = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  const status = settings.callsEnabled
    ? `Up to ${settings.maxCallsPerRun || "—"} calls are placed per run.`
    : "Outreach calls are turned off.";
  return `Calls run ${settings.start.replace(/^0/, "")} – ${settings.end.replace(/^0/, "")} ${zone} (${hourLabel} hours). ${status} Calls outside this window wait until it opens.`;
}

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      const record = data as { detail?: unknown; message?: unknown };
      if (typeof record.detail === "string" && record.detail.trim()) return record.detail;
      if (typeof record.message === "string" && record.message.trim()) return record.message;
    }
  }
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") {
      return "Could not reach the settings API.";
    }
  }
  return fallback;
}

function SettingsSections() {
  return (
    <Box sx={{ ...surface, p: 1.25 }}>
      <Typography
        sx={{
          px: 1.25,
          pt: 0.5,
          pb: 1,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#98A2B3",
        }}
      >
        SECTIONS
      </Typography>
      <Box
        sx={{
          px: 1.25,
          py: 1,
          borderRadius: "8px",
          bgcolor: "#EAF3FB",
          color: "text.primary",
          fontSize: "var(--font-size-body)",
          fontWeight: 600,
        }}
      >
        Calling
      </Box>
      <Typography
        sx={{
          px: 1.25,
          py: 1,
          fontSize: "var(--font-size-body)",
          fontWeight: 500,
          color: "#98A2B3",
        }}
      >
        More settings (coming)
      </Typography>
    </Box>
  );
}

function SettingsSkeleton() {
  const bone = { bgcolor: "#E9EEF4", borderRadius: "8px" } as const;

  return (
    <Stack spacing={2} sx={{ flex: 1 }}>
      <Stack
        direction="row"
        sx={{ ...surface, alignItems: "center", justifyContent: "space-between", gap: 2, px: 2.5, py: 2 }}
      >
        <Box sx={{ flex: 1 }}>
          <Skeleton animation="wave" variant="rounded" width={160} height={18} sx={bone} />
          <Skeleton animation="wave" variant="rounded" width="70%" height={14} sx={{ ...bone, mt: 1 }} />
        </Box>
        <Skeleton animation="wave" variant="rounded" width={72} height={24} sx={bone} />
      </Stack>

      <Box sx={{ ...surface, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, pt: 2.1, pb: 1.75, borderBottom: "1px solid #F0F2F5" }}>
          <Skeleton animation="wave" variant="rounded" width={140} height={18} sx={bone} />
          <Skeleton animation="wave" variant="rounded" width="80%" height={14} sx={{ ...bone, mt: 1 }} />
        </Box>
        <Box sx={{ px: 2.5, py: 2.25 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.75,
            }}
          >
            {Array.from({ length: 4 }, (_, index) => (
              <Box key={`settings-field-${index}`}>
                <Skeleton animation="wave" variant="rounded" width={110} height={14} sx={bone} />
                <Skeleton animation="wave" variant="rounded" height={40} sx={{ ...bone, mt: 0.75 }} />
              </Box>
            ))}
          </Box>
          <Skeleton animation="wave" variant="rounded" height={44} sx={{ ...bone, mt: 2 }} />
        </Box>
      </Box>

      <Stack
        direction="row"
        sx={{ ...surface, alignItems: "center", justifyContent: "space-between", gap: 2, px: 2.5, py: 2 }}
      >
        <Box sx={{ flex: 1 }}>
          <Skeleton animation="wave" variant="rounded" width={140} height={18} sx={bone} />
          <Skeleton animation="wave" variant="rounded" width="75%" height={14} sx={{ ...bone, mt: 1 }} />
        </Box>
        <Skeleton animation="wave" variant="rounded" width={72} height={24} sx={bone} />
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
        <Skeleton animation="wave" variant="rounded" width={148} height={40} sx={bone} />
        <Skeleton animation="wave" variant="rounded" width={132} height={40} sx={bone} />
      </Stack>
    </Stack>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
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
          {title}
        </Typography>
        <Typography sx={{ mt: 0.4, fontSize: "var(--font-size-body)", color: "#6B7280", lineHeight: 1.45 }}>
          {description}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
        <Switch checked={checked} onChange={(event) => onChange(event.target.checked)} sx={switchSx} />
        <Typography
          sx={{
            fontSize: "var(--font-size-body)",
            fontWeight: 600,
            color: checked ? "primary.main" : "#6B7280",
            minWidth: 24,
          }}
        >
          {checked ? "On" : "Off"}
        </Typography>
      </Stack>
    </Stack>
  );
}

export function SettingsWorkspace() {
  const { data, isUninitialized, isLoading, isFetching, isError, error } = useGetSettingsQuery();
  const showSkeleton = !data && !isError && (isUninitialized || isLoading || isFetching);
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();
  const [saved, setSaved] = useState<CallingSettings>(defaultSettings);
  const [draft, setDraft] = useState<CallingSettings>(defaultSettings);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const closeSuccess = useCallback(() => setSuccessOpen(false), []);
  const hydrated = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    if (!data || hydrated.current) return;
    hydrated.current = true;
    const next = toDraft(data);
    setSaved(next);
    if (!dirty.current) setDraft(next);
  }, [data]);

  const summary = useMemo(() => windowSummary(draft), [draft]);
  const timezoneOptions = useMemo(() => {
    if (timezones.some((zone) => zone.value === draft.timezone)) return [...timezones];
    return [{ value: draft.timezone, label: draft.timezone }, ...timezones];
  }, [draft.timezone]);

  function updateDraft(patch: Partial<CallingSettings>) {
    dirty.current = true;
    setNotice("");
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function save() {
    const result = toPayload(draft);
    if ("error" in result) {
      setNoticeError(true);
      setNotice(result.error);
      return;
    }
    hydrated.current = true;
    try {
      const updated = await updateSettings(result.payload).unwrap();
      const next = toDraft(updated);
      dirty.current = false;
      setSaved(next);
      setDraft(next);
      setNoticeError(false);
      setNotice("");
      setSuccessOpen(true);
    } catch (saveError) {
      setNoticeError(true);
      setNotice(errorMessage(saveError, "Could not save settings. Please try again."));
    }
  }

  return (
    <Stack spacing={2} sx={{ minHeight: "calc(100dvh - 116px)" }}>
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
          {showSkeleton
            ? "Loading calling options…"
            : "Basic calling options for the Gap in Care module."}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" },
          gap: 2,
          alignItems: "start",
          flex: 1,
        }}
      >
        <SettingsSections />
        <Stack spacing={2} sx={{ minWidth: 0 }}>
      {showSkeleton ? <SettingsSkeleton /> : null}

      {!showSkeleton && isError && !notice ? (
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#D14343", lineHeight: 1.45 }}>
          {errorMessage(error, "Could not load settings. You can still update them and save.")}
        </Typography>
      ) : null}

      {!showSkeleton ? (
      <>
      <Stack spacing={2} sx={{ flex: 1 }}>
        <SettingToggle
          title="Outreach calls"
          description="Place outreach calls during the calling window."
          checked={draft.callsEnabled}
          onChange={(callsEnabled) => updateDraft({ callsEnabled })}
        />

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
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.75,
              }}
            >
              <Box>
                <Typography sx={labelSx}>Start time</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  value={labelToTimeInput(draft.start)}
                  onChange={(event) => updateDraft({ start: event.target.value ? apiTimeToLabel(event.target.value) : "" })}
                  sx={timeFieldSx}
                  slotProps={{ htmlInput: { step: 60 } }}
                />
              </Box>
              <Box>
                <Typography sx={labelSx}>End time</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  value={labelToTimeInput(draft.end)}
                  onChange={(event) => updateDraft({ end: event.target.value ? apiTimeToLabel(event.target.value) : "" })}
                  sx={timeFieldSx}
                  slotProps={{ htmlInput: { step: 60 } }}
                />
              </Box>
              <Box>
                <Typography sx={labelSx}>Timezone</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={draft.timezone}
                  onChange={(event) => updateDraft({ timezone: event.target.value })}
                  sx={fieldSx}
                  slotProps={{
                    select: {
                      IconComponent: () => (
                        <ChevronDown size={15} style={{ marginRight: 10, color: "#6B7280" }} />
                      ),
                    },
                  }}
                >
                  {timezoneOptions.map((zone) => (
                    <MenuItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={labelSx}>Max calls per run</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={draft.maxCallsPerRun}
                  onChange={(event) => updateDraft({ maxCallsPerRun: event.target.value })}
                  sx={fieldSx}
                  slotProps={{ htmlInput: { min: 1, step: 1, inputMode: "numeric" } }}
                />
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
              <Typography sx={{ fontSize: "var(--font-size-body)", color: "#5C6478", lineHeight: 1.45 }}>
                {summary}
              </Typography>
            </Box>
          </Box>
        </Box>

        <SettingToggle
          title="Call recording"
          description="Record calls so they can be reviewed later. Transcripts are shown either way."
          checked={draft.recording}
          onChange={(recording) => updateDraft({ recording })}
        />

        <Box sx={{ ...surface, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, pt: 2.1, pb: 1.75, borderBottom: "1px solid #F0F2F5" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 650, color: "text.primary", letterSpacing: "-0.01em" }}>
              Live agent phone
            </Typography>
            <Typography sx={{ mt: 0.4, fontSize: "var(--font-size-body)", color: "#6B7280", lineHeight: 1.45 }}>
              Default number used when a call needs to transfer to a live agent.
            </Typography>
          </Box>
          <Box sx={{ px: 2.5, py: 2.25, maxWidth: 420 }}>
            <Typography sx={labelSx}>Phone number</Typography>
            <TextField
              fullWidth
              size="small"
              value={draft.liveAgentNumber}
              placeholder="Phone number"
              onChange={(event) =>
                updateDraft({ liveAgentNumber: event.target.value.replace(/\D/g, "") })
              }
              sx={{
                ...fieldSx,
                "& .MuiOutlinedInput-root": {
                  ...fieldSx["& .MuiOutlinedInput-root"],
                  pl: 0,
                  minHeight: 40,
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 0 }}>
                      <TextField
                        select
                        size="small"
                        value={
                          (COUNTRY_CODES as readonly string[]).includes(draft.liveAgentCountryCode)
                            ? draft.liveAgentCountryCode
                            : draft.liveAgentCountryCode || "+1"
                        }
                        onChange={(event) => updateDraft({ liveAgentCountryCode: event.target.value })}
                        variant="standard"
                        slotProps={{
                          select: {
                            disableUnderline: true,
                            IconComponent: () => (
                              <ChevronDown size={14} style={{ marginRight: 4, color: "#6B7280" }} />
                            ),
                          },
                          input: {
                            sx: {
                              pl: 1.25,
                              pr: 0.5,
                              minWidth: 62,
                              fontSize: "var(--font-size-body)",
                              fontWeight: 600,
                            },
                          },
                        }}
                        sx={{
                          "& .MuiInputBase-root": {
                            minHeight: 40,
                            bgcolor: "#F7F8FA",
                            borderRight: "1px solid #E2E5EC",
                          },
                        }}
                      >
                        {(
                          (COUNTRY_CODES as readonly string[]).includes(draft.liveAgentCountryCode)
                            ? COUNTRY_CODES
                            : [draft.liveAgentCountryCode || "+1", ...COUNTRY_CODES]
                        ).map((code) => (
                          <MenuItem key={code} value={code}>
                            {code}
                          </MenuItem>
                        ))}
                      </TextField>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </Box>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" }, justifyContent: "flex-end" }}
      >
        {notice ? (
          <Typography
            sx={{
              fontSize: "var(--font-size-body)",
              fontWeight: 500,
              color: noticeError ? "#D14343" : "#1F7A4D",
              mr: { sm: "auto" },
            }}
          >
            {notice}
          </Typography>
        ) : null}
        <Button
          variant="secondary"
          disabled={isSaving}
          onClick={() => {
            dirty.current = false;
            setDraft(saved);
            setNotice("");
          }}
          sx={{ px: 2, width: { xs: "100%", sm: "auto" } }}
        >
          Discard changes
        </Button>
        <Button
          onClick={() => void save()}
          loading={isSaving}
          disabled={isSaving}
          sx={{ px: 2.25, width: { xs: "100%", sm: "auto" } }}
        >
          Save settings
        </Button>
      </Stack>
      </>
      ) : null}
        </Stack>
      </Box>

      <SuccessDialog open={successOpen} message="Settings saved successfully." onClose={closeSuccess} />
    </Stack>
  );
}
