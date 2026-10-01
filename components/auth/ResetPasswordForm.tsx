"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { authFieldSx, authPrimaryButtonSx } from "@/components/auth/authFormStyles";
import {
  VERIFICATION_CODE_LENGTH,
  VerificationCodeInput,
} from "@/components/auth/VerificationCodeInput";
import { parseAuthApiError } from "@/lib/api/authErrors";
import {
  extractAuthMessage,
  extractResetToken,
  isPasswordTokenValid,
  stashAuthStatusMessage,
  useForgotPasswordMutation,
  useLazyValidatePasswordTokenQuery,
  useResetPasswordMutation,
  useVerifyResetCodeMutation,
} from "@/lib/api/authApi";
import { Button } from "@/components/ui/Button";
import { SuccessDialog } from "@/components/shared/SuccessDialog";

type ResetPasswordFormProps = {
  email: string;
  initialMessage?: string;
  onUseDifferentEmail: () => void;
};

export function ResetPasswordForm({ email, initialMessage = "", onUseDifferentEmail }: ResetPasswordFormProps) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: VERIFICATION_CODE_LENGTH }, () => ""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [statusNote, setStatusNote] = useState(initialMessage);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [verifyResetCode, { isLoading: isVerifying }] = useVerifyResetCodeMutation();
  const [validatePasswordToken, { isFetching: isValidating }] = useLazyValidatePasswordTokenQuery();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();
  const [forgotPassword, { isLoading: isResending }] = useForgotPasswordMutation();
  const isLoading = isVerifying || isValidating || isResetting;
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);
  const redirectedRef = useRef(false);

  function goToLoginWithSuccess(message: string) {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    const text = message.trim() || "Password reset successfully.";
    stashAuthStatusMessage(text);
    router.replace(`/login?message=${encodeURIComponent(text)}`);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setStatusNote(initialMessage);
  }, [initialMessage]);

  async function handleResend() {
    if (isResending || isLoading) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError("Email is missing. Please use a different email.");
      onUseDifferentEmail();
      return;
    }

    setFormError("");
    setStatusNote("");
    try {
      const response = await forgotPassword({ email: trimmedEmail }).unwrap();
      if (!mountedRef.current) return;
      setStatusNote(extractAuthMessage(response, "Password reset code sent to your email."));
      setDigits(Array.from({ length: VERIFICATION_CODE_LENGTH }, () => ""));
    } catch (error) {
      if (!mountedRef.current) return;
      setFormError(parseAuthApiError(error, "Could not resend the verification code."));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || isLoading) return;

    setFormError("");
    setStatusNote("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError("Email is missing. Please start again.");
      onUseDifferentEmail();
      return;
    }

    const reset_code = digits.join("");
    if (reset_code.length !== VERIFICATION_CODE_LENGTH || !/^\d{6}$/.test(reset_code)) {
      setFormError("Enter the 6-digit verification code.");
      return;
    }
    if (!password) {
      setFormError("New password is required.");
      return;
    }
    if (!confirmPassword) {
      setFormError("Confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    submittingRef.current = true;
    try {
      // 1) POST /api/users/verify-reset-code/ → { email, token }
      const verifyResponse = await verifyResetCode({ email: trimmedEmail, reset_code }).unwrap();
      if (!mountedRef.current) return;

      const token = extractResetToken(verifyResponse);
      if (!token) {
        setFormError("Verification succeeded but no reset token was returned.");
        return;
      }

      // 2) GET /api/users/validate-password-token/?token=... → { valid: true }
      const validateResponse = await validatePasswordToken(token).unwrap();
      if (!mountedRef.current) return;

      if (!isPasswordTokenValid(validateResponse)) {
        setFormError(
          extractAuthMessage(validateResponse, "This password reset link is invalid or has expired."),
        );
        return;
      }

      // 3) POST /api/users/reset-password/ → { message }
      const resetResponse = await resetPassword({
        token,
        new_password: password,
        confirm_password: confirmPassword,
      }).unwrap();
      if (!mountedRef.current) return;

      const message = extractAuthMessage(resetResponse, "Password reset successfully.");
      setStatusNote(message);
      setSuccessMessage(message);
      setSuccessOpen(true);
    } catch (error) {
      if (!mountedRef.current) return;
      setFormError(parseAuthApiError(error, "Could not reset password. Please try again."));
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <Box component="form" onSubmit={(event) => void handleSubmit(event)} noValidate autoComplete="on">
      <SuccessDialog
        open={successOpen}
        message={successMessage || "Password reset successfully."}
        autoCloseMs={2200}
        onClose={() => {
          setSuccessOpen(false);
          goToLoginWithSuccess(successMessage || "Password reset successfully.");
        }}
      />
      <Stack spacing={2.75}>
        <VerificationCodeInput
          value={digits}
          onChange={(next) => {
            setDigits(next);
            setFormError("");
          }}
          disabled={isLoading}
          onResend={() => void handleResend()}
          resendDisabled={isResending || isLoading}
          resendLabel={isResending ? "Sending…" : "Resend code"}
        />

        <Box>
          <Typography sx={{ mb: 1, fontSize: "var(--font-size-body)", fontWeight: 600, color: "text.primary" }}>
            New password
          </Typography>
          <TextField
            name="new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFormError("");
            }}
            required
            fullWidth
            size="small"
            placeholder="New password"
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

        <Box>
          <Typography sx={{ mb: 1, fontSize: "var(--font-size-body)", fontWeight: 600, color: "text.primary" }}>
            Confirm new password
          </Typography>
          <TextField
            name="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setFormError("");
            }}
            required
            fullWidth
            size="small"
            placeholder="Confirm new password"
            disabled={isLoading}
            sx={authFieldSx}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      edge="end"
                      size="small"
                      disabled={isLoading}
                      sx={{ color: "#6B7280" }}
                    >
                      {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
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
          sx={{ ...authPrimaryButtonSx, textTransform: "uppercase" }}
        >
          {isLoading ? "Resetting…" : "Reset password"}
        </Button>

        <AuthAlert tone="error" message={formError} />
        {!formError ? <AuthAlert tone="success" message={statusNote} /> : null}

        <Stack spacing={1.25} sx={{ alignItems: "center" }}>
          <Typography
            component="button"
            type="button"
            onClick={onUseDifferentEmail}
            disabled={isLoading}
            sx={{
              border: 0,
              background: "none",
              p: 0,
              cursor: isLoading ? "default" : "pointer",
              fontSize: "var(--font-size-body)",
              fontWeight: 600,
              color: "primary.main",
              textDecoration: "underline",
              fontFamily: "inherit",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Use a different email
          </Typography>
          <Typography
            component={Link}
            href="/login"
            sx={{
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
      </Stack>
    </Box>
  );
}
