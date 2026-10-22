"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { History, ListOrdered, type LucideProps } from "lucide-react";
import {
  dataGridViewportHeight,
  TABLE_HEADER_COLOR,
  TABLE_HEADER_HEIGHT,
  TABLE_ROW_HEIGHT,
  TABLE_VISIBLE_PAGE_ROWS,
} from "@/components/shared/AppTable";
import { ColumnHeaderFilter } from "@/components/shared/ColumnHeaderFilter";
import { SearchBox } from "@/components/shared/SearchBox";
import { TablePager } from "@/components/shared/TablePager";
import { CallQueueWorkspace } from "@/components/calls/CallQueueWorkspace";
import { CallRecordingsList } from "@/components/calls/CallRecordingPlayer";
import {
  ChannelChip,
  TranscriptBody,
  TranscriptPanel,
} from "@/components/calls/CallTranscriptPanel";
import { CallStatusChip, isLiveCallStatus } from "@/components/shared/CallStatusChip";
import { SentimentChip } from "@/components/shared/SentimentChip";
import {
  type OutreachCall,
  type OutreachChannel,
  type OutreachStatus,
} from "@/data/gapCalls";
import {
  callQueueSubscriptionOptions,
  useGetCallSummaryQuery,
  useGetCallTranscriptQuery,
  useGetCallsQuery,
} from "@/lib/api/callsApi";
import { useGetSmsConversationsQuery, useGetSmsTranscriptQuery } from "@/lib/api/smsApi";
import { elevation } from "@/lib/theme/tokens";

type WorkspaceView = "activity" | "queue";

function queueHasItems(summary: {
  in_progress: number;
  ongoing: number;
  waiting: number;
  connect_live_agent: number;
  queued: number;
  scheduled: number;
  paused: number;
} | undefined): boolean {
  if (!summary) return false;
  return (
    summary.in_progress +
      summary.ongoing +
      summary.waiting +
      summary.connect_live_agent +
      summary.queued +
      summary.scheduled +
      summary.paused >
    0
  );
}
type FilterKey = "all" | OutreachStatus;
type ChannelFilterKey = OutreachChannel;
type TabIcon = ComponentType<LucideProps>;

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "in_progress", label: "In progress" },
  { key: "ongoing", label: "Ongoing" },
  { key: "live_agent", label: "Live agent" },
  { key: "callback", label: "Callback" },
  { key: "not_attended", label: "Not attended" },
  { key: "voicemail_reached", label: "Voicemail" },
  { key: "cancel", label: "Cancelled" },
];

const workspaceViews: {
  key: WorkspaceView;
  label: string;
  icon: TabIcon;
}[] = [
  { key: "activity", label: "Activity", icon: History },
  { key: "queue", label: "Queue", icon: ListOrdered },
];

const surface = {
  bgcolor: "#FFFFFF",
  border: "1px solid #E5E9EF",
  borderRadius: "10px",
  boxShadow: elevation.floatingPanel,
} as const;

function TypeFilterTabs<T extends string>({
  items,
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  items: { key: T; label: string; icon?: TabIcon }[];
  value: T;
  onChange: (next: T) => void;
  "aria-label"?: string;
}) {
  return (
    <Box
      role="tablist"
      aria-label={ariaLabel}
      sx={{
        display: "inline-flex",
        alignItems: "stretch",
        alignSelf: "flex-start",
        width: "fit-content",
        maxWidth: "100%",
        boxSizing: "border-box",
        p: "3px",
        borderRadius: "10px",
        bgcolor: "#F1F5F9",
        border: "1px solid #E2E8F0",
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
              alignSelf: "stretch",
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
  );
}

function ChannelHistoryTabs({
  value,
  callCount,
  textCount,
  onChange,
}: {
  value: ChannelFilterKey;
  callCount: number;
  textCount: number;
  onChange: (next: ChannelFilterKey) => void;
}) {
  const items: { key: ChannelFilterKey; label: string; count: number }[] = [
    { key: "call", label: "Calls", count: callCount },
    { key: "text", label: "Texts", count: textCount },
  ];

  return (
    <Box
      role="tablist"
      aria-label="Filter by channel"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.25,
        flexWrap: "wrap",
      }}
    >
      {items.map((item) => {
        const selected = value === item.key;
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
              px: 1.5,
              py: 0.55,
              borderRadius: "999px",
              border: "1px solid",
              borderColor: selected ? "#B7D4EF" : "transparent",
              bgcolor: selected ? "#E8F3FC" : "transparent",
              color: selected ? "primary.main" : "#8B93A7",
              fontFamily: "inherit",
              fontSize: "var(--font-size-body)",
              fontWeight: selected ? 650 : 550,
              lineHeight: 1.3,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
              transition: "background-color 140ms ease, color 140ms ease, border-color 140ms ease",
              "&:hover": {
                color: selected ? "primary.main" : "#1C2A6B",
                bgcolor: selected ? "#E8F3FC" : "#F5F7FA",
              },
            }}
          >
            {item.label} · {item.count}
          </Box>
        );
      })}
    </Box>
  );
}

const CALLS_PER_PAGE = 10;
/** Fixed DataGrid viewport (10 rows), same pattern as Patients — no card scroll. */
const CALLS_GRID_HEIGHT = dataGridViewportHeight({ withFooter: false });

const STATUS_FILTER_OPTIONS = filters.map((item) => ({
  value: item.key,
  label: item.label,
}));

function ActivityCardHeader({
  query,
  animatedItems,
  onQueryChange,
  channelFilter,
  callCount,
  textCount,
  onChannelChange,
  statusFilter = "all",
  onClearStatusFilter,
}: {
  query: string;
  animatedItems: string[];
  onQueryChange: (next: string) => void;
  channelFilter: ChannelFilterKey;
  callCount: number;
  textCount: number;
  onChannelChange: (next: ChannelFilterKey) => void;
  statusFilter?: FilterKey;
  onClearStatusFilter?: () => void;
}) {
  const activeStatusLabel =
    statusFilter !== "all"
      ? filters.find((item) => item.key === statusFilter)?.label
      : undefined;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.25}
      sx={{
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        px: 2,
        py: 1.25,
        borderBottom: "1px solid #E9EDF2",
        flexShrink: 0,
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          minWidth: 0,
          flex: "1 1 auto",
          alignItems: "center",
          flexWrap: "wrap",
          rowGap: 0.75,
        }}
      >
        <ChannelHistoryTabs
          value={channelFilter}
          callCount={callCount}
          textCount={textCount}
          onChange={onChannelChange}
        />
        {activeStatusLabel ? (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Typography sx={{ color: "#D0D5DD", fontSize: 12, lineHeight: 1 }}>·</Typography>
            <Box
              component="button"
              type="button"
              onClick={onClearStatusFilter}
              title={`Clear ${activeStatusLabel} filter`}
              aria-label={`Clear ${activeStatusLabel} filter`}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                p: 0,
                border: 0,
                bgcolor: "transparent",
                color: "primary.main",
                fontFamily: "inherit",
                fontSize: "var(--font-size-body)",
                fontWeight: 650,
                lineHeight: 1.35,
                cursor: onClearStatusFilter ? "pointer" : "default",
                "&:hover": onClearStatusFilter
                  ? { textDecoration: "underline" }
                  : undefined,
              }}
            >
              {activeStatusLabel}
              {onClearStatusFilter ? (
                <Box component="span" sx={{ fontSize: 13, lineHeight: 1, opacity: 0.75 }}>
                  ×
                </Box>
              ) : null}
            </Box>
          </Stack>
        ) : null}
      </Stack>

      <Box
        sx={{
          flex: { xs: "1 1 auto", sm: "0 0 280px" },
          width: { xs: "100%", sm: 280 },
          minWidth: 0,
        }}
      >
        <SearchBox
          height="45px"
          width="100%"
          value={query}
          handleSearch={onQueryChange}
          enableAnimation
          staticText="Search by "
          animatedItems={animatedItems}
          animationInterval={3000}
          iconPosition="start"
          placeholder="Search here..."
        />
      </Box>
    </Stack>
  );
}

export function CallsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const viewExplicit = viewParam === "queue" || viewParam === "activity";
  const view: WorkspaceView = viewParam === "queue" ? "queue" : "activity";
  const didAutoSelectView = useRef(false);
  // Hold skeleton until we know whether Queue should open by default (avoids Activity→Queue flash).
  const [defaultViewReady, setDefaultViewReady] = useState(viewExplicit);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilterKey>("call");
  const [selectedId, setSelectedId] = useState("");
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CALLS_PER_PAGE);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const tableCardRef = useRef<HTMLDivElement>(null);
  const [transcriptPanelHeight, setTranscriptPanelHeight] = useState<number>();

  const { data: callSummary, isSuccess: summaryReady, isError: summaryError } = useGetCallSummaryQuery(
    undefined,
    callQueueSubscriptionOptions,
  );

  function setView(next: WorkspaceView) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (viewExplicit) {
      setDefaultViewReady(true);
      return;
    }
    if (didAutoSelectView.current) return;
    if (!summaryReady && !summaryError) return;
    didAutoSelectView.current = true;
    if (queueHasItems(callSummary)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", "queue");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : `${pathname}?view=queue`, { scroll: false });
      return;
    }
    setDefaultViewReady(true);
  }, [callSummary, pathname, router, searchParams, summaryError, summaryReady, viewExplicit]);

  const isTextView = channelFilter === "text";
  const activityActive = defaultViewReady && view === "activity";

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const callsQuery = useGetCallsQuery(
    {
      page: page + 1,
      pageSize,
      status: filter === "all" ? undefined : filter,
      channel: "call",
      search: search || undefined,
    },
    { skip: !activityActive || isTextView },
  );

  const smsQuery = useGetSmsConversationsQuery(
    { page: page + 1, pageSize, search: search || undefined },
    { skip: !activityActive || !isTextView },
  );

  // Keep the inactive channel count warm so both tabs show live totals.
  const inactiveCallsCountQuery = useGetCallsQuery(
    {
      page: 1,
      pageSize: 1,
      status: filter === "all" ? undefined : filter,
      channel: "call",
      search: search || undefined,
    },
    { skip: !activityActive || !isTextView },
  );
  const inactiveSmsCountQuery = useGetSmsConversationsQuery(
    { page: 1, pageSize: 1, search: search || undefined },
    { skip: !activityActive || isTextView },
  );

  const data = isTextView ? smsQuery.data : callsQuery.data;
  const isError = isTextView ? smsQuery.isError : callsQuery.isError;

  const apiRows = useMemo(() => data?.results ?? [], [data?.results]);
  // Client-side channel filter as a fallback if the API ignores `channel` (calls only).
  const paged = useMemo(() => {
    if (isTextView) return apiRows;
    return apiRows.filter((row) => row.channel === "call");
  }, [apiRows, isTextView]);
  const rowCount =
    isTextView || paged.length === apiRows.length ? (data?.count ?? 0) : paged.length;
  const callCount = isTextView ? (inactiveCallsCountQuery.data?.count ?? 0) : rowCount;
  const textCount = isTextView ? rowCount : (inactiveSmsCountQuery.data?.count ?? 0);

  function handleChannelChange(next: ChannelFilterKey) {
    setChannelFilter(next);
    if (next === "text") setFilter("all");
    setPage(0);
    setSelectedId("");
    setMobileOpenId(null);
  }

  useLayoutEffect(() => {
    if (!activityActive) return;
    const el = tableCardRef.current;
    if (!el) return;

    const updateHeight = () => {
      const next = Math.round(el.getBoundingClientRect().height);
      setTranscriptPanelHeight((prev) => (prev === next ? prev : next));
    };
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activityActive, isTextView, rowCount, filter, pageSize]);

  const selected = paged.find((call) => call.id === selectedId);
  const mobileCall = paged.find((call) => call.id === mobileOpenId);
  const focusCall = mobileCall ?? selected;
  const callTranscriptTarget =
    focusCall?.channel !== "text" && focusCall?.retellCallId ? focusCall : undefined;
  const smsTranscriptTarget =
    focusCall?.channel === "text" && focusCall.chatId ? focusCall : undefined;

  const {
    data: callTranscriptPayload,
    isLoading: callTranscriptLoading,
    isError: callTranscriptError,
  } = useGetCallTranscriptQuery(callTranscriptTarget?.retellCallId ?? "", {
    skip:
      !callTranscriptTarget?.retellCallId ||
      (!callTranscriptTarget.hasTranscript &&
        !callTranscriptTarget.recordingUrl &&
        !callTranscriptTarget.liveAgentRecordingUrl),
  });

  const {
    data: smsTranscriptPayload,
    isLoading: smsTranscriptLoading,
    isError: smsTranscriptError,
  } = useGetSmsTranscriptQuery(smsTranscriptTarget?.chatId ?? "", {
    skip: !smsTranscriptTarget?.chatId,
  });

  const transcriptPayload = smsTranscriptTarget ? smsTranscriptPayload : callTranscriptPayload;
  const transcriptLoading = smsTranscriptTarget ? smsTranscriptLoading : callTranscriptLoading;
  const transcriptError = smsTranscriptTarget ? smsTranscriptError : callTranscriptError;
  const transcriptCall = smsTranscriptTarget ?? callTranscriptTarget;

  function withTranscript(call: OutreachCall | undefined): OutreachCall | undefined {
    if (!call || !transcriptCall) return call;
    const isSmsMatch = Boolean(call.chatId) && call.chatId === transcriptCall.chatId;
    const isCallMatch =
      Boolean(call.retellCallId) && call.retellCallId === transcriptCall.retellCallId;
    if (!isSmsMatch && !isCallMatch) return call;

    const transcriptLines = transcriptPayload?.transcript ?? [];
    const recordingUrl = call.recordingUrl || transcriptPayload?.recordingUrl || null;
    const liveAgentRecordingUrl =
      call.liveAgentRecordingUrl || transcriptPayload?.liveAgentRecordingUrl || null;
    return {
      ...call,
      messages: transcriptLines,
      messageCount: transcriptLines.length || call.messageCount,
      recordingUrl,
      liveAgentRecordingUrl,
    };
  }

  const viewed = withTranscript(selected);

  function isActiveTranscript(call: OutreachCall | undefined): boolean {
    if (!call || !transcriptCall) return false;
    if (call.chatId && transcriptCall.chatId) return call.chatId === transcriptCall.chatId;
    if (call.retellCallId && transcriptCall.retellCallId) {
      return call.retellCallId === transcriptCall.retellCallId;
    }
    return call.id === transcriptCall.id;
  }

  function itemLabel(call: OutreachCall): string {
    return call.channel === "text" ? `Text #${call.callNumber}` : `Call #${call.callNumber}`;
  }

  function transcriptLabel(call: OutreachCall): string {
    const available =
      call.hasTranscript ||
      Boolean(call.chatId) ||
      call.messages.length > 0 ||
      Boolean(call.recordingUrl) ||
      Boolean(call.liveAgentRecordingUrl);
    if (call.id === selected?.id && available) return "Viewing";
    if (available) return "View";
    if (call.channel === "call" && isLiveCallStatus(call.status)) return "After call ends";
    return call.channel === "text" ? "No messages" : "No transcript";
  }

  function emptyMessage() {
    if (isError) {
      return isTextView
        ? "Could not load text conversations. Check the API connection and try again."
        : "Could not load outreach activity. Check the API connection and try again.";
    }
    if (search) {
      return isTextView
        ? `No texts match “${search}”.`
        : `No calls match “${search}”.`;
    }
    if (isTextView) return "No texts yet.";
    if (filter === "all") return "No calls yet.";
    return "No calls in this status.";
  }

  const columns = useMemo<GridColDef<OutreachCall>[]>(() => {
    const cols: GridColDef<OutreachCall>[] = [
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
    ];

    cols.push({
      field: "status",
      headerName: "Status",
      flex: 0.9,
      minWidth: 150,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      headerAlign: "left",
      align: "left",
      renderHeader: isTextView
        ? undefined
        : () => (
            <ColumnHeaderFilter
              label="Status"
              value={filter}
              options={STATUS_FILTER_OPTIONS}
              onChange={(next) => {
                setFilter(next);
                setPage(0);
                setSelectedId("");
              }}
            />
          ),
      renderCell: (params) => <CallStatusChip status={params.row.status} />,
    });

    cols.push({
      field: "started",
      headerName: "Started",
      flex: 1.2,
      minWidth: 170,
      sortable: false,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "text.primary", whiteSpace: "nowrap" }}>
          {params.row.started}
        </Typography>
      ),
    });

    if (!isTextView) {
      cols.push({
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
      });
    }

    cols.push({
      field: "transcript",
      headerName: isTextView ? "Messages" : "Transcript",
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
    });

    return cols;
    // itemLabel/transcriptLabel close over selected; refresh when selection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, isTextView, filter]);

  if (!defaultViewReady) {
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
            Calls and texts
          </Typography>
          <Skeleton
            variant="text"
            animation="wave"
            width={420}
            sx={{ display: { xs: "none", lg: "block" }, mt: 0.5, bgcolor: "#E9EEF4" }}
          />
        </Box>
        <Skeleton variant="rounded" animation="wave" width={168} height={40} sx={{ bgcolor: "#E9EEF4", borderRadius: "10px" }} />
        <Box
          sx={{
            ...surface,
            display: "flex",
            flexDirection: "column",
            overflow: "visible",
            p: 2,
            gap: 1.5,
            minHeight: { xs: 420, lg: CALLS_GRID_HEIGHT + 120 },
          }}
        >
          <Skeleton variant="rounded" animation="wave" height={36} sx={{ bgcolor: "#E9EEF4", borderRadius: "8px" }} />
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              key={`calls-default-view-skeleton-${index}`}
              variant="rounded"
              animation="wave"
              height={52}
              sx={{ bgcolor: "#E9EEF4", borderRadius: "8px" }}
            />
          ))}
        </Box>
      </Stack>
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
          Calls and texts
        </Typography>
        <Typography
          sx={{
            display: { xs: "none", lg: "block" },
            mt: 0.5,
            fontSize: "var(--font-size-body)",
            color: "#6B7280",
            lineHeight: 1.45,
            maxWidth: 640,
          }}
        >
          {view === "queue"
            ? "Manage the live outbound queue — processing, waiting, paused, and scheduled."
            : "Track outreach history and transcripts. Filter by type or status. Times in America/New_York (EDT)."}
        </Typography>
      </Box>

      <TypeFilterTabs
        aria-label="Workspace view"
        items={workspaceViews}
        value={view}
        onChange={setView}
      />

      {view === "queue" ? <CallQueueWorkspace embedded /> : null}

      {view === "activity" ? (
      <>

      <Box
        sx={{
          display: { xs: "none", lg: "grid" },
          gridTemplateColumns: selected ? "minmax(0, 1.35fr) minmax(320px, 0.9fr)" : "minmax(0, 1fr)",
          gap: 2,
          alignItems: "start",
        }}
      >
        <Box
          ref={tableCardRef}
          sx={{
            ...surface,
            display: "flex",
            flexDirection: "column",
            overflow: "visible",
            borderColor: "#E5E9EF",
            borderRadius: "10px",
          }}
        >
          <ActivityCardHeader
            query={query}
            animatedItems={isTextView ? ["patient name"] : ["patient name", "call #"]}
            onQueryChange={(next) => {
              setQuery(next);
              setPage(0);
              setSelectedId("");
              setMobileOpenId(null);
            }}
            channelFilter={channelFilter}
            callCount={callCount}
            textCount={textCount}
            onChannelChange={handleChannelChange}
            statusFilter={isTextView ? "all" : filter}
            onClearStatusFilter={
              !isTextView && filter !== "all"
                ? () => {
                    setFilter("all");
                    setPage(0);
                    setSelectedId("");
                  }
                : undefined
            }
          />

          <Box sx={{ width: "100%", height: CALLS_GRID_HEIGHT }}>
            <DataGrid
              rows={isError ? [] : paged}
              columns={columns}
              loading={false}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              disableColumnSorting
              disableColumnMenu
              disableColumnFilter
              disableColumnSelector
              hideFooter
              rowHeight={TABLE_ROW_HEIGHT}
              columnHeaderHeight={TABLE_HEADER_HEIGHT}
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
                "& .MuiDataGrid-main": { overflow: "hidden" },
                // Keep viewport at 10 rows; only scroll inside when Rows per page > 10.
                "& .MuiDataGrid-virtualScroller": {
                  overflowY: pageSize > TABLE_VISIBLE_PAGE_ROWS ? "auto" : "hidden",
                },
                "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
                  bgcolor: TABLE_HEADER_COLOR,
                },
                "& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell": {
                  px: 2,
                },
                "& .MuiDataGrid-columnHeader[data-field='status']": {
                  overflow: "visible",
                },
                "& .MuiDataGrid-columnHeader[data-field='status'] .MuiDataGrid-columnHeaderTitleContainer": {
                  width: "100%",
                  maxWidth: "100%",
                  overflow: "visible",
                },
                "& .MuiDataGrid-columnHeader[data-field='status'] .MuiDataGrid-columnHeaderTitleContainerContent": {
                  width: "100% !important",
                  maxWidth: "100%",
                  flex: "1 1 auto",
                  overflow: "visible",
                },
                "& .MuiDataGrid-columnHeader[data-field='status'] .MuiDataGrid-columnHeaderTitle": {
                  width: "100%",
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
          {rowCount > 0 ? (
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
            loading={transcriptLoading && isActiveTranscript(viewed)}
            error={transcriptError}
            onClose={() => setSelectedId("")}
            height={transcriptPanelHeight}
          />
        ) : null}
      </Box>

      <Stack spacing={1.25} sx={{ display: { xs: "flex", lg: "none" } }}>
        <Box sx={{ ...surface, overflow: "hidden" }}>
          <ActivityCardHeader
            query={query}
            animatedItems={isTextView ? ["patient name"] : ["patient name", "call #"]}
            onQueryChange={(next) => {
              setQuery(next);
              setPage(0);
              setSelectedId("");
              setMobileOpenId(null);
            }}
            channelFilter={channelFilter}
            callCount={callCount}
            textCount={textCount}
            onChannelChange={handleChannelChange}
            statusFilter={isTextView ? "all" : filter}
            onClearStatusFilter={
              !isTextView && filter !== "all"
                ? () => {
                    setFilter("all");
                    setPage(0);
                    setMobileOpenId(null);
                  }
                : undefined
            }
          />
        </Box>
        {paged.length === 0 ? (
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
            const transcriptReady =
              call.hasTranscript ||
              Boolean(call.chatId) ||
              call.messages.length > 0 ||
              Boolean(call.recordingUrl) ||
              Boolean(call.liveAgentRecordingUrl);
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
                    <CallStatusChip status={call.status} />
                    {call.channel === "call" && call.userSentiment ? (
                      <SentimentChip sentiment={call.userSentiment} />
                    ) : null}
                  </Stack>
                </Stack>
                <Typography sx={{ mt: 0.45, fontSize: "var(--font-size-body)", color: "#8B93A7", lineHeight: 1.4 }}>
                  {itemLabel(call)} · {call.started} EDT
                  {call.channel === "call"
                    ? ` · ${isLiveCallStatus(call.status) ? "live" : call.duration}`
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
                    <CallRecordingsList
                      channel={call.channel}
                      recordingUrl={withTranscript(call)?.recordingUrl ?? call.recordingUrl}
                      liveAgentRecordingUrl={
                        withTranscript(call)?.liveAgentRecordingUrl ?? call.liveAgentRecordingUrl
                      }
                    />
                    <TranscriptBody
                      call={withTranscript(call) ?? call}
                      loading={transcriptLoading && isActiveTranscript(call)}
                      error={transcriptError && isActiveTranscript(call)}
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
                ) : call.channel === "call" && isLiveCallStatus(call.status) ? (
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
      </>
      ) : null}
    </Stack>
  );
}
