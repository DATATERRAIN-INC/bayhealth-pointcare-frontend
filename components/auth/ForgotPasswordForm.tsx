"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { authFieldSx, authPrimaryButtonSx } from "@/components/auth/authFormStyles";
import { parseAuthApiError } from "@/lib/api/authErrors";
import { extractAuthMessage, isValidEmail, useForgotPasswordMutation } from "@/lib/api/authApi";
import { Button } from "@/components/ui/Button";

type ForgotPasswordFormProps = {
  onSuccess: (result: { email: string; message: string }) => void;
};

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
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
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError("Email is required.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }

    submittingRef.current = true;
    try {
      const response = await forgotPassword({ email: trimmedEmail }).unwrap();
      if (!mountedRef.current) return;
      onSuccess({
        email: trimmedEmail,
        message: extractAuthMessage(response, "Password reset code sent to your email."),
      });
    } catch (error) {
      if (!mountedRef.current) return;
      setFormError(parseAuthApiError(error, "Could not send reset instructions. Please try again."));
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <Box component="form" onSubmit={(event) => void handleSubmit(event)} noValidate autoComplete="on">
      <Stack spacing={2.75}>
        <Box>
          <Typography sx={{ mb: 1, fontSize: "var(--font-size-body)", fontWeight: 600, color: "text.primary" }}>
            Email
          </Typography>
          <TextField
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFormError("");
            }}
            required
            fullWidth
            size="small"
            placeholder="Enter your email"
            disabled={isLoading}
            sx={authFieldSx}
          />
        </Box>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          sx={{ ...authPrimaryButtonSx, textTransform: "uppercase" }}
        >
          {isLoading ? "Sending…" : "Next"}
        </Button>

        <AuthAlert tone="error" message={formError} />

        <Typography
          component={Link}
          href="/login"
          sx={{
            alignSelf: "center",
            fontSize: "var(--font-size-body)",
            fontWeight: 600,
            color: "primary.main",
            textDecoration: "underline",
            pointerEvents: isLoading ? "none" : "auto",
            opacity: isLoading ? 0.6 : 1,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Back to login
        </Typography>
      </Stack>
    </Box>
  );
}
