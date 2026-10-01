"use client";

import { Box, CircularProgress } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { consumeRedirectLogout, isAuthenticated, needsPasswordChange, safeRedirectPath } from "@/lib/authUtils";

export function LoginPageView() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    consumeRedirectLogout();
    if (!isAuthenticated()) {
      // Show login immediately when returning from a successful password reset.
      const hasStatusMessage = Boolean(new URLSearchParams(window.location.search).get("message"));
      const timer = window.setTimeout(() => setReady(true), hasStatusMessage ? 0 : 1000);
      return () => window.clearTimeout(timer);
    }
    if (needsPasswordChange()) {
      router.replace("/change-password");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    router.replace(safeRedirectPath(params.get("redirect") || params.get("next"), "/dashboard"));
  }, [router]);

  return (
    <AuthShell title="Sign in" subtitle="Use your BACH Point of Care account.">
      {ready ? (
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress size={22} />
            </Box>
          }
        >
          <LoginForm />
        </Suspense>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress size={22} />
        </Box>
      )}
    </AuthShell>
  );
}
