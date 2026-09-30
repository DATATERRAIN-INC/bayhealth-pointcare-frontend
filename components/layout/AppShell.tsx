"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { getSession } from "@/lib/auth";
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

  useEffect(() => {
    try {
      const session = getSession();
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setUser(session.user);
      setChecking(false);
    } catch (error) {
      console.error("Session check failed:", error);
      router.replace("/login");
    }
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
          Loading PointCare…
        </Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <ErrorBoundary fallbackTitle="Navigation unavailable">
        <Sidebar user={user} />
      </ErrorBoundary>

      <Box sx={{ display: "flex", minWidth: 0, flex: 1, flexDirection: "column" }}>
        <ErrorBoundary fallbackTitle="Top bar unavailable">
          <AppTopBar user={user} />
        </ErrorBoundary>

        <Box component="main" sx={{ flex: 1, px: { xs: 2, lg: 3 }, pb: 3, pt: { xs: 2, lg: 2.5 } }}>
          <ErrorBoundary fallbackTitle="This page failed to load">
            <Suspense fallback={<AppLoadingFallback />}>{children}</Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}
