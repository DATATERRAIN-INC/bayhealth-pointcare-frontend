"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { MessageSquareText, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppTable } from "@/components/shared/AppTable";
import { TablePager } from "@/components/shared/TablePager";
import {
  channelMeta,
  statusMeta,
  type OutreachCall,
  type OutreachChannel,
  type OutreachStatus,
} from "@/data/gapCalls";
import { useGetCallTranscriptQuery, useGetCallsQuery } from "@/lib/api/callsApi";
import { elevation } from "@/lib/theme/tokens";

type FilterKey = "all" | OutreachStatus;
type ChannelFilterKey = "all" | OutreachChannel;

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "in_progress", label: "In progress" },
  { key: "not_attended", label: "Not attended" },
];

const channelFilters: {
  key: ChannelFilterKey;
  label: string;
  icon?: typeof Phone;
}[] = [
  { key: "all", label: "All" },
  { key: "call", label: "Call", icon: Phone },
  { key: "text", label: "Text", icon: MessageSquareText },
];

const surface = {
  bgcolor: "#FFFFFF",
  border: "1px solid #E5E9EF",
  borderRadius: "10px",
  boxShadow: elevation.floatingPanel,
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

function ChannelChip({ channel }: { channel: OutreachChannel }) {
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

function TypeFilterTabs({
  items,
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  items: { key: ChannelFilterKey; label: string; icon?: typeof Phone }[];
  value: ChannelFilterKey;
  onChange: (next: ChannelFilterKey) => void;
  "aria-label"?: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: "center",
        alignSelf: "flex-start",
        maxWidth: "100%",
      }}
    >
      <Box
        role="tablist"
        aria-label={ariaLabel}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          p: "3px",
          borderRadius: "10px",
          bgcolor: "#F1F5F9",
          border: "1px solid #E2E8F0",
          maxWidth: "100%",
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {items.map((item) => {
          const selected = value === item.key;
          const Icon = item.icon;
          return (
            <Box
              key={item.key}
              component="button"
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(item.key)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                flexShrink: 0,
                minWidth: 72,
                px: 1.6,
                py: 0.7,
                border: 0,
                borderRadius: "8px",
                bgcolor: selected ? "primary.main" : "transparent",
                color: selected ? "#FFFFFF" : "#64748B",
                boxShadow: selected ? "0 1px 2px rgb(47 114 185 / 0.28)" : "none",
                fontFamily: "inherit",
                fontSize: "var(--font-size-body)",
                fontWeight: selected ? 650 : 550,
                lineHeight: 1.25,
                cursor: "pointer",
                transition:
                  "background-color 140ms ease, color 140ms ease, box-shadow 140ms ease",
                "&:hover": {
                  color: selected ? "#FFFFFF" : "#1C2A6B",
                  bgcolor: selected ? "primary.main" : "rgb(255 255 255 / 0.7)",
                },
              }}
            >
              {Icon ? <Icon size={14} strokeWidth={2.25} aria-hidden /> : null}
              {item.label}
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
}

function StatusFilterRow({
  value,
  counts,
  onChange,
}: {
  value: FilterKey;
  counts?: Partial<Record<FilterKey, number>>;
  onChange: (next: FilterKey) => void;
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: "center",
        overflowX: "auto",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
    >
      {filters.map((item) => {
        const selected = value === item.key;
        const count = counts?.[item.key];
        return (
          <Box
            key={item.key}
            component="button"
            type="button"
            onClick={() => onChange(item.key)}
            sx={{
              flexShrink: 0,
              border: selected ? "1px solid #C9DBF2" : "1px solid transparent",
              borderRadius: "999px",
              px: 1.35,
              py: 0.45,
              bgcolor: selected ? "#EAF3FB" : "transparent",
              color: selected ? "primary.main" : "#667085",
              fontFamily: "inherit",
              fontSize: "var(--font-size-body)",
              fontWeight: selected ? 650 : 500,
              lineHeight: 1.25,
              cursor: "pointer",
              transition: "background-color 120ms ease, color 120ms ease, border-color 120ms ease",
              "&:hover": {
                bgcolor: selected ? "#EAF3FB" : "#F3F5F8",
                color: selected ? "primary.main" : "text.primary",
              },
            }}
          >
            {count == null ? item.label : `${item.label} · ${count}`}
          </Box>
        );
      })}
    </Stack>
  );
}

function StatusFilterBar({
  status,
  statusCounts,
  onStatusChange,
}: {
  status: FilterKey;
  statusCounts?: Partial<Record<FilterKey, number>>;
  onStatusChange: (next: FilterKey) => void;
}) {
  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2 },
        pt: 1.6,
        pb: 1.35,
        borderBottom: "1px solid #E8ECF1",
        bgcolor: "#FAFBFC",
      }}
    >
      <StatusFilterRow value={status} counts={statusCounts} onChange={onStatusChange} />
    </Box>
  );
}

const CALLS_PER_PAGE = 10;

export function CallsWorkspace() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilterKey>("all");
  const [selectedId, setSelectedId] = useState("");
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CALLS_PER_PAGE);
  const [tablePending, setTablePending] = useState(true);
  const { data, isUninitialized, isLoading, isFetching, isError } = useGetCallsQuery({
    page: page + 1,
    pageSize,
    status: filter === "all" ? undefined : filter,
    channel: channelFilter === "all" ? undefined : channelFilter,
  });

  useEffect(() => {
    if (!tablePending) return;
    if (isFetching || isLoading) return;
    setTablePending(false);
  }, [tablePending, isFetching, isLoading]);

  const showSkeleton =
    !isError && (tablePending || isUninitialized || isLoading || isFetching);

  function beginTableFetch() {
    setTablePending(true);
  }

  const apiRows = data?.results ?? [];
  // Client-side channel filter as a fallback if the API ignores `channel`.
  const paged = useMemo(() => {
    if (channelFilter === "all") return apiRows;
    return apiRows.filter((row) => row.channel === channelFilter);
  }, [apiRows, channelFilter]);
  const rowCount = channelFilter === "all" || paged.length === apiRows.length ? (data?.count ?? 0) : paged.length;
  const fullListLoaded =
    filter === "all" && channelFilter === "all" && apiRows.length > 0 && apiRows.length === (data?.count ?? 0);
  const filterCounts = useMemo(() => {
    const counts: Partial<Record<FilterKey, number>> = { all: rowCount || undefined };
    if (fullListLoaded) {
      counts.completed = apiRows.filter((call) => call.status === "completed").length;
      counts.in_progress = apiRows.filter((call) => call.status === "in_progress").length;
      counts.not_attended = apiRows.filter((call) => call.status === "not_attended").length;
    } else if (filter !== "all") {
      counts[filter] = rowCount;
    }
    return counts;
  }, [apiRows, filter, fullListLoaded, rowCount]);
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

  function itemLabel(call: OutreachCall): string {
    return call.channel === "text" ? `Text #${call.callNumber}` : `Call #${call.callNumber}`;
  }

  function transcriptLabel(call: OutreachCall): string {
    const available = call.hasTranscript || call.messages.length > 0;
    if (call.id === selected?.id && available) return "Viewing";
    if (available) return "View";
    if (call.channel === "call" && call.status === "in_progress") return "After call ends";
    return call.channel === "text" ? "No messages" : "No transcript";
  }

  function emptyMessage() {
    if (isError) return "Could not load outreach activity. Check the API connection and try again.";
    if (channelFilter === "call") return filter === "all" ? "No calls yet." : "No calls in this status.";
    if (channelFilter === "text") return filter === "all" ? "No texts yet." : "No texts in this status.";
    if (filter === "all") return "No calls or texts yet.";
    return "No activity in this status.";
  }

  function skeletonRows() {
    const bone = { bgcolor: "#E9EEF4", borderRadius: "6px" } as const;
    return Array.from({ length: pageSize }, (_, rowIndex) => (
      <TableRow key={`call-skeleton-${rowIndex}`}>
        <TableCell>
          <Skeleton variant="rounded" animation="wave" width="62%" height={16} sx={bone} />
          <Skeleton variant="rounded" animation="wave" width="38%" height={12} sx={{ ...bone, mt: 0.75 }} />
        </TableCell>
        <TableCell>
          <Skeleton variant="rounded" animation="wave" width={64} height={22} sx={{ ...bone, borderRadius: "999px" }} />
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
      <Stack spacing={1.25}>
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
            Calls, texts, and transcripts
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
            Track outreach calls and texts. Filter by type or status. Times in America/New_York (EDT).
          </Typography>
        </Box>
        <TypeFilterTabs
          aria-label="Filter by type"
          items={channelFilters}
          value={channelFilter}
          onChange={(next) => {
            beginTableFetch();
            setChannelFilter(next);
            setPage(0);
            setSelectedId("");
            setMobileOpenId(null);
          }}
        />
      </Stack>

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
          <StatusFilterBar
            status={filter}
            statusCounts={filterCounts}
            onStatusChange={(next) => {
              beginTableFetch();
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
                  {["Patient", "Type", "Status", "Started", "Duration", "Transcript"].map((heading) => (
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
                  ? emptyRow(6)
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
                          {itemLabel(call)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <ChannelChip channel={call.channel} />
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
              onPageChange={(next) => {
                beginTableFetch();
                setPage(next);
              }}
              onPageSizeChange={(next) => {
                beginTableFetch();
                setPageSize(next);
                setPage(0);
              }}
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

      <Stack spacing={1.25} sx={{ display: { xs: "flex", lg: "none" } }}>
        <Box
          sx={{
            ...surface,
            px: 1.5,
            pt: 1.4,
            pb: 1.25,
            borderColor: "#E8ECF1",
            bgcolor: "#FAFBFC",
          }}
        >
          <StatusFilterRow
            value={filter}
            counts={filterCounts}
            onChange={(next) => {
              beginTableFetch();
              setFilter(next);
              setPage(0);
              setMobileOpenId(null);
            }}
          />
        </Box>
        {showSkeleton ? (
          <Stack spacing={1.5}>
            {Array.from({ length: Math.min(pageSize, 6) }, (_, index) => (
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
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexShrink: 0 }}>
                    <ChannelChip channel={call.channel} />
                    <StatusChip status={call.status} />
                  </Stack>
                </Stack>
                <Typography sx={{ mt: 0.45, fontSize: "var(--font-size-body)", color: "#8B93A7", lineHeight: 1.4 }}>
                  {itemLabel(call)} · {call.started} EDT
                  {call.channel === "call"
                    ? ` · ${call.status === "in_progress" ? "live" : call.duration}`
                    : ""}
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
                ) : call.channel === "call" && call.status === "in_progress" ? (
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
              onPageChange={(next) => {
                beginTableFetch();
                setPage(next);
              }}
              onPageSizeChange={(next) => {
                beginTableFetch();
                setPageSize(next);
                setPage(0);
              }}
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
