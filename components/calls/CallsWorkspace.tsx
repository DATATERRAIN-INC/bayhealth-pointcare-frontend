"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { MessageSquareText, Phone } from "lucide-react";
import { TABLE_HEADER_COLOR } from "@/components/shared/AppTable";
import { TablePager } from "@/components/shared/TablePager";
import {
  ChannelChip,
  DESKTOP_PANEL_HEIGHT,
  StatusChip,
  StatusLabel,
  TranscriptBody,
  TranscriptPanel,
} from "@/components/calls/CallTranscriptPanel";
import {
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
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CALLS_PER_PAGE);
  const { data, isUninitialized, isLoading, isFetching, isError } = useGetCallsQuery({
    page: page + 1,
    pageSize,
    status: filter === "all" ? undefined : filter,
    channel: channelFilter === "all" ? undefined : channelFilter,
  });

  const showSkeleton = !isError && (isUninitialized || isLoading || isFetching);

  const apiRows = useMemo(() => data?.results ?? [], [data?.results]);
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

  const columns = useMemo<GridColDef<OutreachCall>[]>(
    () => [
      {
        field: "patientName",
        headerName: "Patient",
        flex: 1.4,
        minWidth: 180,
        sortable: false,
        renderCell: (params) => (
          <Box sx={{ minWidth: 0, py: 0.5 }}>
            <Typography noWrap sx={{ fontWeight: 600, color: "text.primary", fontSize: "var(--font-size-body)", lineHeight: 1.3 }}>
              {params.row.patientName}
            </Typography>
            <Typography noWrap sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7", mt: 0.15 }}>
              {itemLabel(params.row)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "channel",
        headerName: "Type",
        flex: 0.7,
        minWidth: 100,
        sortable: false,
        renderCell: (params) => <ChannelChip channel={params.row.channel} />,
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.9,
        minWidth: 120,
        sortable: false,
        renderCell: (params) => <StatusLabel status={params.row.status} />,
      },
      {
        field: "started",
        headerName: "Started",
        flex: 0.8,
        minWidth: 110,
        sortable: false,
        renderCell: (params) => (
          <Typography sx={{ fontSize: "var(--font-size-body)", color: "text.primary", whiteSpace: "nowrap" }}>
            {params.row.started}
          </Typography>
        ),
      },
      {
        field: "duration",
        headerName: "Duration",
        flex: 0.7,
        minWidth: 100,
        sortable: false,
        renderCell: (params) => (
          <Typography sx={{ fontSize: "var(--font-size-body)", color: "text.primary", whiteSpace: "nowrap" }}>
            {params.row.duration}
          </Typography>
        ),
      },
      {
        field: "transcript",
        headerName: "Transcript",
        flex: 0.9,
        minWidth: 120,
        sortable: false,
        renderCell: (params) => {
          const label = transcriptLabel(params.row);
          const isLink = label === "Viewing" || label === "View";
          return (
            <Typography
              component={isLink ? "button" : "span"}
              type={isLink ? "button" : undefined}
              onClick={
                isLink
                  ? () => {
                      setSelectedId(params.row.id);
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
          );
        },
      },
    ],
    // itemLabel/transcriptLabel close over selected; refresh when selection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedId],
  );

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
              setFilter(next);
              setPage(0);
              setSelectedId("");
            }}
          />

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <DataGrid
              rows={isError ? [] : paged}
              columns={columns}
              loading={showSkeleton}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              disableColumnMenu
              hideFooter
              rowHeight={64}
              columnHeaderHeight={48}
              getRowClassName={(params) => (params.id === selectedId ? "calls-row--selected" : "")}
              slots={{
                noRowsOverlay: () => (
                  <Stack sx={{ height: "100%", alignItems: "center", justifyContent: "center", px: 2 }}>
                    <Typography
                      sx={{
                        fontSize: "var(--font-size-body)",
                        color: isError ? "#D92D20" : "#8B93A7",
                        textAlign: "center",
                      }}
                    >
                      {emptyMessage()}
                    </Typography>
                  </Stack>
                ),
              }}
              sx={{
                border: 0,
                width: "100%",
                height: "100%",
                fontSize: "var(--font-size-body)",
                "& .MuiDataGrid-main": { minHeight: 0 },
                "& .MuiDataGrid-virtualScroller": { overflowY: "auto" },
                "& .MuiDataGrid-columnHeaders": {
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  bgcolor: TABLE_HEADER_COLOR,
                },
                "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
                  bgcolor: TABLE_HEADER_COLOR,
                },
                "& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell": {
                  px: 2,
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 650,
                  fontSize: "var(--font-size-body)",
                  color: "text.primary",
                },
                "& .MuiDataGrid-cell": {
                  borderColor: "#E9EDF2",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "var(--font-size-body)",
                  color: "text.primary",
                },
                "& .MuiDataGrid-row:hover": {
                  bgcolor: "#F8FAFC",
                },
                "& .calls-row--selected": {
                  bgcolor: "#F3F8FD",
                  boxShadow: "inset 3px 0 0 #2F72B9",
                },
                "& .calls-row--selected:hover": {
                  bgcolor: "#F3F8FD",
                },
                "& .MuiDataGrid-footerContainer": {
                  display: "none",
                },
              }}
            />
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
                setPage(next);
              }}
              onPageSizeChange={(next) => {
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
                setPage(next);
              }}
              onPageSizeChange={(next) => {
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
