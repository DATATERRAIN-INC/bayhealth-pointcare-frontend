"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Phone, Settings, Users } from "lucide-react";
import { useState } from "react";
import { ConfirmLogoutDialog } from "@/components/auth/ConfirmLogoutDialog";
import { BachLogo } from "@/components/brand/BachLogo";
import { logout } from "@/lib/auth";
import type { User } from "@/types/user";

const navItems = [
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/calls", label: "Calls and texts", icon: Phone },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const DRAWER_WIDTH = 232;
const COLLAPSED_WIDTH = 72;

interface SidebarProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const [logoutOpen, setLogoutOpen] = useState(false);

  function handleLogoutConfirm() {
    setLogoutOpen(false);
    logout();
    router.replace("/login");
  }

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleNavigate() {
    if (!isDesktop) onClose();
  }

  const collapsed = isDesktop && !open;
  const drawerWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const drawerContent = (
    <Stack sx={{ height: "100%", bgcolor: "background.paper" }}>
      {collapsed ? null : (
        <Box sx={{ px: 2, pt: 2.25, pb: 1.5 }}>
          <Link href="/patients" onClick={handleNavigate} style={{ textDecoration: "none" }}>
            <BachLogo showTagline />
          </Link>
        </Box>
      )}

      {collapsed ? null : (
        <Typography
          sx={{
            px: 2.5,
            pt: 1.5,
            pb: 0.75,
            fontSize: "var(--font-size-body)",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#8B93A7",
          }}
        >
          GAP IN CARE
        </Typography>
      )}

      <List sx={{ flex: 1, px: collapsed ? 1 : 1.5, pt: collapsed ? 2 : 0 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const button = (
            <ListItemButton
              key={href}
              component={Link}
              href={href}
              selected={active}
              aria-label={label}
              onClick={handleNavigate}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 0.9,
                px: collapsed ? 1 : 2,
                justifyContent: collapsed ? "center" : "flex-start",
                color: active ? "primary.main" : "#4B5568",
                "&.Mui-selected": {
                  bgcolor: "#E8F3FC",
                  color: "primary.main",
                  "&:hover": { bgcolor: "#E8F3FC" },
                  "& .MuiListItemIcon-root": { color: "primary.main" },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 32,
                  justifyContent: "center",
                  color: active ? "primary.main" : "#6B7280",
                }}
              >
                <Icon size={18} />
              </ListItemIcon>
              {collapsed ? null : (
                <ListItemText
                  primary={label}
                  slotProps={{
                    primary: { sx: { fontSize: "var(--font-size-body)", fontWeight: active ? 600 : 500 } },
                  }}
                />
              )}
            </ListItemButton>
          );
          return collapsed ? (
            <Tooltip key={href} title={label} placement="right">
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </List>
    </Stack>
  );

  return (
    <>
      <ConfirmLogoutDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogoutConfirm}
      />

      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        slotProps={{ root: { keepMounted: true } }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="persistent"
        open
        sx={{
          display: { xs: "none", lg: "block" },
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #EEF0F4",
            position: "relative",
            height: "100dvh",
            overflowX: "hidden",
            overflowY: "auto",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
