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
  Trash2,
  X,
} from "lucide-react";
import { channelMeta } from "@/data/gapCalls";
import { createDummyCallQueue, reindexQueueItems } from "@/data/dummyCallQueue";
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

const QUEUE_TABLE_COLUMNS = "48px minmax(0, 1.4fr) minmax(0, 1fr) 108px 110px 100px 44px";
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
      {["#", "Patient", "Reason", "Status", "Estimate", "Wait", "Action"].map((heading) => (
        <Typography
          key={heading}
          sx={{
            fontSize: "var(--font-size-body)",
            fontWeight: 650,
            color: "#8B93A7",
            textAlign: heading === "Wait" || heading === "Action" ? "right" : "left",
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
  now,
  canMoveUp,
  canMoveDown,
  onAction,
  highlight,
}: {
  item: QueueCallItem;
  now: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAction: (id: string, action: QueueAction) => void;
  highlight?: boolean;
}) {
  const waitFrom = item.queuedAt || item.startedAt;
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

      <Typography
        sx={{
          display: { xs: "none", lg: "block" },
          fontSize: "var(--font-size-body)",
          fontWeight: 600,
          color: "#3F4A5A",
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
        }}
      >
        {formatWait(waitFrom, now)}
      </Typography>

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

function estimateForStatus(status: QueueStatus, positionAmongQueued: number): ProcessingEstimate {
  if (status === "in_progress") return "active";
  if (status === "paused") return "on_hold";
  if (status === "failed") return "needs_retry";
  if (status === "completed") return "done";
  if (status === "cancelled") return "removed";
  if (positionAmongQueued <= 1) return "next";
  if (positionAmongQueued === 2) return "about_2m";
  if (positionAmongQueued <= 4) return "about_5m";
  return "about_10m";
}

export function CallQueueWorkspace() {
  const [now, setNow] = useState(() => Date.now());
  const [items, setItems] = useState<QueueCallItem[]>(() => createDummyCallQueue().items);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [processingPage, setProcessingPage] = useState(0);
  const [processingPageSize, setProcessingPageSize] = useState(5);
  const [waitingPage, setWaitingPage] = useState(0);
  const [waitingPageSize, setWaitingPageSize] = useState(10);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const processing = useMemo(
    () => items.filter((item) => item.status === "in_progress"),
    [items],
  );
  const waiting = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === "queued" ||
          item.status === "paused" ||
          item.status === "failed",
      ),
    [items],
  );
  const failedCount = useMemo(
    () => items.filter((item) => item.status === "failed").length,
    [items],
  );
  const queuedCount = useMemo(
    () => items.filter((item) => item.status === "queued" || item.status === "paused").length,
    [items],
  );

  const detailsItem = detailsId ? items.find((item) => item.id === detailsId) ?? null : null;
  const visibleWaiting = waiting.filter((item) => item.status !== "cancelled");

  const pagedProcessing = useMemo(() => {
    const start = processingPage * processingPageSize;
    return processing.slice(start, start + processingPageSize);
  }, [processing, processingPage, processingPageSize]);

  const pagedWaiting = useMemo(() => {
    const start = waitingPage * waitingPageSize;
    return visibleWaiting.slice(start, start + waitingPageSize);
  }, [visibleWaiting, waitingPage, waitingPageSize]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(processing.length / processingPageSize) - 1);
    if (processingPage > maxPage) setProcessingPage(maxPage);
  }, [processing.length, processingPage, processingPageSize]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(visibleWaiting.length / waitingPageSize) - 1);
    if (waitingPage > maxPage) setWaitingPage(maxPage);
  }, [visibleWaiting.length, waitingPage, waitingPageSize]);

  function onAction(id: string, action: QueueAction) {
    if (action === "details") {
      setDetailsId(id);
      return;
    }

    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      if (index < 0) return current;
      const item = current[index];
      let next = [...current];

      if (action === "start") {
        next[index] = {
          ...item,
          status: "in_progress",
          estimate: "active",
          startedAt: new Date().toISOString(),
        };
      } else if (action === "pause") {
        next[index] = { ...item, status: "paused", estimate: "on_hold" };
      } else if (action === "cancel") {
        next[index] = { ...item, status: "cancelled", estimate: "removed" };
      } else if (action === "move_up" || action === "move_down") {
        const movable = next
          .map((row, rowIndex) => ({ row, rowIndex }))
          .filter(({ row }) => row.status === "queued" || row.status === "paused" || row.status === "failed");
        const movableIndex = movable.findIndex(({ row }) => row.id === id);
        if (movableIndex < 0) return current;
        const swapWith = action === "move_up" ? movableIndex - 1 : movableIndex + 1;
        if (swapWith < 0 || swapWith >= movable.length) return current;
        const a = movable[movableIndex].rowIndex;
        const b = movable[swapWith].rowIndex;
        const copy = [...next];
        const tmpPos = copy[a].position;
        copy[a] = { ...copy[a], position: copy[b].position };
        copy[b] = { ...copy[b], position: tmpPos };
        next = copy;
      }

      // Apply estimates after mutation via commit-like logic
      const reindexed = reindexQueueItems(next);
      const queuedOnly = reindexed.filter(
        (row) => row.status === "queued" || row.status === "paused" || row.status === "failed",
      );
      return reindexed.map((row) => {
        if (row.status === "in_progress") return { ...row, estimate: "active" as const };
        if (row.status === "paused") return { ...row, estimate: "on_hold" as const };
        if (row.status === "failed") return { ...row, estimate: "needs_retry" as const };
        if (row.status === "completed") return { ...row, estimate: "done" as const };
        if (row.status === "cancelled") return { ...row, estimate: "removed" as const };
        const among = queuedOnly.findIndex((q) => q.id === row.id) + 1;
        return { ...row, estimate: estimateForStatus(row.status, among) };
      });
    });
  }

  function clearQueue() {
    setItems((current) =>
      reindexQueueItems(
        current.map((item) =>
          item.status === "queued" || item.status === "paused" || item.status === "failed"
            ? { ...item, status: "cancelled" as const, estimate: "removed" as const }
            : item,
        ),
      ),
    );
  }

  const clearableCount = items.filter(
    (item) => item.status === "queued" || item.status === "paused" || item.status === "failed",
  ).length;

  return (
    <Stack spacing={2} sx={{ minHeight: 0 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ alignItems: { md: "flex-start" }, justifyContent: "space-between" }}
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
            inProgressCount={processing.length}
            failedCount={failedCount}
          />
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1.15,
              py: 0.55,
              borderRadius: "999px",
              bgcolor: "#FEF3C7",
              color: "#B45309",
              fontSize: "var(--font-size-body)",
              fontWeight: 650,
            }}
          >
            Demo data
          </Box>
          <Button
            variant="secondary"
            startIcon={<Trash2 size={15} />}
            disabled={clearableCount === 0}
            onClick={clearQueue}
            sx={{ px: 1.75 }}
          >
            Clear Queue
          </Button>
        </Stack>
      </Stack>

      {items.length === 0 ? (
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
          {processing.length > 0 ? (
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
                  {processing.length} active
                </Typography>
              </Stack>
              <QueueTableHeader />
              {pagedProcessing.map((item) => (
                <QueueListRow
                  key={item.id}
                  item={item}
                  now={now}
                  canMoveUp={false}
                  canMoveDown={false}
                  highlight
                  onAction={onAction}
                />
              ))}
              {processing.length > 0 ? (
                <TablePager
                  page={processingPage}
                  pageSize={processingPageSize}
                  rowCount={processing.length}
                  pageSizeOptions={[5, 10]}
                  onPageChange={setProcessingPage}
                  onPageSizeChange={setProcessingPageSize}
                />
              ) : null}
            </Box>
          ) : null}

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
                {visibleWaiting.length === 0
                  ? "None waiting"
                  : `${visibleWaiting.length} call${visibleWaiting.length === 1 ? "" : "s"}`}
              </Typography>
            </Stack>

            {visibleWaiting.length === 0 ? (
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
                {pagedWaiting.map((item, index) => {
                  const absoluteIndex = waitingPage * waitingPageSize + index;
                  return (
                    <QueueListRow
                      key={item.id}
                      item={item}
                      now={now}
                      canMoveUp={absoluteIndex > 0}
                      canMoveDown={absoluteIndex < visibleWaiting.length - 1}
                      onAction={onAction}
                    />
                  );
                })}
                {visibleWaiting.length > 0 ? (
                  <TablePager
                    page={waitingPage}
                    pageSize={waitingPageSize}
                    rowCount={visibleWaiting.length}
                    pageSizeOptions={[5, 10, 20]}
                    onPageChange={setWaitingPage}
                    onPageSizeChange={setWaitingPageSize}
                  />
                ) : null}
              </>
            )}
          </Box>
        </Stack>
      )}

      <Dialog
        open={Boolean(detailsItem)}
        onClose={() => setDetailsId(null)}
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
            onClick={() => setDetailsId(null)}
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
          <Button variant="secondary" onClick={() => setDetailsId(null)}>
            Close
          </Button>
          {detailsItem && detailsItem.status !== "in_progress" && detailsItem.status !== "cancelled" ? (
            <Button
              variant="soft"
              startIcon={<CirclePlay size={15} />}
              onClick={() => {
                onAction(detailsItem.id, "start");
                setDetailsId(null);
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
