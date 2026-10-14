"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTriggerOutboundMutation } from "@/lib/api/formFillerApi";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  formatPhoneInputValue,
  getPhoneLengthRule,
  phoneInputMaxLength,
  phoneSamplePlaceholder,
  sanitizePhoneDigits,
  validatePhoneNumber,
} from "@/lib/phone";
import { elevation } from "@/lib/theme/tokens";

const COUNTRY_CODES = ["+1", "+44", "+91", "+61", "+81"] as const;

const surface = {
  bgcolor: "#FFFFFF",
  border: "1px solid #E5E9EF",
  borderRadius: "10px",
  boxShadow: elevation.floatingPanel,
} as const;

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    bgcolor: "#FFFFFF",
    overflow: "hidden",
    minHeight: 40,
    alignItems: "center",
    "& fieldset": { borderColor: "#E2E5EC" },
    "&:hover fieldset": { borderColor: "#C5CAD6" },
    "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1 },
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "var(--font-size-body)",
    py: 0,
    height: 40,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    py: "0 !important",
    minHeight: "40px !important",
    height: "40px !important",
    boxSizing: "border-box",
    lineHeight: "40px",
  },
  "& .MuiSelect-icon": {
    top: "50%",
    transform: "translateY(-50%)",
    right: 10,
  },
} as const;

const labelSx = {
  mb: 0.65,
  fontSize: "var(--font-size-body)",
  fontWeight: 600,
  color: "#5C6478",
  letterSpacing: "0.01em",
} as const;

export function PointCareForm() {
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [triggerOutbound, { isLoading }] = useTriggerOutboundMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const trimmedName = name.trim();
    const phoneValidation = validatePhoneNumber(phoneNumber, countryCode, {
      required: true,
      fieldLabel: "Phone number",
    });
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      return;
    }
    setPhoneError("");

    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }

    const digits = sanitizePhoneDigits(phoneNumber, countryCode);
    const fullPhone = `${countryCode}${digits}`;

    try {
      await triggerOutbound({
        phone_number: fullPhone,
        name: trimmedName,
      }).unwrap();
      setSuccessMessage("Outbound request sent successfully.");
      setPhoneNumber("");
      setName("");
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "Could not send outbound request. Please try again."),
      );
    }
  }

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <Box>
        <Typography
          sx={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "text.primary",
            lineHeight: 1.2,
          }}
        >
          Point Care
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: "var(--font-size-body)", color: "#6B7280", lineHeight: 1.45 }}>
          Trigger an outbound form-filler call for a patient or contact.
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ ...surface, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, pt: 2.1, pb: 1.75, borderBottom: "1px solid #F0F2F5" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 650, color: "text.primary", letterSpacing: "-0.01em" }}>
            Outbound call
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: "var(--font-size-body)", color: "#6B7280", lineHeight: 1.45 }}>
            Enter the recipient&apos;s phone number and name, then save to start the call.
          </Typography>
        </Box>

        <Box sx={{ px: 2.5, py: 2.25 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.75,
            }}
          >
            <Box>
              <Typography sx={labelSx}>Name</Typography>
              <TextField
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Murali"
                fullWidth
                required
                size="small"
                disabled={isLoading}
                sx={fieldSx}
              />
            </Box>

            <Box>
              <Typography sx={labelSx}>Phone number</Typography>
              <TextField
                name="phone_number"
                fullWidth
                size="small"
                value={formatPhoneInputValue(
                  phoneNumber,
                  getPhoneLengthRule(countryCode).max,
                )}
                placeholder={phoneSamplePlaceholder(countryCode)}
                error={Boolean(phoneError)}
                helperText={phoneError || undefined}
                disabled={isLoading}
                onChange={(event) => {
                  setPhoneNumber(sanitizePhoneDigits(event.target.value, countryCode));
                  if (phoneError) setPhoneError("");
                }}
                sx={{
                  ...fieldSx,
                  "& .MuiOutlinedInput-root": {
                    ...fieldSx["& .MuiOutlinedInput-root"],
                    pl: 0,
                    minHeight: 40,
                  },
                  "& .MuiFormHelperText-root": {
                    mx: 0,
                    mt: 0.6,
                    fontSize: 12,
                  },
                }}
                slotProps={{
                  htmlInput: {
                    inputMode: "tel",
                    maxLength: phoneInputMaxLength(getPhoneLengthRule(countryCode).max),
                  },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 0 }}>
                        <TextField
                          select
                          size="small"
                          value={countryCode}
                          disabled={isLoading}
                          onChange={(event) => {
                            const nextCode = event.target.value;
                            setCountryCode(nextCode);
                            setPhoneNumber(sanitizePhoneDigits(phoneNumber, nextCode));
                            if (phoneError) setPhoneError("");
                          }}
                          variant="standard"
                          slotProps={{
                            select: {
                              disableUnderline: true,
                              IconComponent: () => (
                                <ChevronDown size={14} style={{ marginRight: 4, color: "#6B7280" }} />
                              ),
                            },
                            input: {
                              sx: {
                                pl: 1.25,
                                pr: 0.5,
                                minWidth: 62,
                                fontSize: "var(--font-size-body)",
                                fontWeight: 600,
                              },
                            },
                          }}
                          sx={{
                            "& .MuiInputBase-root": {
                              minHeight: 40,
                              bgcolor: "#F7F8FA",
                              borderRight: "1px solid #E2E5EC",
                            },
                          }}
                        >
                          {COUNTRY_CODES.map((code) => (
                            <MenuItem key={code} value={code}>
                              {code}
                            </MenuItem>
                          ))}
                        </TextField>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          </Box>

          {formError ? (
            <Alert severity="error" onClose={() => setFormError("")} sx={{ mt: 2 }}>
              {formError}
            </Alert>
          ) : null}
          {successMessage ? (
            <Alert severity="success" onClose={() => setSuccessMessage("")} sx={{ mt: 2 }}>
              {successMessage}
            </Alert>
          ) : null}
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            justifyContent: "flex-end",
            px: 2.5,
            py: 1.75,
            borderTop: "1px solid #F0F2F5",
            bgcolor: "#FAFBFC",
          }}
        >
          <Button type="submit" loading={isLoading}>
            Save
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
