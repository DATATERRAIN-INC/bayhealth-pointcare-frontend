"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { authFieldSx, authPrimaryButtonSx } from "@/components/auth/authFormStyles";
import { Button } from "@/components/ui/Button";
import { parseAuthApiError } from "@/lib/api/authErrors";
import {
  consumeAuthStatusMessage,
  safeStatusMessage,
  useLoginMutation,
} from "@/lib/api/authApi";
import { mapLoginResponseToSession, saveSession } from "@/lib/auth";
import { consumeRedirectLogout, needsPasswordChange, safeRedirectPath } from "@/lib/authUtils";

function loginErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (status === 401 || status === 400 || status === 403) {
      return "Email or password is incorrect.";
    }
  }
  return parseAuthApiError(error, "Could not sign in. Please try again.");
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeRedirectPath(searchParams.get("redirect") || searchParams.get("next"), "/dashboard");

  const [successMessage] = useState(() => {
    return safeStatusMessage(searchParams.get("message")) || consumeAuthStatusMessage();
  });
  const [toastOpen, setToastOpen] = useState(() => Boolean(successMessage));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || isLoading) return;

    setFormError("");
    setToastOpen(false);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError("Email and password are required.");
      return;
    }

    submittingRef.current = true;
    try {
      const response = await login({ email: trimmedEmail, password }).unwrap();
      if (!mountedRef.current) return;

      const session = mapLoginResponseToSession(response, trimmedEmail);
      if (!session.accessToken) {
        setFormError("Sign in did not return a token.");
        return;
      }
      consumeRedirectLogout();
      saveSession(session);
      router.replace(needsPasswordChange() ? "/change-password" : nextPath);
    } catch (error) {
      if (!mountedRef.current) return;
      setFormError(loginErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <Box component="form" onSubmit={(event) => void handleSubmit(event)} noValidate autoComplete="on">
      <Snackbar
        open={toastOpen && Boolean(successMessage)}
        autoHideDuration={5000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setToastOpen(false)}
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Stack spacing={2.75}>
        {!formError && successMessage ? <AuthAlert tone="success" message={successMessage} /> : null}

        <Box>
          <Typography sx={{ mb: 1, fontSize: "var(--font-size-body)", fontWeight: 600, color: "text.primary" }}>
            Email
          </Typography>
          <TextField
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFormError("");
            }}
            required
            fullWidth
            size="small"
            placeholder="you@example.com"
            disabled={isLoading}
            sx={authFieldSx}
          />
        </Box>

        <Box>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 600, color: "text.primary" }}>
              Password
            </Typography>
            <Typography
              component={Link}
              href="/forgot-password"
              sx={{
                fontSize: "var(--font-size-body)",
                fontWeight: 600,
                color: "primary.main",
                textDecoration: "none",
                pointerEvents: isLoading ? "none" : "auto",
                opacity: isLoading ? 0.6 : 1,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Forgot password?
            </Typography>
          </Stack>
          <TextField
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFormError("");
            }}
            required
            fullWidth
            size="small"
            disabled={isLoading}
            sx={authFieldSx}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((value) => !value)}
                      edge="end"
                      size="small"
                      disabled={isLoading}
                      sx={{ color: "#6B7280" }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          sx={{ ...authPrimaryButtonSx, textTransform: "none" }}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>

        <AuthAlert tone="error" message={formError} />
      </Stack>
    </Box>
  );
}
