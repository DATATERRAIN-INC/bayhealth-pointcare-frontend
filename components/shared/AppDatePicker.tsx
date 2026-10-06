"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type { DateValidationError } from "@mui/x-date-pickers/models";
import { elevation, fontFamily } from "@/lib/theme/tokens";

export interface AppDatePickerProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  disableFuture?: boolean;
  disablePast?: boolean;
  fullWidth?: boolean;
}

function toDayjs(value: Date | null): Dayjs | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  return dayjs(value);
}

function toDate(value: Dayjs): Date {
  return value.startOf("day").toDate();
}

function CalendarIcon({ className }: { className?: string }) {
  return <CalendarDays className={className} size={18} strokeWidth={1.75} />;
}

/** App-styled date field. Value stays a `Date` so callers do not depend on dayjs. */
export function AppDatePicker({
  value,
  onChange,
  placeholder = "MM/DD/YYYY",
  error = false,
  helperText,
  disableFuture = false,
  disablePast = false,
  fullWidth = true,
}: AppDatePickerProps) {
  const [draft, setDraft] = useState<Dayjs | null>(() => toDayjs(value));
  const emittedTime = useRef<number | null>(value?.getTime() ?? null);
  const [monthPlaceholder, dayPlaceholder, yearPlaceholder] = placeholder.split("/");

  useEffect(() => {
    const incoming = value?.getTime() ?? null;
    if (incoming === emittedTime.current) return;
    emittedTime.current = incoming;
    setDraft(toDayjs(value));
  }, [value]);

  function handleChange(next: Dayjs | null, context: { validationError: DateValidationError }) {
    setDraft(next);

    const invalid = !next || !next.isValid() || context.validationError === "invalidDate";
    if (invalid) {
      emittedTime.current = null;
      onChange(null);
      return;
    }

    const date = toDate(next);
    emittedTime.current = date.getTime();
    onChange(date);
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={draft}
        onChange={handleChange}
        format="MM/DD/YYYY"
        disableFuture={disableFuture}
        disablePast={disablePast}
        localeText={{
          fieldMonthPlaceholder: () => monthPlaceholder || "MM",
          fieldDayPlaceholder: () => dayPlaceholder || "DD",
          fieldYearPlaceholder: () => yearPlaceholder || "YYYY",
        }}
        slots={{ openPickerIcon: CalendarIcon }}
        slotProps={{
          textField: {
            fullWidth,
            error,
            helperText,
            sx: {
              "& .MuiPickersOutlinedInput-root": {
                height: "var(--control-height)",
                minHeight: "var(--control-height)",
                borderRadius: "8px",
                bgcolor: "#FFFFFF",
                fontSize: "var(--font-size-body)",
                "& .MuiPickersOutlinedInput-notchedOutline": { borderColor: "#DDE2E9" },
                "&:hover .MuiPickersOutlinedInput-notchedOutline": { borderColor: "#BFC7D2" },
                "&.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                  borderWidth: 1,
                },
                "&.Mui-error .MuiPickersOutlinedInput-notchedOutline": { borderColor: "#D92D20" },
              },
              "& .MuiPickersSectionList-root": {
                py: 0,
                fontSize: "var(--font-size-body)",
              },
              "& .MuiFormHelperText-root": {
                mx: 0,
                mt: 0.5,
                fontSize: "var(--font-size-body)",
                color: "#D92D20",
              },
            },
          },
          openPickerButton: {
            "aria-label": "Choose date",
            sx: { color: "#64748B", p: 0.75, mr: 0.25 },
          },
          desktopPaper: {
            sx: {
              fontFamily: fontFamily.sans,
              borderRadius: "12px",
              boxShadow: elevation.floatingMenu,
              "& .MuiPickersCalendarHeader-label": { fontWeight: 600 },
              "& .MuiPickerDay-root.Mui-selected": {
                bgcolor: "#2F72B9",
                "&:hover, &:focus": { bgcolor: "#245C96" },
              },
            },
          },
        }}
        sx={{ width: fullWidth ? "100%" : undefined }}
      />
    </LocalizationProvider>
  );
}
