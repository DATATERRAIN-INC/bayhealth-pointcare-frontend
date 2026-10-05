"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { Menu as MenuIcon } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { ConfirmLogoutDialog } from "@/components/auth/ConfirmLogoutDialog";
import { BachLogo } from "@/components/brand/BachLogo";
import { logout } from "@/lib/auth";
import {
  useGetNotificationsQuery,
  useGetNotificationSummaryQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/lib/api/notificationsApi";
import type { NotificationItem } from "@/types/notification";
import type { User } from "@/types/user";

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

function NotificationsMenu({
  anchorEl,
  onClose,
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}) {
  const open = Boolean(anchorEl);
  const { data: summary } = useGetNotificationSummaryQuery(undefined, { pollingInterval: 30000 });
  const { data, isLoading, isFetching, isError } = useGetNotificationsQuery(
    { page: 1, pageSize: 10 },
    { skip: !open },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();
  const items = data?.results ?? [];
  const unread = summary?.unread ?? 0;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            width: 360,
            maxWidth: "calc(100vw - 24px)",
            mt: 1,
            borderRadius: 2,
            boxShadow: "0 10px 32px rgba(15, 23, 42, 0.14), 0 2px 10px rgba(15, 23, 42, 0.06)",
            border: "1px solid #F1F5F9",
          },
        },
      }}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, gap: 1 }}>
        <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 700, letterSpacing: "0.06em", color: "#8B93A7" }}>
          NOTIFICATIONS
        </Typography>
        <Button
          variant="text"
          disabled={unread === 0 || isMarkingAll}
          onClick={() => void markAllRead()}
          sx={{ minWidth: 0, px: 0.5, fontSize: "var(--font-size-body)", fontWeight: 600, textTransform: "none" }}
        >
          Mark all read
        </Button>
      </Stack>
      <Divider />
      <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
        {isLoading || (isFetching && items.length === 0) ? (
          <Stack spacing={1.25} sx={{ px: 2, py: 1.5 }}>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={`notification-skeleton-${index}`} variant="rounded" height={42} sx={{ bgcolor: "#E9EEF4" }} />
            ))}
          </Stack>
        ) : isError ? (
          <Typography sx={{ px: 2, py: 2, fontSize: "var(--font-size-body)", color: "#D14343" }}>
            Could not load notifications.
          </Typography>
        ) : items.length === 0 ? (
          <Typography sx={{ px: 2, py: 2, fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
            No notifications yet.
          </Typography>
        ) : (
          items.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              onOpen={() => {
                if (!item.is_read) void markRead(item.id);
              }}
            />
          ))
        )}
      </Box>
      <Divider />
      <MenuItem
        component={Link}
        href="/notifications"
        onClick={onClose}
        sx={{ justifyContent: "center", fontSize: "var(--font-size-body)", fontWeight: 600, color: "primary.main" }}
      >
        View all notifications
      </MenuItem>
    </Menu>
  );
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

function NotificationRow({ item, onOpen }: { item: NotificationItem; onOpen: () => void }) {
  const status = patientStatusFrom(item);
  const statusColors = status ? statusChipColors(status) : null;

  return (
    <MenuItem onClick={onOpen} sx={{ py: 1.25, alignItems: "flex-start", whiteSpace: "normal", gap: 1 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          mt: 0.7,
          borderRadius: "50%",
          flexShrink: 0,
          bgcolor: item.is_read ? "transparent" : "primary.main",
        }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: "var(--font-size-body)",
                fontWeight: item.is_read ? 500 : 700,
                color: "text.primary",
              }}
            >
              {item.title}
            </Typography>
            {item.message ? (
              <Typography sx={{ mt: 0.25, fontSize: "var(--font-size-body)", color: "text.secondary", lineHeight: 1.4 }}>
                {item.message}
              </Typography>
            ) : null}
          </Box>
          <Stack spacing={0.5} sx={{ alignItems: "flex-end", flexShrink: 0 }}>
            {status && statusColors ? (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  px: 0.8,
                  py: 0.15,
                  borderRadius: "999px",
                  fontSize: 11,
                  fontWeight: 700,
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
    </MenuItem>
  );
}

interface AppTopBarProps {
  user: User;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function AppTopBar({ user, sidebarOpen, onToggleSidebar }: AppTopBarProps) {
  const router = useRouter();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { data: notificationSummary } = useGetNotificationSummaryQuery(undefined, { pollingInterval: 30000 });
  const unreadCount = notificationSummary?.unread ?? 0;

  function handleLogoutConfirm() {
    setLogoutOpen(false);
    logout();
    router.replace("/login");
  }

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        flexShrink: 0,
        bgcolor: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #EEF0F4",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "relative",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: { xs: 64, lg: 72 },
          px: { xs: 1.5, lg: 3 },
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
          <Tooltip title={sidebarOpen ? "Hide menu" : "Show menu"} placement="bottom" arrow>
            <IconButton
              onClick={onToggleSidebar}
              aria-label={sidebarOpen ? "Hide menu" : "Show menu"}
              aria-expanded={sidebarOpen}
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                border: "1px solid #E6E8EE",
                borderRadius: 1,
                color: "#667085",
                bgcolor: "#FFFFFF",
                "&:hover": { bgcolor: "#F8FAFC", color: "#344054" },
              }}
            >
              {sidebarOpen ? <MenuOpenIcon sx={{ fontSize: 22 }} /> : <MenuIcon size={20} strokeWidth={1.75} />}
            </IconButton>
          </Tooltip>

          <Box sx={{ display: { xs: "none", lg: sidebarOpen ? "none" : "block" } }}>
            <BachLogo width={148} />
          </Box>
        </Stack>

        <Box
          sx={{
            display: { xs: "block", lg: "none" },
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        >
          <BachLogo width={148} />
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
          <IconButton
            onClick={(event: MouseEvent<HTMLElement>) => setNotifAnchor(event.currentTarget)}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            sx={{
              width: 40,
              height: 40,
              border: "1px solid #E6E8EE",
              borderRadius: 2,
              color: "#4B5568",
            }}
          >
            <Badge color="primary" badgeContent={unreadCount} invisible={unreadCount === 0} overlap="circular">
              <NotificationsNoneIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          <NotificationsMenu anchorEl={notifAnchor} onClose={() => setNotifAnchor(null)} />

          <IconButton
            onClick={(event: MouseEvent<HTMLElement>) => setMenuAnchor(event.currentTarget)}
            aria-label="Account menu"
            sx={{
              display: { xs: "none", lg: "inline-flex" },
              height: 40,
              px: 1,
              gap: 1,
              border: "1px solid #E6E8EE",
              borderRadius: 999,
              bgcolor: "#FFFFFF",
              "&:hover": { bgcolor: "#F8FAFC" },
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "var(--font-size-body)",
                fontWeight: 700,
              }}
            >
              {user.avatarInitials}
            </Box>
            <Typography
              sx={{
                fontSize: "var(--font-size-body)",
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              {user.name.split(" ")[0]}
            </Typography>
            <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#6B7280" }} />
          </IconButton>

          <Box
            component="button"
            type="button"
            aria-label="Account menu"
            onClick={(event: MouseEvent<HTMLElement>) => setMenuAnchor(event.currentTarget)}
            sx={{
              display: { xs: "inline-flex", lg: "none" },
              alignItems: "center",
              maxWidth: 120,
              height: 34,
              px: 1.75,
              border: "1px solid #E4D3A8",
              borderRadius: 999,
              bgcolor: "#FFFFFF",
              color: "text.primary",
              fontFamily: "inherit",
              fontSize: "var(--font-size-body)",
              fontWeight: 600,
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.name.split(" ")[0]}
          </Box>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  width: 220,
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: "0 10px 32px rgba(15, 23, 42, 0.14), 0 2px 10px rgba(15, 23, 42, 0.06)",
                  border: "1px solid #F1F5F9",
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 600 }}>{user.name}</Typography>
              <Typography sx={{ fontSize: "var(--font-size-body)", color: "text.secondary" }} noWrap>
                {user.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setLogoutOpen(true);
              }}
              sx={{ fontSize: "var(--font-size-body)" }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <LogoutIcon sx={{ fontSize: 16 }} />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>

      <ConfirmLogoutDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </Box>
  );
}
