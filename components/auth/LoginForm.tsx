"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { mapLoginResponseToSession, saveSession } from "@/lib/auth";
import { consumeRedirectLogout, needsPasswordChange, safeRedirectPath } from "@/lib/authUtils";
import { useLoginMutation } from "@/lib/api/authApi";
import { Button } from "@/components/ui/Button";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    bgcolor: "#FFFFFF",
    "& fieldset": {
      borderColor: "#D5DBE5",
    },
    "&:hover fieldset": {
      borderColor: "#B8C0CE",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
      borderWidth: 1.5,
    },
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "var(--font-size-body)",
    py: 0,
  },
} as const;

function loginErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      const record = data as { detail?: unknown; message?: unknown; non_field_errors?: unknown };
      if (typeof record.detail === "string" && record.detail.trim()) return record.detail;
      if (Array.isArray(record.detail) && typeof record.detail[0] === "string") return record.detail[0];
      if (typeof record.message === "string" && record.message.trim()) return record.message;
      if (Array.isArray(record.non_field_errors) && typeof record.non_field_errors[0] === "string") {
        return record.non_field_errors[0];
      }
    }
  }
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (status === 401 || status === 400 || status === 403) {
      return "Email or password is incorrect.";
    }
    if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") {
      return "Could not reach the sign-in service.";
    }
  }
  return "Could not sign in. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeRedirectPath(searchParams.get("redirect") || searchParams.get("next"), "/dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [resetNote, setResetNote] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setResetNote(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError("Email and password are required.");
      return;
    }

    try {
      const response = await login({ email: trimmedEmail, password }).unwrap();
      const session = mapLoginResponseToSession(response, trimmedEmail);
      if (!session.accessToken) {
        setFormError("Sign in did not return a token.");
        return;
      }
      consumeRedirectLogout();
      saveSession(session);
      router.replace(needsPasswordChange() ? "/change-password" : nextPath);
    } catch (error) {
      setFormError(loginErrorMessage(error));
    }
  }

  return (
    <Box component="form" onSubmit={(event) => void handleSubmit(event)} noValidate autoComplete="on">
      <Stack spacing={2.75}>
        <Box>
          <Typography sx={{ mb: 1, fontSize: "var(--font-size-body)", fontWeight: 600, color: "text.primary" }}>Email</Typography>
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
            sx={fieldSx}
          />
        </Box>

        <Box>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 600, color: "text.primary" }}>Password</Typography>
            <Typography
              component={Link}
              href="#"
              onClick={(event) => {
                event.preventDefault();
                setResetNote(true);
              }}
              sx={{
                fontSize: "var(--font-size-body)",
                fontWeight: 600,
                color: "primary.main",
                textDecoration: "none",
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
            sx={fieldSx}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((value) => !value)}
                      edge="end"
                      size="small"
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
          sx={{
            mt: 0.5,
            borderRadius: "10px",
            fontSize: "var(--font-size-body)",
            fontWeight: 600,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          }}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>

        {formError ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.25,
              px: 1.75,
              py: 1.5,
              borderRadius: "10px",
              bgcolor: "#FDECEC",
              color: "#B42318",
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 20, mt: "1px", flexShrink: 0, color: "#D92D20" }} />
            <Typography sx={{ fontSize: "var(--font-size-body)", lineHeight: 1.45, color: "#B42318" }}>{formError}</Typography>
          </Box>
        ) : null}

        {resetNote ? (
          <Typography sx={{ fontSize: "var(--font-size-body)", color: "text.secondary" }}>
            Ask your administrator to reset your Point of Care password.
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
