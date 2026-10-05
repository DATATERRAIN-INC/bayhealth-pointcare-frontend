"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
  useGetQueuedCallQueueQuery,
  useStartOutboundCallMutation,
} from "@/lib/api/callsApi";
import { getApiErrorMessage } from "@/lib/apiError";
import { ActionsMenu } from "@/components/shared/ActionsMenu";
import { TablePager } from "@/components/shared/TablePager";
import { Button } from "@/components/ui/Button";
import { elevation } from "@/lib/theme/tokens";
import type {
  ProcessingEstimate,
  QueueCallItem,
  QueueStatus,
} from "@/types/queue";
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

function EstimateLabel({ estimate }: { estimate: ProcessingEstimate }) {
  return (
    <Typography sx={{ fontSize: "var(--font-size-body)", color: "#5C6478", fontWeight: 500 }}>
      {processingEstimateMeta[estimate]}
    </Typography>
  );
}

function QueueStatusLine({
  queuedCount,
  inProgressCount,
  failedCount,
}: {
  queuedCount: number;
  inProgressCount: number;
  failedCount: number;
}) {
  const parts = [
    { label: "queued", value: queuedCount, color: "#5C6478" },
    { label: "in progress", value: inProgressCount, color: "#1D5F9A" },
    { label: "failed", value: failedCount, color: failedCount > 0 ? "#D14343" : "#5C6478" },
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
              opacity: part.value === 0 && part.label === "failed" ? 0.35 : 1,
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

function QueueTableHeader() {
  return (
    <Box
      sx={{
        display: { xs: "none", lg: "grid" },
        gridTemplateColumns: QUEUE_TABLE_COLUMNS,
        columnGap: 1.25,
        px: 2,
        py: 1,
        borderBottom: "1px solid #F0F2F5",
      }}
    >
      {["#", "Patient", "Reason", "Status", "Estimate", "Action"].map((heading) => (
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

function actionItemsFor(
  item: QueueCallItem,
  onAction: (id: string, action: QueueAction) => void,
  opts?: { isActive?: boolean; canMoveUp?: boolean; canMoveDown?: boolean },
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
      label: "Pause Call",
      icon: <Pause size={15} />,
      disabled: !(isActive || item.status === "queued"),
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
      disabled: item.status === "cancelled" || item.status === "completed",
      onClick: () => onAction(item.id, "cancel"),
    },
  ];
}

function QueueListRow({
  item,
  canMoveUp,
  canMoveDown,
  onAction,
  highlight,
}: {
  item: QueueCallItem;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAction: (id: string, action: QueueAction) => void;
  highlight?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: QUEUE_TABLE_COLUMNS_XS,
          lg: QUEUE_TABLE_COLUMNS,
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
        <EstimateLabel estimate={item.estimate} />
      </Box>

      <Box sx={{ justifySelf: "end" }}>
        <ActionsMenu
          name={item.patientName}
          menuWidth={200}
          items={actionItemsFor(item, onAction, { canMoveUp, canMoveDown })}
        />
      </Box>
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

  const processingQueryArgs = useMemo(
    () => ({ page: processingPage + 1, pageSize: processingPageSize }),
    [processingPage, processingPageSize],
  );
  const waitingQueryArgs = useMemo(
    () => ({ page: waitingTablePage + 1, pageSize: waitingPageSize }),
    [waitingTablePage, waitingPageSize],
  );

  const [pollWhileActive, setPollWhileActive] = useState(false);
  const queueSubscriptionOptions = useMemo(
    () => callQueueSubscriptionOptions(pollWhileActive),
    [pollWhileActive],
  );

  const {
    data: inProgressPage,
    isLoading: processingLoading,
    isError: processingIsError,
    error: processingError,
    refetch: refetchProcessing,
  } = useGetCallQueueQuery(processingQueryArgs, queueSubscriptionOptions);

  const {
    data: queuedPage,
    isLoading: waitingLoading,
    isError: waitingIsError,
    error: waitingError,
    refetch: refetchWaiting,
  } = useGetQueuedCallQueueQuery(waitingQueryArgs, queueSubscriptionOptions);

  const [refreshing, setRefreshing] = useState(false);

  async function refreshQueue() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([refetchProcessing(), refetchWaiting()]);
    } finally {
      setRefreshing(false);
    }
  }

  const processing = inProgressPage?.results ?? [];
  const processingCount = inProgressPage?.count ?? 0;
  const waiting = queuedPage?.results ?? [];
  const waitingCount = queuedPage?.count ?? 0;
  const failedCount = 0;
  const queuedCount = waitingCount;

  useEffect(() => {
    const active = processingCount > 0 || waitingCount > 0;
    setPollWhileActive((current) => (current === active ? current : active));
  }, [processingCount, waitingCount]);

  useEffect(() => {
    if (!detailsItem) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [detailsItem]);

  const queueIsEmpty =
    processingCount === 0 &&
    waitingCount === 0 &&
    !processingLoading &&
    !waitingLoading &&
    !processingIsError &&
    !waitingIsError;

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(processingCount / processingPageSize) - 1);
    if (processingPage > maxPage) setProcessingPage(maxPage);
  }, [processingCount, processingPage, processingPageSize]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(waitingCount / waitingPageSize) - 1);
    if (waitingTablePage > maxPage) setWaitingTablePage(maxPage);
  }, [waitingCount, waitingTablePage, waitingPageSize]);

  function onAction(id: string, action: QueueAction) {
    if (action === "details") {
      setDetailsItem(processing.find((item) => item.id === id) ?? waiting.find((item) => item.id === id) ?? null);
      return;
    }
    if (action === "start") {
      void startOutboundCall({ id }).unwrap().catch(() => undefined);
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
            Manage outbound calls waiting to be placed, currently processing, or failed.
          </Typography>
          <QueueStatusLine
            queuedCount={queuedCount}
            inProgressCount={processingCount}
            failedCount={failedCount}
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
                  {processingLoading && !inProgressPage
                    ? "Loading"
                    : `${processingCount} active`}
                </Typography>
              </Stack>
              {processingIsError ? (
                <Typography sx={{ px: 2, py: 3.5, textAlign: "center", color: "#D14343", fontSize: "var(--font-size-body)" }}>
                  {getApiErrorMessage(processingError, "Could not load calls that are currently processing.")}
                </Typography>
              ) : processingLoading && processing.length === 0 ? (
                <Typography sx={{ px: 2, py: 3.5, textAlign: "center", color: "#8B93A7", fontSize: "var(--font-size-body)" }}>
                  Loading active calls…
                </Typography>
              ) : processing.length === 0 ? (
                <Typography sx={{ px: 2, py: 3.5, textAlign: "center", color: "#8B93A7", fontSize: "var(--font-size-body)" }}>
                  No calls are on the line right now.
                </Typography>
              ) : (
                <>
                  <QueueTableHeader />
                  {processing.map((item) => (
                    <QueueListRow
                      key={item.id}
                      item={item}
                      canMoveUp={false}
                      canMoveDown={false}
                      highlight
                      onAction={onAction}
                    />
                  ))}
                  <TablePager
                    page={processingPage}
                    pageSize={processingPageSize}
                    rowCount={processingCount}
                    pageSizeOptions={[5, 10]}
                    onPageChange={setProcessingPage}
                    onPageSizeChange={setProcessingPageSize}
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
                {waitingLoading && !queuedPage
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
            ) : waitingLoading && waiting.length === 0 ? (
              <Typography sx={{ px: 2, py: 3.5, textAlign: "center", color: "#8B93A7", fontSize: "var(--font-size-body)" }}>
                Loading waiting calls…
              </Typography>
            ) : waitingCount === 0 ? (
              <Typography
                sx={{ px: 2, py: 3.5, textAlign: "center", color: "#8B93A7", fontSize: "var(--font-size-body)" }}
              >
                {processing.length > 0
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
                    canMoveUp={false}
                    canMoveDown={false}
                    onAction={onAction}
                  />
                ))}
                <TablePager
                  page={waitingTablePage}
                  pageSize={waitingPageSize}
                  rowCount={waitingCount}
                  pageSizeOptions={[5, 10, 20]}
                  onPageChange={setWaitingTablePage}
                  onPageSizeChange={setWaitingPageSize}
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
              <DetailRow label="Estimate" value={processingEstimateMeta[detailsItem.estimate]} />
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
