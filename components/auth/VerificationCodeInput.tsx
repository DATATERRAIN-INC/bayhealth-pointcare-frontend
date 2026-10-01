"use client";

import { ClipboardEvent, KeyboardEvent, useRef } from "react";
import { Stack, TextField, Typography } from "@mui/material";
import { authOtpFieldSx } from "@/components/auth/authFormStyles";

const CODE_LENGTH = 6;

type VerificationCodeInputProps = {
  value: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
  onResend?: () => void;
  resendDisabled?: boolean;
  resendLabel?: string;
};

export function VerificationCodeInput({
  value,
  onChange,
  disabled = false,
  onResend,
  resendDisabled = false,
  resendLabel = "Resend code",
}: VerificationCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.length === CODE_LENGTH ? value : Array.from({ length: CODE_LENGTH }, (_, i) => value[i] || "");

  function focusDigit(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function handleDigitChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      onChange(next);
      return;
    }

    const chars = cleaned.split("");
    const next = [...digits];
    let cursor = index;
    for (const char of chars) {
      if (cursor >= CODE_LENGTH) break;
      next[cursor] = char;
      cursor += 1;
    }
    onChange(next);
    focusDigit(Math.min(cursor, CODE_LENGTH - 1));
  }

  function handleDigitKeyDown(index: number, event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      onChange(next);
      focusDigit(index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusDigit(index - 1);
    }
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusDigit(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] || "");
    onChange(next);
    focusDigit(Math.min(pasted.length, CODE_LENGTH - 1));
  }

  return (
    <Stack spacing={1}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 600, color: "text.primary" }}>
          Verification code
        </Typography>
        {onResend ? (
          <Typography
            component="button"
            type="button"
            onClick={onResend}
            disabled={resendDisabled || disabled}
            sx={{
              border: 0,
              background: "none",
              p: 0,
              cursor: resendDisabled || disabled ? "default" : "pointer",
              fontSize: "var(--font-size-body)",
              fontWeight: 600,
              color: "primary.main",
              textDecoration: "underline",
              opacity: resendDisabled || disabled ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {resendLabel}
          </Typography>
        ) : null}
      </Stack>
      <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }} sx={{ justifyContent: "space-between" }}>
        {digits.map((digit, index) => (
          <TextField
            key={index}
            value={digit}
            disabled={disabled}
            onChange={(event) => handleDigitChange(index, event.target.value)}
            onKeyDown={(event) => handleDigitKeyDown(index, event)}
            onPaste={handlePaste}
            size="small"
            sx={authOtpFieldSx}
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                autoComplete: index === 0 ? "one-time-code" : "off",
                "aria-label": `Digit ${index + 1} of ${CODE_LENGTH}`,
                // Allow full length on first box so SMS autofill / paste can land in one field.
                maxLength: index === 0 ? CODE_LENGTH : 1,
              },
              input: {
                inputRef: (el: HTMLInputElement | null) => {
                  inputRefs.current[index] = el;
                },
              },
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

export const VERIFICATION_CODE_LENGTH = CODE_LENGTH;
