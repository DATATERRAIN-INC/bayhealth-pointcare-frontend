"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { getSession } from "@/lib/auth";
import {
  ACCESS_TOKEN_KEY,
  buildLoginUrl,
  consumeRedirectLogout,
  isAuthenticated,
  isRedirectingLogout,
  needsPasswordChange,
} from "@/lib/authUtils";
import type { User } from "@/types/user";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { AppLoadingFallback } from "@/components/shared/AppLoadingFallback";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1200px)");
    if (!media.matches) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    try {
      if (isRedirectingLogout() && !isAuthenticated()) {
        return;
      }
      if (isRedirectingLogout()) consumeRedirectLogout();
      if (!isAuthenticated()) {
        router.replace(buildLoginUrl(pathname, window.location.search));
        return;
      }
      if (needsPasswordChange()) {
        router.replace("/change-password");
        return;
      }
      const session = getSession();
      if (!session) {
        router.replace(buildLoginUrl(pathname, window.location.search));
        return;
      }
      setUser(session.user);
      setChecking(false);
    } catch (error) {
      console.error("Session check failed:", error);
      router.replace("/login");
    }
  }, [pathname, router]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== ACCESS_TOKEN_KEY || event.newValue) return;
      setUser(null);
      setChecking(true);
      router.replace(buildLoginUrl(pathname, window.location.search));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname, router]);

  if (checking || !user) {
    return (
      <Stack
        spacing={1.5}
        sx={{
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Loading Gap in Care…
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <ErrorBoundary fallbackTitle="Navigation unavailable">
        <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </ErrorBoundary>

      <Box
        sx={{
          display: "flex",
          minWidth: 0,
          minHeight: 0,
          flex: 1,
          flexDirection: "column",
        }}
      >
        <ErrorBoundary fallbackTitle="Top bar unavailable">
          <AppTopBar
            user={user}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
          />
        </ErrorBoundary>

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            px: { xs: 2, lg: 3 },
            pb: 3,
            pt: { xs: 2, lg: 2.5 },
          }}
        >
          <ErrorBoundary fallbackTitle="This page failed to load">
            <Suspense fallback={<AppLoadingFallback />}>{children}</Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}
