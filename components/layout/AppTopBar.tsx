"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsIcon from "@mui/icons-material/Settings";
import { useState, type MouseEvent } from "react";
import { ConfirmLogoutDialog } from "@/components/auth/ConfirmLogoutDialog";
import { logout } from "@/lib/auth";
import type { User } from "@/types/user";

interface AppTopBarProps {
  user: User;
}

export function AppTopBar({ user }: AppTopBarProps) {
  const router = useRouter();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

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
        bgcolor: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #EEF0F4",
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
          justifyContent: "flex-end",
          minHeight: 72,
          pl: { xs: 7, lg: 3 },
          pr: { xs: 2, lg: 3 },
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
          <IconButton
            onClick={(event: MouseEvent<HTMLElement>) => setNotifAnchor(event.currentTarget)}
            aria-label="Notifications"
            sx={{
              width: 40,
              height: 40,
              border: "1px solid #E6E8EE",
              borderRadius: 2,
              color: "#4B5568",
            }}
          >
            <Badge color="primary" variant="dot" overlap="circular">
              <NotificationsNoneIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { width: 300, mt: 1, borderRadius: 2 } } }}
          >
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 700, letterSpacing: "0.06em", color: "#8B93A7" }}>
                NOTIFICATIONS
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => setNotifAnchor(null)} sx={{ py: 1.25, alignItems: "flex-start" }}>
              <Box>
                <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 600 }}>3 calls awaiting review</Typography>
                <Typography sx={{ fontSize: "var(--font-size-body)", color: "text.secondary" }}>Updated 12 min ago</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => setNotifAnchor(null)} sx={{ py: 1.25, alignItems: "flex-start" }}>
              <Box>
                <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 600 }}>Retry scheduled for failed call</Typography>
                <Typography sx={{ fontSize: "var(--font-size-body)", color: "text.secondary" }}>PC-2026-0039</Typography>
              </Box>
            </MenuItem>
          </Menu>

          <IconButton
            onClick={(event: MouseEvent<HTMLElement>) => setMenuAnchor(event.currentTarget)}
            aria-label="Account menu"
            sx={{
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
                display: { xs: "none", sm: "block" },
              }}
            >
              {user.name.split(" ")[0]}
            </Typography>
            <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#6B7280" }} />
          </IconButton>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { width: 220, mt: 1, borderRadius: 2 } } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 600 }}>{user.name}</Typography>
              <Typography sx={{ fontSize: "var(--font-size-body)", color: "text.secondary" }} noWrap>
                {user.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              component={Link}
              href="/settings"
              onClick={() => setMenuAnchor(null)}
              sx={{ fontSize: "var(--font-size-body)" }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <SettingsIcon sx={{ fontSize: 16 }} />
              </ListItemIcon>
              Settings
            </MenuItem>
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
