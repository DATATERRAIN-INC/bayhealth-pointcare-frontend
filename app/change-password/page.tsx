"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Stack, Typography } from "@mui/material";
import { Button } from "@/components/ui/Button";
import { logout } from "@/lib/auth";
import { isAuthenticated, needsPasswordChange } from "@/lib/authUtils";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login?redirect=/change-password");
      return;
    }
    if (!needsPasswordChange()) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 3, bgcolor: "#F7F8FA" }}>
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 440, bgcolor: "#FFFFFF", borderRadius: "12px", p: 4 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Change your password</Typography>
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#6B7280", lineHeight: 1.5 }}>
          This account must set a new password before the rest of Gap in Care can open. Ask your administrator to complete the password change.
        </Typography>
        <Button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          Sign out
        </Button>
      </Stack>
    </Box>
  );
}
