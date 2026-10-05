"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Button } from "@/components/ui/Button";
import { TablePager } from "@/components/shared/TablePager";
import {
  useGetNotificationsQuery,
  useGetNotificationSummaryQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/lib/api/notificationsApi";
import type { NotificationItem } from "@/types/notification";
import { elevation } from "@/lib/theme/tokens";

const PAGE_SIZE = 10;

type FilterTab = "all" | "unread" | "read";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function patientStatusFrom(item: NotificationItem): string {
  const meta = item.metadata ?? {};
  const candidates = [
    meta.patient_status,
    meta.status,
    meta.call_status,
    meta.patientStatus,
    meta.callStatus,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (typeof meta.is_blocked === "boolean") return meta.is_blocked ? "Blocked" : "Active";
  if (typeof meta.blocked === "boolean") return meta.blocked ? "Blocked" : "Active";
  return "";
}

function statusChipColors(status: string): { color: string; bgcolor: string } {
  const normalized = status.trim().toLowerCase();
  if (normalized.includes("block")) return { color: "#D14343", bgcolor: "#FDECEC" };
  if (normalized.includes("active") || normalized.includes("success") || normalized.includes("complete")) {
    return { color: "#178A45", bgcolor: "#E5F6EC" };
  }
  if (normalized.includes("fail") || normalized.includes("error") || normalized.includes("miss")) {
    return { color: "#D14343", bgcolor: "#FDECEC" };
  }
  if (normalized.includes("pending") || normalized.includes("progress") || normalized.includes("call")) {
    return { color: "#1D5F9A", bgcolor: "#EAF3FB" };
  }
  return { color: "#526071", bgcolor: "#F0F2F5" };
}

function NotificationCard({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen: () => void;
}) {
  const status = patientStatusFrom(item);
  const statusColors = status ? statusChipColors(status) : null;

  return (
    <Box
      component="button"
      type="button"
      onClick={onOpen}
      sx={{
        display: "block",
        width: "100%",
        textAlign: "left",
        border: "1px solid #E6EAF0",
        borderRadius: "12px",
        px: 1.75,
        py: 1.5,
        bgcolor: item.is_read ? "#FFFFFF" : "#F7FBFF",
        cursor: "pointer",
        fontFamily: "inherit",
        "&:hover": { borderColor: "#D5DCE6", bgcolor: item.is_read ? "#F8FAFC" : "#F0F7FD" },
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            mt: 0.85,
            borderRadius: "50%",
            flexShrink: 0,
            bgcolor: item.is_read ? "transparent" : "primary.main",
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: "var(--font-size-body)",
                  fontWeight: item.is_read ? 600 : 700,
                  color: "text.primary",
                  lineHeight: 1.35,
                }}
              >
                {item.title}
              </Typography>
              {item.message ? (
                <Typography sx={{ mt: 0.35, fontSize: "var(--font-size-body)", color: "#5C6478", lineHeight: 1.45 }}>
                  {item.message}
                </Typography>
              ) : null}
            </Box>
            <Stack spacing={0.6} sx={{ alignItems: "flex-end", flexShrink: 0, pt: 0.1 }}>
              {status && statusColors ? (
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    px: 0.9,
                    py: 0.2,
                    borderRadius: "999px",
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.4,
                    color: statusColors.color,
                    bgcolor: statusColors.bgcolor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {status}
                </Box>
              ) : null}
              <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7", whiteSpace: "nowrap" }}>
                {timeAgo(item.created_at)}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

function NotificationRowSkeleton() {
  const bone = { bgcolor: "#E9EEF4", borderRadius: "6px" } as const;
  return (
    <Box
      sx={{
        border: "1px solid #E6EAF0",
        borderRadius: "12px",
        px: 1.75,
        py: 1.5,
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
        <Skeleton variant="circular" animation="wave" width={8} height={8} sx={{ mt: 0.85, bgcolor: "#E9EEF4" }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Skeleton variant="rounded" animation="wave" width="58%" height={16} sx={bone} />
              <Skeleton variant="rounded" animation="wave" width="82%" height={12} sx={{ ...bone, mt: 0.85 }} />
            </Box>
            <Stack spacing={0.7} sx={{ alignItems: "flex-end", flexShrink: 0 }}>
              <Skeleton variant="rounded" animation="wave" width={64} height={20} sx={{ ...bone, borderRadius: "999px" }} />
              <Skeleton variant="rounded" animation="wave" width={52} height={12} sx={bone} />
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export function Notifications() {
  const listRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<FilterTab>("all");
  const isRead = filter === "all" ? undefined : filter === "read";

  const { data: summary } = useGetNotificationSummaryQuery(undefined, { pollingInterval: 30000 });
  const { data, isUninitialized, isLoading, isError, isFetching } = useGetNotificationsQuery({
    page: page + 1,
    pageSize: PAGE_SIZE,
    isRead,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const items = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const unread = summary?.unread ?? 0;
  const read = summary?.read ?? 0;
  const allCount = unread + read;
  const showSkeleton = !isError && (isUninitialized || isLoading || isFetching);

  const emptyLabel = useMemo(() => {
    if (filter === "unread") return "No unread notifications.";
    if (filter === "read") return "No read notifications.";
    return "No notifications yet.";
  }, [filter]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [page, filter]);

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid #E5E9EF",
        borderRadius: "10px",
        boxShadow: elevation.floatingPanel,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: { xs: "calc(100vh - 160px)", md: "calc(100vh - 180px)" },
        maxHeight: { xs: "calc(100vh - 160px)", md: "calc(100vh - 180px)" },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        sx={{
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #E9EDF2",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 650, color: "text.primary" }}>
          All notifications
        </Typography>
        <Button
          type="button"
          variant="secondary"
          disabled={unread === 0 || isMarkingAll || showSkeleton}
          loading={isMarkingAll}
          onClick={() => void markAllRead()}
          sx={{ alignSelf: { xs: "stretch", sm: "auto" }, px: 2 }}
        >
          Mark all read
        </Button>
      </Stack>

      <Box sx={{ px: 1.5, pt: 1, borderBottom: "1px solid #EEF0F4", flexShrink: 0 }}>
        <Tabs
          value={filter}
          onChange={(_event, value: FilterTab) => {
            setFilter(value);
            setPage(0);
          }}
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              minHeight: 40,
              textTransform: "none",
              fontSize: "var(--font-size-body)",
              fontWeight: 600,
            },
          }}
        >
          <Tab value="all" label={`All (${allCount})`} />
          <Tab value="unread" label={`Unread (${unread})`} />
          <Tab value="read" label={`Read (${read})`} />
        </Tabs>
      </Box>

      <Box
        ref={listRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          p: 1.5,
          position: "relative",
        }}
      >
        {showSkeleton ? (
          <Stack spacing={1.25}>
            {Array.from({ length: PAGE_SIZE }, (_, index) => (
              <NotificationRowSkeleton key={`notification-page-skeleton-${index}`} />
            ))}
          </Stack>
        ) : isError ? (
          <Typography sx={{ py: 4, textAlign: "center", color: "#D92D20", fontSize: "var(--font-size-body)" }}>
            Could not load notifications. Check the API connection and try again.
          </Typography>
        ) : items.length === 0 ? (
          <Typography sx={{ py: 4, textAlign: "center", color: "#8B93A7", fontSize: "var(--font-size-body)" }}>
            {emptyLabel}
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {items.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onOpen={() => {
                  if (!item.is_read) void markRead(item.id);
                }}
              />
            ))}
          </Stack>
        )}
      </Box>

      {!isError ? (
        <Box sx={{ flexShrink: 0, borderTop: "1px solid #EEF0F4" }}>
          <TablePager
            page={page}
            pageSize={PAGE_SIZE}
            rowCount={showSkeleton && !data ? 0 : totalCount}
            pageSizeOptions={[PAGE_SIZE]}
            onPageChange={setPage}
            onPageSizeChange={() => undefined}
          />
        </Box>
      ) : null}
    </Box>
  );
}
