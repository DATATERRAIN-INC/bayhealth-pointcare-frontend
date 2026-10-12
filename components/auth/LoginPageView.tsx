"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import {
  clearSession,
  consumeRedirectLogout,
  getAccessToken,
  isAccessTokenExpired,
  isAuthenticated,
  jwtDecode,
  needsPasswordChange,
  safeRedirectPath,
} from "@/lib/authUtils";

function hasUsableSession(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  if (isAccessTokenExpired()) return false;
  if (!jwtDecode(token)) return false;
  return true;
}

export function LoginPageView() {
  const router = useRouter();

  useEffect(() => {
    consumeRedirectLogout();

    if (!hasUsableSession()) {
      if (isAuthenticated()) {
        clearSession();
        consumeRedirectLogout();
      }
      return;
    }

    if (needsPasswordChange()) {
      router.replace("/change-password");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    router.replace(safeRedirectPath(params.get("redirect") || params.get("next"), "/dashboard"));
  }, [router]);

  // Always render the form — never gate it behind a spinner.
  // A leftover token used to keep ready=false forever during redirect loops.
  return (
    <AuthShell title="Sign in" subtitle="Use your BACH Gap in Care account.">
      <LoginForm />
    </AuthShell>
  );
}
