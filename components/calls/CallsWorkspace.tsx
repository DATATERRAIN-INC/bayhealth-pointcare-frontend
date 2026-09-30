"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppTable } from "@/components/shared/AppTable";
import { TablePager } from "@/components/shared/TablePager";
import { statusMeta, type OutreachCall, type OutreachStatus } from "@/data/gapCalls";
import { useGetCallTranscriptQuery, useGetCallsQuery } from "@/lib/api/callsApi";

type FilterKey = "all" | OutreachStatus;

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "in_progress", label: "In progress" },
  { key: "not_attended", label: "Not attended" },
];

const surface = {
  bgcolor: "#FFFFFF",
  border: "1px solid #E8EAEE",
  borderRadius: "12px",
} as const;

const DESKTOP_PANEL_HEIGHT = 640;

const statusChip: Record<OutreachStatus, { bg: string; color: string }> = {
  completed: { bg: "#E5F6EC", color: "#178A45" },
  in_progress: { bg: "#E7F1FB", color: "#2F6FED" },
  not_attended: { bg: "#FDECEC", color: "#D14343" },
};

function StatusChip({ status }: { status: OutreachStatus }) {
  const chip = statusChip[status];
  const label = status === "in_progress" ? "In progress" : statusMeta[status].label;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.1,
        py: 0.35,
        borderRadius: "999px",
        bgcolor: chip.bg,
        color: chip.color,
        fontSize: "var(--font-size-body)",
        fontWeight: 600,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
  );
}

function StatusLabel({ status }: { status: OutreachStatus }) {
  const meta = statusMeta[status];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        color: meta.color,
        fontSize: "var(--font-size-body)",
        fontWeight: 500,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      <Box
        component="span"
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: meta.color,
          flexShrink: 0,
        }}
      />
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

function TranscriptBody({
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
      ? "Loading transcript…"
      : error
        ? "Could not load this transcript."
        : call.status === "in_progress"
          ? "Transcript available after the call ends."
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

function MobileCallFilters({
  value,
  counts,
  onChange,
}: {
  value: FilterKey;
  counts: Partial<Record<FilterKey, number>>;
  onChange: (next: FilterKey) => void;
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        overflowX: "auto",
        pb: 0.25,
        mx: -0.25,
        px: 0.25,
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
    >
      {filters.map((item) => {
        const selected = value === item.key;
        const count = counts[item.key];
        return (
          <Box
            key={item.key}
            component="button"
            type="button"
            onClick={() => onChange(item.key)}
            sx={{
              flexShrink: 0,
              border: selected ? "1px solid transparent" : "1px solid #E4E7EC",
              borderRadius: 999,
              px: 1.75,
              py: 0.8,
              bgcolor: selected ? "primary.main" : "#FFFFFF",
              color: selected ? "#FFFFFF" : "text.primary",
              fontFamily: "inherit",
              fontSize: "var(--font-size-body)",
              fontWeight: 600,
              lineHeight: 1.2,
              cursor: "pointer",
            }}
          >
            {count == null ? item.label : `${item.label} ${count}`}
          </Box>
        );
      })}
    </Stack>
  );
}

function CallFilterTabs({
  value,
  onChange,
}: {
  value: FilterKey;
  onChange: (next: FilterKey) => void;
}) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: FilterKey) => onChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 48,
        px: 1,
        borderBottom: "1px solid #E9EDF2",
        bgcolor: "#FFFFFF",
        "& .MuiTabs-indicator": {
          height: 2,
          bgcolor: "primary.main",
        },
        "& .MuiTab-root": {
          minHeight: 48,
          minWidth: "auto",
          px: 1.75,
          py: 0,
          textTransform: "none",
          fontSize: "var(--font-size-body)",
          fontWeight: 500,
          color: "#8B93A7",
          "&.Mui-selected": {
            color: "text.primary",
            fontWeight: 600,
          },
        },
      }}
    >
      {filters.map((item) => (
        <Tab key={item.key} value={item.key} disableRipple label={item.label} />
      ))}
    </Tabs>
  );
}

const CALLS_PER_PAGE = 10;

export function CallsWorkspace() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState("");
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CALLS_PER_PAGE);
  const { data, isUninitialized, isLoading, isFetching, isError } = useGetCallsQuery({
    page: page + 1,
    pageSize,
    status: filter === "all" ? undefined : filter,
  });
  const showSkeleton = !isError && !data && (isUninitialized || isLoading || isFetching);

  const paged = data?.results ?? [];
  const rowCount = data?.count ?? 0;
  const fullListLoaded = filter === "all" && paged.length > 0 && paged.length === rowCount;
  const filterCounts = useMemo(() => {
    const counts: Partial<Record<FilterKey, number>> = { all: rowCount || undefined };
    if (fullListLoaded) {
      counts.completed = paged.filter((call) => call.status === "completed").length;
      counts.in_progress = paged.filter((call) => call.status === "in_progress").length;
      counts.not_attended = paged.filter((call) => call.status === "not_attended").length;
    } else if (filter !== "all") {
      counts[filter] = rowCount;
    }
    return counts;
  }, [filter, fullListLoaded, paged, rowCount]);

  const selected = paged.find((call) => call.id === selectedId);
  const mobileCall = paged.find((call) => call.id === mobileOpenId);
  const transcriptCall = mobileCall?.retellCallId ? mobileCall : selected?.retellCallId ? selected : undefined;
  const {
    data: transcriptLines = [],
    isLoading: transcriptLoading,
    isError: transcriptError,
  } = useGetCallTranscriptQuery(transcriptCall?.retellCallId ?? "", {
    skip: !transcriptCall?.hasTranscript || !transcriptCall.retellCallId,
  });

  function withTranscript(call: OutreachCall | undefined): OutreachCall | undefined {
    if (!call || call.retellCallId !== transcriptCall?.retellCallId) return call;
    return {
      ...call,
      messages: transcriptLines,
      messageCount: transcriptLines.length || call.messageCount,
    };
  }

  const viewed = withTranscript(selected);

  async function copyTranscript() {
    if (!viewed || viewed.messages.length === 0) return;
    try {
      await copyText(transcriptText(viewed));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function transcriptLabel(call: OutreachCall): string {
    const available = call.hasTranscript || call.messages.length > 0;
    if (call.id === selected?.id && available) return "Viewing";
    if (available) return "View";
    if (call.status === "in_progress") return "After call ends";
    return "No transcript";
  }

  function emptyMessage() {
    if (isError) return "Could not load calls. Check the API connection and try again.";
    if (filter === "all") return "No calls yet.";
    return "No calls in this status.";
  }

  function skeletonRows() {
    const bone = { bgcolor: "#E9EEF4", borderRadius: "6px" } as const;
    return Array.from({ length: 8 }, (_, rowIndex) => (
      <TableRow key={`call-skeleton-${rowIndex}`}>
        <TableCell>
          <Skeleton variant="rounded" animation="wave" width="62%" height={16} sx={bone} />
          <Skeleton variant="rounded" animation="wave" width="38%" height={12} sx={{ ...bone, mt: 0.75 }} />
        </TableCell>
        <TableCell>
          <Skeleton variant="rounded" animation="wave" width={96} height={22} sx={{ ...bone, borderRadius: "999px" }} />
        </TableCell>
        <TableCell>
          <Skeleton variant="rounded" animation="wave" width={72} height={16} sx={bone} />
        </TableCell>
        <TableCell>
          <Skeleton variant="rounded" animation="wave" width={64} height={16} sx={bone} />
        </TableCell>
        <TableCell>
          <Skeleton variant="rounded" animation="wave" width={52} height={16} sx={bone} />
        </TableCell>
      </TableRow>
    ));
  }

  function emptyRow(colSpan: number) {
    return (
      <TableRow>
        <TableCell
          colSpan={colSpan}
          sx={{
            py: "40px !important",
            color: isError ? "#D92D20" : "#8B93A7",
            textAlign: "center",
          }}
        >
          {emptyMessage()}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
          <Typography
            sx={{
              fontSize: { xs: 24, lg: 26 },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "text.primary",
              lineHeight: 1.2,
            }}
          >
            Calls and transcripts
          </Typography>
          <Typography
            sx={{
              display: { xs: "none", lg: "block" },
              mt: 0.5,
              fontSize: "var(--font-size-body)",
              color: "#6B7280",
              lineHeight: 1.45,
            }}
          >
            Track each outreach call. Transcripts appear when a call is complete. Times in America/New_York (EDT).
          </Typography>
      </Box>

      <Box
        sx={{
          display: { xs: "none", lg: "grid" },
          gridTemplateColumns: selected ? "minmax(0, 1.35fr) minmax(320px, 0.9fr)" : "minmax(0, 1fr)",
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            ...surface,
            height: DESKTOP_PANEL_HEIGHT,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderColor: "#E5E9EF",
            borderRadius: "10px",
          }}
        >
          <CallFilterTabs
            value={filter}
            onChange={(next) => {
              setFilter(next);
              setPage(0);
              setSelectedId("");
            }}
          />

          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <AppTable
              sx={{
                width: "100%",
                tableLayout: "fixed",
              }}
            >
              <TableHead>
                <TableRow>
                  {["Patient", "Status", "Started", "Duration", "Transcript"].map((heading) => (
                    <TableCell key={heading}>
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {showSkeleton
                  ? skeletonRows()
                  : paged.length === 0
                  ? emptyRow(5)
                  : paged.map((call) => {
                  const active = call.id === selected?.id;
                  const label = transcriptLabel(call);
                  const isLink = label === "Viewing" || label === "View";
                  return (
                    <TableRow
                      key={call.id}
                      hover
                      sx={{
                        bgcolor: active ? "#F3F8FD" : "transparent",
                        boxShadow: active ? "inset 3px 0 0 #2F72B9" : "none",
                        "&:last-child td": { borderBottom: 0 },
                        "&:hover td": { bgcolor: active ? "#F3F8FD" : "#F8FAFC" },
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: "var(--font-size-body)" }}>
                          {call.patientName}
                        </Typography>
                        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7", mt: 0.15 }}>
                          Call #{call.callNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusLabel status={call.status} />
                      </TableCell>
                      <TableCell sx={{ color: "text.primary", whiteSpace: "nowrap" }}>{call.started}</TableCell>
                      <TableCell sx={{ color: "text.primary", whiteSpace: "nowrap" }}>{call.duration}</TableCell>
                      <TableCell>
                        <Typography
                          component={isLink ? "button" : "span"}
                          type={isLink ? "button" : undefined}
                          onClick={
                            isLink
                              ? () => {
                                  setSelectedId(call.id);
                                  setCopied(false);
                                }
                              : undefined
                          }
                          sx={{
                            p: 0,
                            border: 0,
                            bgcolor: "transparent",
                            fontFamily: "inherit",
                            fontSize: "var(--font-size-body)",
                            fontWeight: isLink ? 600 : 500,
                            color: isLink ? "primary.main" : "#8B93A7",
                            cursor: isLink ? "pointer" : "default",
                            textAlign: "left",
                          }}
                        >
                          {label}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </AppTable>
          </Box>
          {showSkeleton ? (
            <Stack direction="row" sx={{ justifyContent: "flex-end", alignItems: "center", gap: 2, minHeight: 52, px: 2, borderTop: "1px solid #EEF0F4" }}>
              <Skeleton variant="rounded" animation="wave" width={120} height={16} sx={{ bgcolor: "#E9EEF4", borderRadius: "6px" }} />
              <Skeleton variant="rounded" animation="wave" width={72} height={16} sx={{ bgcolor: "#E9EEF4", borderRadius: "6px" }} />
            </Stack>
          ) : rowCount > 0 ? (
            <TablePager
              page={page}
              pageSize={pageSize}
              rowCount={rowCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </Box>

        {selected ? (
          <TranscriptPanel
            call={viewed}
            loading={transcriptLoading && viewed?.retellCallId === transcriptCall?.retellCallId}
            error={transcriptError}
            copied={copied}
            onCopy={() => void copyTranscript()}
            onClose={() => setSelectedId("")}
          />
        ) : null}
      </Box>

      <Stack spacing={1.5} sx={{ display: { xs: "flex", lg: "none" } }}>
        <MobileCallFilters
          value={filter}
          counts={filterCounts}
          onChange={(next) => {
            setFilter(next);
            setPage(0);
            setMobileOpenId(null);
          }}
        />
        {showSkeleton ? (
          <Stack spacing={1.5}>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={`call-mobile-skeleton-${index}`} variant="rounded" height={92} sx={{ bgcolor: "#E9EEF4", borderRadius: "12px" }} />
            ))}
          </Stack>
        ) : paged.length === 0 ? (
          <Box
            sx={{
              ...surface,
              px: 2,
              py: 5,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: "var(--font-size-body)", color: isError ? "#D92D20" : "#8B93A7" }}>
              {emptyMessage()}
            </Typography>
          </Box>
        ) : (
          paged.map((call) => {
            const open = mobileOpenId === call.id;
            const transcriptReady = call.hasTranscript || call.messages.length > 0;
            return (
              <Box
                key={call.id}
                sx={{
                  ...surface,
                  px: 1.75,
                  py: 1.6,
                  borderColor: "#E4E8EF",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.3 }}>
                    {call.patientName}
                  </Typography>
                  <StatusChip status={call.status} />
                </Stack>
                <Typography sx={{ mt: 0.45, fontSize: "var(--font-size-body)", color: "#8B93A7", lineHeight: 1.4 }}>
                  Call #{call.callNumber} · {call.started} EDT · {call.status === "in_progress" ? "live" : call.duration}
                </Typography>

                {transcriptReady && open ? (
                  <Box
                    sx={{
                      mt: 1.5,
                      px: 1.5,
                      py: 1.5,
                      borderRadius: "10px",
                      border: "1px solid #D5E2F0",
                    }}
                  >
                    <TranscriptBody
                      call={withTranscript(call) ?? call}
                      loading={transcriptLoading && call.retellCallId === transcriptCall?.retellCallId}
                      error={transcriptError && call.retellCallId === transcriptCall?.retellCallId}
                    />
                  </Box>
                ) : null}

                {transcriptReady ? (
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setMobileOpenId(open ? null : call.id)}
                    sx={{
                      mt: 1.25,
                      p: 0,
                      border: 0,
                      bgcolor: "transparent",
                      color: "primary.main",
                      fontWeight: 600,
                      fontSize: "var(--font-size-body)",
                      lineHeight: 1.3,
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {open ? "Hide transcript" : "View transcript"}
                  </Box>
                ) : call.status === "in_progress" ? (
                  <Typography sx={{ mt: 1.15, fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
                    Transcript available after the call ends.
                  </Typography>
                ) : null}
              </Box>
            );
          })
        )}
        {rowCount > pageSize ? (
          <Box sx={{ ...surface, overflow: "hidden" }}>
            <TablePager
              page={page}
              pageSize={pageSize}
              rowCount={rowCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </Box>
        ) : null}
      </Stack>
    </Stack>
  );
}

function TranscriptPanel({
  call,
  loading = false,
  error = false,
  copied,
  onCopy,
  onClose,
}: {
  call: OutreachCall | undefined;
  loading?: boolean;
  error?: boolean;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
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
            Transcript · {call.patientName}
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: "var(--font-size-body)", color: "#8B93A7", lineHeight: 1.4 }}>
            Call #{call.callNumber} · {call.dateLabel} · {call.windowLabel}
            {call.hasTranscript || call.messages.length > 0 ? ` · ${call.duration}` : ""}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignItems: "center" }}>
          <StatusLabel status={call.status} />
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
          onClick={onCopy}
          sx={{ px: 1.75 }}
        >
          {copied ? "Copied" : "Copy transcript"}
        </Button>
      </Stack>
    </Box>
  );
}
