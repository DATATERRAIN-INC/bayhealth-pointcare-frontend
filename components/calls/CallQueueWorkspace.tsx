"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  CirclePlay,
  Eye,
  Pause,
  Phone,
  RefreshCw,
  X,
} from "lucide-react";
import { channelMeta } from "@/data/gapCalls";
import {
  callQueueSubscriptionOptions,
  useGetCallQueueQuery,
  useCancelCallMutation,
  useGetCallSummaryQuery,
  useGetQueuedCallQueueQuery,
  useSetCallPausedMutation,
  useStartOutboundCallMutation,
} from "@/lib/api/callsApi";
import { getApiErrorMessage } from "@/lib/apiError";
import { ActionsMenu } from "@/components/shared/ActionsMenu";
import { TablePager } from "@/components/shared/TablePager";
import { Button } from "@/components/ui/Button";
import { elevation } from "@/lib/theme/tokens";
import type { QueueCallItem, QueueStatus } from "@/types/queue";
import {
  processingEstimateMeta,
  queueStatusMeta,
} from "@/types/queue";

function formatWait(iso: string | null, now: number): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (mins < 1) return `${rem}s`;
  if (mins < 60) return `${mins}m ${String(rem).padStart(2, "0")}s`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function StatusChip({ status }: { status: QueueStatus }) {
  const meta = queueStatusMeta[status];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1,
        py: 0.3,
        borderRadius: "999px",
        bgcolor: meta.bg,
        color: meta.color,
        fontSize: "var(--font-size-body)",
        fontWeight: 650,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </Box>
  );
}

function formatRemaining(scheduledAt: string, now: number): string {
  const target = new Date(scheduledAt).getTime();
  if (Number.isNaN(target)) return processingEstimateMeta.scheduled;
  const deltaMs = target - now;
  if (Math.abs(deltaMs) < 60_000) return deltaMs > 0 ? "in <1m" : "Due now";
  const absMinutes = Math.floor(Math.abs(deltaMs) / 60_000);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  let span: string;
  if (hours > 48) {
    const days = Math.floor(hours / 24);
    const leftoverHours = hours % 24;
    const dayLabel = days === 1 ? "1 day" : `${days} days`;
    span = leftoverHours > 0 ? `${dayLabel} ${leftoverHours}h` : dayLabel;
  } else {
    span = hours > 0 ? (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`) : `${minutes}m`;
  }
  return deltaMs > 0 ? `in ${span}` : `${span} overdue`;
}

function estimateText(item: QueueCallItem, now: number): string {
  if (item.status === "scheduled" && item.scheduledAt) return formatRemaining(item.scheduledAt, now);
  return processingEstimateMeta[item.estimate];
}

function EstimateLabel({ item, now }: { item: QueueCallItem; now: number }) {
  return (
    <Typography sx={{ fontSize: "var(--font-size-body)", color: "#5C6478", fontWeight: 500 }}>
      {estimateText(item, now)}
    </Typography>
  );
}

function QueueStatusLine({
  queuedCount,
  inProgressCount,
  pausedCount,
}: {
  queuedCount: number;
  inProgressCount: number;
  pausedCount: number;
}) {
  const parts = [
    { label: "queued", value: queuedCount, color: "#5C6478" },
    { label: "in progress", value: inProgressCount, color: "#1D5F9A" },
    { label: "paused", value: pausedCount, color: pausedCount > 0 ? "#B45309" : "#5C6478" },
  ] as const;

  return (
    <Stack
      direction="row"
      spacing={0}
      sx={{
        alignItems: "center",
        flexWrap: "wrap",
        columnGap: 1.5,
        rowGap: 0.5,
        mt: 1,
      }}
    >
      {parts.map((part, index) => (
        <Stack
          key={part.label}
          direction="row"
          spacing={0.65}
          sx={{ alignItems: "center" }}
        >
          {index > 0 ? (
            <Box
              component="span"
              sx={{
                width: 3,
                height: 3,
                borderRadius: "50%",
                bgcolor: "#C5CCD8",
                mr: 0.35,
                flexShrink: 0,
              }}
            />
          ) : null}
          <Box
            component="span"
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: part.color,
              flexShrink: 0,
              opacity: part.value === 0 && part.label === "paused" ? 0.35 : 1,
            }}
          />
          <Typography
            component="span"
            sx={{
              fontSize: "var(--font-size-body)",
              color: part.color,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {part.value} {part.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

type QueueAction =
  | "start"
  | "pause"
  | "cancel"
  | "move_up"
  | "move_down"
  | "details";

const QUEUE_TABLE_COLUMNS = "48px minmax(0, 1.4fr) minmax(0, 1fr) 108px 110px 44px";
const QUEUE_TABLE_COLUMNS_XS = "44px minmax(0, 1fr) 40px";
const QUEUE_TABLE_COLUMNS_NO_ACTION = "48px minmax(0, 1.4fr) minmax(0, 1fr) 108px 110px";
const QUEUE_TABLE_COLUMNS_XS_NO_ACTION = "44px minmax(0, 1fr)";

function QueueTableHeader({ showActions = true }: { showActions?: boolean }) {
  return (
    <Box
      sx={{
        display: { xs: "none", lg: "grid" },
        gridTemplateColumns: showActions ? QUEUE_TABLE_COLUMNS : QUEUE_TABLE_COLUMNS_NO_ACTION,
        columnGap: 1.25,
        px: 2,
        py: 1,
        borderBottom: "1px solid #F0F2F5",
      }}
    >
      {["#", "Patient", "Reason", "Status", "Estimate", ...(showActions ? ["Action"] : [])].map((heading) => (
        <Typography
          key={heading}
          sx={{
            fontSize: "var(--font-size-body)",
            fontWeight: 650,
            color: "#8B93A7",
            textAlign: heading === "Action" ? "right" : "left",
          }}
        >
          {heading}
        </Typography>
      ))}
    </Box>
  );
}

function QueueSkeletonRows({ count = 5 }: { count?: number }) {
  const bone = { bgcolor: "#E9EEF4", borderRadius: "6px" } as const;
  return (
    <>
      <QueueTableHeader />
      {Array.from({ length: count }, (_, index) => (
        <Box
          key={`queue-skeleton-${index}`}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: QUEUE_TABLE_COLUMNS_XS,
              lg: QUEUE_TABLE_COLUMNS,
            },
            columnGap: 1.25,
            alignItems: "center",
            px: 2,
            py: 1.45,
            borderBottom: "1px solid #F0F2F5",
            "&:last-child": { borderBottom: 0 },
          }}
        >
          <Skeleton variant="rounded" animation="wave" width={22} height={14} sx={bone} />
          <Box sx={{ minWidth: 0 }}>
            <Skeleton variant="rounded" animation="wave" width="68%" height={15} sx={bone} />
            <Skeleton
              variant="rounded"
              animation="wave"
              width="42%"
              height={12}
              sx={{ ...bone, mt: 0.7, display: { xs: "none", lg: "block" } }}
            />
          </Box>
          <Skeleton
            variant="rounded"
            animation="wave"
            width="72%"
            height={14}
            sx={{ ...bone, display: { xs: "none", lg: "block" } }}
          />
          <Skeleton
            variant="rounded"
            animation="wave"
            width={78}
            height={22}
            sx={{ ...bone, borderRadius: "999px", display: { xs: "none", lg: "block" } }}
          />
          <Skeleton
            variant="rounded"
            animation="wave"
            width={64}
            height={14}
            sx={{ ...bone, display: { xs: "none", lg: "block" } }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Skeleton variant="circular" animation="wave" width={28} height={28} sx={{ bgcolor: "#E9EEF4" }} />
          </Box>
        </Box>
      ))}
    </>
  );
}

function QueuePagerSkeleton() {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 2,
        minHeight: 52,
        px: 2,
        borderTop: "1px solid #EEF0F4",
      }}
    >
      <Skeleton variant="rounded" animation="wave" width={120} height={16} sx={{ bgcolor: "#E9EEF4", borderRadius: "6px" }} />
      <Skeleton variant="rounded" animation="wave" width={72} height={16} sx={{ bgcolor: "#E9EEF4", borderRadius: "6px" }} />
    </Stack>
  );
}

function actionItemsFor(
  item: QueueCallItem,
  onAction: (id: string, action: QueueAction) => void,
  opts?: {
    isActive?: boolean;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    pauseDisabled?: boolean;
    cancelDisabled?: boolean;
  },
) {
  const isActive = opts?.isActive ?? item.status === "in_progress";
  const queuedLike = item.status === "queued" || item.status === "paused";
  return [
    {
      key: "start",
      label: "Start Call",
      icon: <CirclePlay size={15} />,
      disabled: item.status === "in_progress" || item.status === "completed" || item.status === "cancelled",
      onClick: () => onAction(item.id, "start"),
    },
    {
      key: "pause",
      label: item.status === "paused" ? "Unpause" : "Pause Call",
      icon: item.status === "paused" ? <CirclePlay size={15} /> : <Pause size={15} />,
      disabled:
        opts?.pauseDisabled ||
        !(
          isActive ||
          item.status === "queued" ||
          item.status === "paused" ||
          item.status === "scheduled"
        ),
      onClick: () => onAction(item.id, "pause"),
    },
    {
      key: "move_up",
      label: "Move Up",
      icon: <ArrowUp size={15} />,
      disabled: !queuedLike || opts?.canMoveUp === false,
      onClick: () => onAction(item.id, "move_up"),
    },
    {
      key: "move_down",
      label: "Move Down",
      icon: <ArrowDown size={15} />,
      disabled: !queuedLike || opts?.canMoveDown === false,
      onClick: () => onAction(item.id, "move_down"),
    },
    {
      key: "details",
      label: "View Details",
      icon: <Eye size={15} />,
      onClick: () => onAction(item.id, "details"),
    },
    {
      key: "cancel",
      label: "Cancel Call",
      icon: <Ban size={15} />,
      color: "#D14343",
      disabled: opts?.cancelDisabled || item.status === "cancelled" || item.status === "completed",
      onClick: () => onAction(item.id, "cancel"),
    },
  ];
}

function QueueListRow({
  item,
  now,
  canMoveUp,
  canMoveDown,
  onAction,
  highlight,
  pauseDisabled,
  cancelDisabled,
  showActions = true,
}: {
  item: QueueCallItem;
  now: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAction: (id: string, action: QueueAction) => void;
  highlight?: boolean;
  pauseDisabled?: boolean;
  cancelDisabled?: boolean;
  showActions?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: showActions ? QUEUE_TABLE_COLUMNS_XS : QUEUE_TABLE_COLUMNS_XS_NO_ACTION,
          lg: showActions ? QUEUE_TABLE_COLUMNS : QUEUE_TABLE_COLUMNS_NO_ACTION,
        },
        columnGap: 1.25,
        rowGap: 0.75,
        alignItems: "center",
        px: 2,
        py: 1.45,
        borderBottom: "1px solid #F0F2F5",
        "&:last-child": { borderBottom: 0 },
        "&:hover": { bgcolor: highlight ? "#EDF5FC" : "#FAFBFC" },
        bgcolor:
          highlight ? "#F3F8FD" : item.status === "failed" ? "#FFFCFC" : "transparent",
        boxShadow: highlight ? "inset 3px 0 0 #2F72B9" : "none",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          bgcolor: "#F3F5F8",
          color: "#526071",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: "var(--font-size-body)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {item.position}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 650, color: "text.primary", lineHeight: 1.3 }} noWrap>
          {item.patientName}
        </Typography>
        <Typography
          sx={{
            mt: 0.2,
            fontSize: "var(--font-size-body)",
            color: "#8B93A7",
            fontVariantNumeric: "tabular-nums",
          }}
          noWrap
        >
          {channelMeta[item.channel].label} · {item.phone}
        </Typography>
      </Box>

      <Typography
        sx={{
          display: { xs: "none", lg: "block" },
          fontSize: "var(--font-size-body)",
          color: "#5C6478",
        }}
        noWrap
      >
        {item.reason || "—"}
      </Typography>

      <Box sx={{ display: { xs: "none", lg: "flex" } }}>
        <StatusChip status={item.status} />
      </Box>
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <EstimateLabel item={item} now={now} />
      </Box>

      {/* Action column is not shown for calls that are currently processing. */}
      {showActions ? (
        <Box sx={{ justifySelf: "end" }}>
          <ActionsMenu
            name={item.patientName}
            menuWidth={200}
            items={actionItemsFor(item, onAction, { canMoveUp, canMoveDown, pauseDisabled, cancelDisabled })}
          />
        </Box>
      ) : null}
    </Box>
  );
}

export function CallQueueWorkspace() {
  const [now, setNow] = useState(() => Date.now());
  const [detailsItem, setDetailsItem] = useState<QueueCallItem | null>(null);
  const [processingPage, setProcessingPage] = useState(0);
  const [processingPageSize, setProcessingPageSize] = useState(5);
  const [waitingTablePage, setWaitingTablePage] = useState(0);
  const [waitingPageSize, setWaitingPageSize] = useState(10);
  const [startOutboundCall, { isLoading: startingCall }] = useStartOutboundCallMutation();
  const [setCallPaused, { isLoading: pausingCall }] = useSetCallPausedMutation();
  const [cancelCall, { isLoading: cancellingCall }] = useCancelCallMutation();
  const [actionError, setActionError] = useState("");

  const processingQueryArgs = useMemo(
    () => ({ page: processingPage + 1, pageSize: processingPageSize }),
    [processingPage, processingPageSize],
  );
  const waitingQueryArgs = useMemo(
    () => ({ page: waitingTablePage + 1, pageSize: waitingPageSize }),
    [waitingTablePage, waitingPageSize],
  );

  const {
    data: inProgressPage,
    isLoading: processingLoading,
    isFetching: processingFetching,
    isUninitialized: processingUninitialized,
    isError: processingIsError,
    error: processingError,
    refetch: refetchProcessing,
  } = useGetCallQueueQuery(processingQueryArgs, callQueueSubscriptionOptions);

  const {
    data: summary,
    refetch: refetchSummary,
  } = useGetCallSummaryQuery(undefined, callQueueSubscriptionOptions);

  const {
    data: queuedPage,
    isLoading: waitingLoading,
    isFetching: waitingFetching,
    isUninitialized: waitingUninitialized,
    isError: waitingIsError,
    error: waitingError,
    refetch: refetchWaiting,
  } = useGetQueuedCallQueueQuery(waitingQueryArgs, callQueueSubscriptionOptions);

  const [refreshing, setRefreshing] = useState(false);

  const showProcessingSkeleton =
    !processingIsError &&
    (processingUninitialized || processingLoading || (processingFetching && !inProgressPage));
  const showWaitingSkeleton =
    !waitingIsError &&
    (waitingUninitialized || waitingLoading || (waitingFetching && !queuedPage));

  async function refreshQueue() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([refetchProcessing(), refetchWaiting(), refetchSummary()]);
    } finally {
      setRefreshing(false);
    }
  }

  const processing = inProgressPage?.results ?? [];
  const processingCount = inProgressPage?.count ?? 0;
  const waiting = queuedPage?.results ?? [];
  const waitingCount = queuedPage?.count ?? 0;
  const queuedCount = summary?.queued ?? 0;
  const inProgressCount = summary?.in_progress ?? 0;
  const pausedCount = summary?.paused ?? 0;

  const processingMaxPage = Math.max(0, Math.ceil(processingCount / processingPageSize) - 1);
  if (processingPage > processingMaxPage) {
    setProcessingPage(processingMaxPage);
  }

  const waitingMaxPage = Math.max(0, Math.ceil(waitingCount / waitingPageSize) - 1);
  if (waitingTablePage > waitingMaxPage) {
    setWaitingTablePage(waitingMaxPage);
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!detailsItem) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [detailsItem]);

  const queueIsEmpty =
    processingCount === 0 &&
    waitingCount === 0 &&
    !showProcessingSkeleton &&
    !showWaitingSkeleton &&
    !processingIsError &&
    !waitingIsError;

  function onAction(id: string, action: QueueAction) {
    if (action === "details") {
      setDetailsItem(processing?.find((item) => item.id === id) ?? waiting.find((item) => item.id === id) ?? null);
      return;
    }
    if (action === "start") {
      setActionError("");
      void startOutboundCall({ id })
        .unwrap()
        .catch((error) => setActionError(getApiErrorMessage(error, "Could not start this call.")));
      return;
    }
    if (action === "pause") {
      const item = processing?.find((row) => row.id === id) ?? waiting.find((row) => row.id === id);
      const paused = item?.status !== "paused";
      setActionError("");
      void setCallPaused({ id, paused })
        .unwrap()
        .catch((error) =>
          setActionError(getApiErrorMessage(error, paused ? "Could not pause this call." : "Could not unpause this call.")),
        );
      return;
    }
    if (action === "cancel") {
      setActionError("");
      void cancelCall({ id })
        .unwrap()
        .catch((error) => setActionError(getApiErrorMessage(error, "Could not cancel this call.")));
    }
  }

  return (
    <Stack spacing={2} sx={{ minHeight: 0 }}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "text.primary", lineHeight: 1.25 }}>
            Call queue
          </Typography>
          <Typography sx={{ mt: 0.4, color: "text.secondary" }}>
            Manage outbound calls waiting to be placed, currently processing, or paused.
          </Typography>
          <QueueStatusLine
            queuedCount={queuedCount}
            inProgressCount={inProgressCount}
            pausedCount={pausedCount}
          />
        </Box>
        <IconButton
          aria-label="Refresh queue"
          onClick={() => void refreshQueue()}
          disabled={refreshing}
          sx={{
            flexShrink: 0,
            mt: 0.25,
            width: 36,
            height: 36,
            border: "1px solid #E5E9EF",
            borderRadius: "10px",
            color: "#1D5F9A",
            bgcolor: "#FFFFFF",
            "&:hover": { bgcolor: "#F3F8FD" },
            "& svg": refreshing
              ? { animation: "queue-refresh-spin 0.8s linear infinite" }
              : undefined,
            "@keyframes queue-refresh-spin": {
              from: { transform: "rotate(0deg)" },
              to: { transform: "rotate(360deg)" },
            },
          }}
        >
          <RefreshCw size={16} strokeWidth={2} />
        </IconButton>
      </Stack>

      {actionError ? (
        <Alert severity="error" onClose={() => setActionError("")}>
          {actionError}
        </Alert>
      ) : null}

      {queueIsEmpty ? (
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            border: "1px solid #E5E9EF",
            borderRadius: "10px",
            boxShadow: elevation.floatingPanel,
            px: 2,
            py: 6,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              bgcolor: "#F3F5F8",
              color: "#8B93A7",
              display: "grid",
              placeItems: "center",
              mx: "auto",
              mb: 1.5,
            }}
          >
            <Phone size={20} strokeWidth={1.75} />
          </Box>
          <Typography sx={{ fontWeight: 650, color: "text.primary" }}>Queue is clear</Typography>
          <Typography sx={{ mt: 0.5, fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
            No outbound calls are waiting or in progress right now.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          <Box
              sx={{
                bgcolor: "#FFFFFF",
                border: "1px solid #C9DBF2",
                borderRadius: "10px",
                boxShadow: elevation.floatingPanel,
                overflow: "hidden",
              }}
            >
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.35,
                  borderBottom: "1px solid #E2EEF9",
                  bgcolor: "#F3F8FD",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#2F72B9",
                      boxShadow: "0 0 0 4px rgba(47, 114, 185, 0.16)",
                    }}
                  />
                  <Typography sx={{ fontSize: 15, fontWeight: 650, color: "#1D5F9A" }}>
                    Currently processing
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: "var(--font-size-body)", color: "#5C6478" }}>
                  {showProcessingSkeleton ? "Loading" : `${processingCount} active`}
                </Typography>
              </Stack>
              {processingIsError ? (
                <Typography sx={{ px: 2, py: 3.5, textAlign: "center", color: "#D14343", fontSize: "var(--font-size-body)" }}>
                  {getApiErrorMessage(processingError, "Could not load calls that are currently processing.")}
                </Typography>
              ) : showProcessingSkeleton ? (
                <>
                  <QueueSkeletonRows count={Math.min(processingPageSize, 5)} />
                  <QueuePagerSkeleton />
                </>
              ) : !processing?.length ? (
                <Typography sx={{ px: 2, py: 3.5, textAlign: "center", color: "#8B93A7", fontSize: "var(--font-size-body)" }}>
                  No calls are on the line right now.
                </Typography>
              ) : (
                <>
                  <QueueTableHeader showActions={false} />
                  {processing?.map((item) => (
                    <QueueListRow
                      key={item.id}
                      item={item}
                      now={now}
                      canMoveUp={false}
                      canMoveDown={false}
                      highlight
                      showActions={false}
                      pauseDisabled={pausingCall}
                      cancelDisabled={cancellingCall}
                      onAction={onAction}
                    />
                  ))}
                  <TablePager
                    page={processingPage}
                    pageSize={processingPageSize}
                    rowCount={processingCount}
                    pageSizeOptions={[5, 10]}
                    onPageChange={setProcessingPage}
                    onPageSizeChange={(next) => {
                      setProcessingPageSize(next);
                      setProcessingPage(0);
                    }}
                  />
                </>
              )}
            </Box>

          <Box
            sx={{
              bgcolor: "#FFFFFF",
              border: "1px solid #E5E9EF",
              borderRadius: "10px",
              boxShadow: elevation.floatingPanel,
              overflow: "hidden",
            }}
          >
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.35,
                borderBottom: "1px solid #EEF0F4",
                bgcolor: "#FAFBFC",
              }}
            >
              <Typography sx={{ fontSize: 15, fontWeight: 650, color: "text.primary" }}>
                Waiting & needs attention
              </Typography>
              <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
                {showWaitingSkeleton
                  ? "Loading"
                  : waitingCount === 0
                    ? "None waiting"
                    : `${waitingCount} call${waitingCount === 1 ? "" : "s"}`}
              </Typography>
            </Stack>

            {waitingIsError ? (
              <Typography sx={{ px: 2, py: 3.5, textAlign: "center", color: "#D14343", fontSize: "var(--font-size-body)" }}>
                {getApiErrorMessage(waitingError, "Could not load calls waiting in the queue.")}
              </Typography>
            ) : showWaitingSkeleton ? (
              <>
                <QueueSkeletonRows count={Math.min(waitingPageSize, 5)} />
                <QueuePagerSkeleton />
              </>
            ) : waitingCount === 0 ? (
              <Typography
                sx={{ px: 2, py: 3.5, textAlign: "center", color: "#8B93A7", fontSize: "var(--font-size-body)" }}
              >
                {(processing?.length ?? 0) > 0
                  ? "All remaining capacity is on active calls."
                  : "No calls are waiting right now."}
              </Typography>
            ) : (
              <>
                <QueueTableHeader />
                {waiting.map((item) => (
                  <QueueListRow
                    key={item.id}
                    item={item}
                    now={now}
                    canMoveUp={false}
                    canMoveDown={false}
                    pauseDisabled={pausingCall}
                    cancelDisabled={cancellingCall}
                    onAction={onAction}
                  />
                ))}
                <TablePager
                  page={waitingTablePage}
                  pageSize={waitingPageSize}
                  rowCount={waitingCount}
                  pageSizeOptions={[5, 10, 20]}
                  onPageChange={setWaitingTablePage}
                  onPageSizeChange={(next) => {
                    setWaitingPageSize(next);
                    setWaitingTablePage(0);
                  }}
                />
              </>
            )}
          </Box>
        </Stack>
      )}

      <Dialog
        open={Boolean(detailsItem)}
        onClose={() => setDetailsItem(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              boxShadow: elevation.floating,
              border: "1px solid #E5E9EF",
            },
          },
        }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Call details
          <IconButton
            aria-label="Close"
            onClick={() => setDetailsItem(null)}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailsItem ? (
            <Stack spacing={1.5}>
              <DetailRow label="Patient" value={detailsItem.patientName} />
              <DetailRow label="Phone" value={detailsItem.phone} />
              <DetailRow label="Channel" value={channelMeta[detailsItem.channel].label} />
              <DetailRow label="Doctor" value={detailsItem.doctor || "—"} />
              <DetailRow label="Reason" value={detailsItem.reason || "—"} />
              <DetailRow label="Queue position" value={`#${detailsItem.position}`} />
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ width: 130, color: "#8B93A7", fontSize: "var(--font-size-body)" }}>
                  Status
                </Typography>
                <StatusChip status={detailsItem.status} />
              </Stack>
              <DetailRow label="Estimate" value={estimateText(detailsItem, now)} />
              <DetailRow label="Waiting" value={formatWait(detailsItem.queuedAt, now)} />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="secondary" onClick={() => setDetailsItem(null)}>
            Close
          </Button>
          {detailsItem && detailsItem.status !== "in_progress" && detailsItem.status !== "cancelled" ? (
            <Button
              variant="soft"
              startIcon={<CirclePlay size={15} />}
              disabled={startingCall}
              onClick={() => {
                onAction(detailsItem.id, "start");
                setDetailsItem(null);
              }}
            >
              Start Call
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
      <Typography sx={{ width: 130, flexShrink: 0, color: "#8B93A7", fontSize: "var(--font-size-body)" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "var(--font-size-body)", color: "text.primary", fontWeight: 550 }}>
        {value}
      </Typography>
    </Stack>
  );
}
