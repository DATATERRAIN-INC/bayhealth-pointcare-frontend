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
  Typography,
} from "@mui/material";
import { Phone, Settings, Users } from "lucide-react";
import { useState } from "react";
import { ConfirmLogoutDialog } from "@/components/auth/ConfirmLogoutDialog";
import { BachLogo } from "@/components/brand/BachLogo";
import { logout } from "@/lib/auth";
import type { User } from "@/types/user";

const navItems = [
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/calls", label: "Calls and transcripts", icon: Phone },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const DRAWER_WIDTH = 232;

interface SidebarProps {
  user: User;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ user, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  function handleLogoutConfirm() {
    setLogoutOpen(false);
    logout();
    router.replace("/login");
  }

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const drawerContent = (
    <Stack sx={{ height: "100%", bgcolor: "background.paper" }}>
      <Box sx={{ px: 2, pt: 2.25, pb: 1.5 }}>
        <Link href="/patients" onClick={onMobileClose} style={{ textDecoration: "none" }}>
          <BachLogo showTagline />
        </Link>
      </Box>

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

      <List sx={{ flex: 1, px: 1.5 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <ListItemButton
              key={href}
              component={Link}
              href={href}
              selected={active}
              onClick={onMobileClose}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 0.9,
                color: active ? "primary.main" : "#4B5568",
                "&.Mui-selected": {
                  bgcolor: "#E8F3FC",
                  color: "primary.main",
                  "&:hover": { bgcolor: "#E8F3FC" },
                  "& .MuiListItemIcon-root": { color: "primary.main" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: active ? "primary.main" : "#6B7280" }}>
                <Icon size={16} />
              </ListItemIcon>
              <ListItemText
                primary={label}
                slotProps={{
                  primary: { sx: { fontSize: "var(--font-size-body)", fontWeight: active ? 600 : 500 } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 1.5 }}>
        <Stack
          direction="row"
          spacing={1.25}
          sx={{
            alignItems: "center",
            px: 1.25,
            py: 1,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "#EEF0F4",
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: "#E8F3FC",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-body)",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user.avatarInitials}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: "var(--font-size-body)", fontWeight: 600, color: "text.primary" }}>
              {user.name}
            </Typography>
            <Typography
              component="button"
              type="button"
              onClick={() => setLogoutOpen(true)}
              sx={{
                p: 0,
                border: 0,
                bgcolor: "transparent",
                color: "primary.main",
                fontSize: "var(--font-size-body)",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sign out
            </Typography>
          </Box>
        </Stack>
      </Box>
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
        open={mobileOpen}
        onClose={onMobileClose}
        slotProps={{ root: { keepMounted: true } }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", lg: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid #EEF0F4",
            position: "sticky",
            top: 0,
            height: "100vh",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
