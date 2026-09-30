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
import { loginLocally } from "@/lib/auth";
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/patients";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [resetNote, setResetNote] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setResetNote(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError("Email and password are required.");
      return;
    }

    setLoading(true);
    // Temporary: skip API login and enter the app directly.
    await new Promise((resolve) => setTimeout(resolve, 250));
    loginLocally(trimmedEmail);
    setLoading(false);

    const destination =
      nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/patients";
    router.replace(destination === "/dashboard" ? "/patients" : destination);
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
          loading={loading}
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
          {loading ? "Signing in…" : "Sign in"}
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
