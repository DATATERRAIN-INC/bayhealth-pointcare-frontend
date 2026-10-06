"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, type ReactNode, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ChevronDown, Phone, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppBreadcrumbs } from "@/components/shared/AppBreadcrumbs";
import { SuccessDialog } from "@/components/shared/SuccessDialog";
import {
  buildPatientSaveBody,
  useCreatePatientMutation,
  useGetPatientsQuery,
  useUpdatePatientMutation,
} from "@/lib/api/patientsApi";
import { parseAuthApiError } from "@/lib/api/authErrors";
import { formatDobInput, isFutureDate, parseDobInput, toIsoDate } from "@/data/gapPatients";
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

const initialForm = {
  firstName: "",
  lastName: "",
  dob: "",
  address: "",
  doctor: "",
  serviceName: "",
  countryCode: "+1",
  phoneNumber: "",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: "var(--control-height) !important",
    minHeight: "var(--control-height)",
    borderRadius: "8px",
    bgcolor: "#FFFFFF",
    overflow: "hidden",
    "& fieldset": { borderColor: "#DDE2E9" },
    "&:hover fieldset": { borderColor: "#BFC7D2" },
    "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1 },
  },
  "& .MuiOutlinedInput-input, & .MuiSelect-select": { py: 0, fontSize: "var(--font-size-body)" },
} as const;

const labelSx = {
  mb: 0.75,
  fontSize: "var(--font-size-body)",
  fontWeight: 600,
  color: "text.primary",
} as const;

function isoToDobInput(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (!match) return isoDate;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Typography sx={labelSx}>
      {children} <Box component="span" sx={{ color: "#D92D20" }}>*</Box>
    </Typography>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          borderRadius: "9px",
          color: "primary.main",
          bgcolor: "#EEF6FD",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.primary", lineHeight: 1.3 }}>
          {title}
        </Typography>
        <Typography sx={{ color: "text.secondary", lineHeight: 1.4 }}>
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

function PhoneField({
  label,
  countryCode,
  phoneNumber,
  error,
  onCountryCodeChange,
  onPhoneChange,
}: {
  label: string;
  countryCode: string;
  phoneNumber: string;
  error?: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}) {
  const countryCodes = (COUNTRY_CODES as readonly string[]).includes(countryCode)
    ? COUNTRY_CODES
    : [countryCode, ...COUNTRY_CODES];
  const phoneRule = getPhoneLengthRule(countryCode);
  const displayPhone = formatPhoneInputValue(phoneNumber, phoneRule.max);

  return (
    <Box>
      <FieldLabel>{label}</FieldLabel>
      <TextField
        fullWidth
        size="small"
        value={displayPhone}
        placeholder={phoneSamplePlaceholder(countryCode)}
        error={Boolean(error)}
        helperText={error || undefined}
        onChange={(event) => onPhoneChange(sanitizePhoneDigits(event.target.value, countryCode))}
        sx={{
          ...fieldSx,
          "& .MuiOutlinedInput-root": {
            ...fieldSx["& .MuiOutlinedInput-root"],
            pl: 0,
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
            maxLength: phoneInputMaxLength(phoneRule.max),
          },
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 0 }}>
                <TextField
                  select
                  size="small"
                  value={countryCode}
                  onChange={(event) => onCountryCodeChange(event.target.value)}
                  variant="standard"
                  slotProps={{
                    select: {
                      disableUnderline: true,
                      IconComponent: () => (
                        <ChevronDown size={14} style={{ marginRight: 4, color: "#6B7280" }} />
                      ),
                    },
                    input: {
                      sx: { pl: 1.25, pr: 0.5, minWidth: 62, fontSize: "var(--font-size-body)", fontWeight: 600 },
                    },
                  }}
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "var(--control-height) !important",
                      minHeight: "var(--control-height)",
                      bgcolor: "#F7F8FA",
                      borderRight: "1px solid #DDE2E9",
                    },
                  }}
                >
                  {countryCodes.map((code) => (
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
  );
}

function AddPatientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id")?.trim() ?? "";
  const isEdit = searchParams.get("edit") === "true" && Boolean(patientId);
  const { data: patientList, isLoading: isLoadingPatient, isError: patientsError } = useGetPatientsQuery(
    { page: 1, pageSize: 100 },
    { skip: !isEdit },
  );
  const patients = patientList?.results ?? [];
  const patient = useMemo(
    () => (isEdit ? patients.find((item) => item.id === patientId) : undefined),
    [isEdit, patients, patientId],
  );
  const [form, setForm] = useState(initialForm);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [dobError, setDobError] = useState("");
  const [formError, setFormError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [createPatient, { isLoading: isCreating }] = useCreatePatientMutation();
  const [updatePatient, { isLoading: isUpdating }] = useUpdatePatientMutation();
  const isLoading = isCreating || isUpdating;
  if (isEdit && patient && loadedId !== patient.id) {
    setLoadedId(patient.id);
    setForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dob: isoToDobInput(patient.dateOfBirth),
      address: patient.address,
      doctor: patient.doctor,
      serviceName: patient.serviceName || "",
      countryCode: patient.countryCode || "+1",
      phoneNumber: sanitizePhoneDigits(patient.phoneNumber, patient.countryCode || "+1"),
    });
  }

  function updateField(field: keyof typeof form, value: string) {
    const nextValue = field === "dob" ? formatDobInput(value) : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    setFormError("");

    if (field === "dob") {
      const parsed = parseDobInput(nextValue);
      if (!nextValue || nextValue.length < 10) setDobError("");
      else if (!parsed) setDobError("Enter a valid date as MM/DD/YYYY.");
      else if (isFutureDate(parsed)) setDobError("Date of birth can't be in the future.");
      else setDobError("");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedDob = parseDobInput(form.dob);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.address.trim() || !form.doctor) {
      setFormError("First name, last name, address, and doctor are required.");
      return;
    }
    if (!form.serviceName.trim()) {
      setFormError("Service name is required.");
      return;
    }
    const phoneError = validatePhoneNumber(form.phoneNumber, form.countryCode, {
      required: true,
      fieldLabel: "patient phone number",
    });
    if (phoneError) {
      setFormError(phoneError);
      return;
    }
    if (!parsedDob) {
      setDobError("Enter a valid date as MM/DD/YYYY.");
      return;
    }
    if (isFutureDate(parsedDob)) {
      setDobError("Date of birth can't be in the future.");
      return;
    }

    const body = buildPatientSaveBody({
      firstName: form.firstName,
      lastName: form.lastName,
      address: form.address,
      dobIso: toIsoDate(parsedDob),
      doctor: form.doctor,
      countryCode: form.countryCode,
      phoneNumber: form.phoneNumber,
      serviceName: form.serviceName,
      isBlocked: isEdit ? Boolean(patient?.blocked) : false,
    });

    try {
      if (isEdit) {
        await updatePatient({ id: patientId, body }).unwrap();
      } else {
        await createPatient(body).unwrap();
      }
      setSuccessOpen(true);
    } catch (error) {
      setFormError(parseAuthApiError(error, "Could not save patient. Please try again."));
    }
  }

  function handleSuccessClose() {
    setSuccessOpen(false);
    router.push("/patients");
  }

  if (isEdit && !patient) {
    return (
      <Stack spacing={2} sx={{ width: "100%" }}>
        <AppBreadcrumbs
          items={[
            { label: "Patients", href: "/patients", icon: <UsersRound size={16} /> },
            { label: "Edit patient" },
          ]}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            minHeight: 240,
            bgcolor: "#FFFFFF",
            border: "1px solid #E5E9EF",
            borderRadius: "10px",
            boxShadow: elevation.floatingPanel,
          }}
        >
          {isLoadingPatient ? (
            <>
              <CircularProgress size={22} />
              <Typography sx={{ color: "text.secondary" }}>Loading patient…</Typography>
            </>
          ) : (
            <Typography sx={{ color: patientsError ? "#D92D20" : "text.secondary", textAlign: "center", px: 2 }}>
              {patientsError
                ? "Could not load this patient. Check the API connection and try again."
                : "This patient could not be found."}
            </Typography>
          )}
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <AppBreadcrumbs
        items={[
          { label: "Patients", href: "/patients", icon: <UsersRound size={16} /> },
          { label: isEdit ? "Edit patient" : "Add patient" },
        ]}
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "text.primary", lineHeight: 1.25 }}>
            {isEdit ? "Edit patient" : "Add patient"}
          </Typography>
          <Typography sx={{ mt: 0.25, color: "text.secondary" }}>
            {isEdit
              ? "Update this patient profile for outreach and follow-up calls."
              : "Create a patient profile for outreach and follow-up calls."}
          </Typography>
        </Box>
        <Box
          sx={{
            alignSelf: { xs: "flex-start", sm: "center" },
            px: 1.25,
            py: 0.6,
            borderRadius: "999px",
            bgcolor: "#EEF6FD",
            color: "#23649E",
            fontWeight: 600,
          }}
        >
          {isEdit ? "Editing" : "New patient"}
        </Box>
      </Stack>

      <Box
        component="form"
        onSubmit={(event) => void handleSubmit(event)}
        sx={{
          width: "100%",
          bgcolor: "#FFFFFF",
          border: "1px solid #E5E9EF",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: elevation.floatingPanel,
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 2.5, lg: 3 } }}>
          <SectionHeader
            icon={<UserRound size={19} />}
            title="Patient information"
            description="Basic personal and care details."
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
              columnGap: { xs: 2, lg: 2.5 },
              rowGap: 2,
            }}
          >
            <Box>
              <FieldLabel>First name</FieldLabel>
              <TextField
                fullWidth
                placeholder="Enter first name"
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                sx={fieldSx}
              />
            </Box>
            <Box>
              <FieldLabel>Last name</FieldLabel>
              <TextField
                fullWidth
                placeholder="Enter last name"
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                sx={fieldSx}
              />
            </Box>
            <Box>
              <FieldLabel>Date of birth</FieldLabel>
              <TextField
                fullWidth
                placeholder="MM/DD/YYYY"
                value={form.dob}
                error={Boolean(dobError)}
                onChange={(event) => updateField("dob", event.target.value)}
                slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 10 } }}
                sx={fieldSx}
              />
              {dobError ? (
                <Typography sx={{ mt: 0.5, color: "#D92D20" }}>{dobError}</Typography>
              ) : null}
            </Box>
            <Box>
              <FieldLabel>Doctor</FieldLabel>
              <TextField
                fullWidth
                placeholder="Enter doctor name"
                value={form.doctor}
                onChange={(event) => updateField("doctor", event.target.value)}
                sx={fieldSx}
              />
            </Box>
            <Box>
              <FieldLabel>Reason for call</FieldLabel>
              <TextField
                fullWidth
                placeholder="e.g. mammogram"
                value={form.serviceName}
                onChange={(event) => updateField("serviceName", event.target.value)}
                sx={fieldSx}
              />
            </Box>
            <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
              <FieldLabel>Address</FieldLabel>
              <TextField
                fullWidth
                placeholder="Street address, city, state, and ZIP code"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                sx={fieldSx}
              />
            </Box>
          </Box>

          <Box sx={{ my: 2.75, borderTop: "1px solid #E9EDF2" }} />

          <SectionHeader
            icon={<Phone size={18} />}
            title="Contact information"
            description="Phone numbers used during patient outreach."
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr)" },
              columnGap: { xs: 2, lg: 2.5 },
              rowGap: 2,
              maxWidth: { md: 420 },
            }}
          >
            <PhoneField
              label="Patient phone"
              countryCode={form.countryCode}
              phoneNumber={form.phoneNumber}
              error={
                validatePhoneNumber(form.phoneNumber, form.countryCode) ?? undefined
              }
              onCountryCodeChange={(value) => {
                setForm((current) => ({
                  ...current,
                  countryCode: value,
                  phoneNumber: sanitizePhoneDigits(current.phoneNumber, value),
                }));
                setFormError("");
              }}
              onPhoneChange={(value) => updateField("phoneNumber", value)}
            />
          </Box>

          {formError ? (
            <Box
              role="alert"
              sx={{
                mt: 2,
                px: 1.5,
                py: 1.1,
                borderRadius: "8px",
                color: "#B42318",
                bgcolor: "#FEF3F2",
                border: "1px solid #FECDCA",
              }}
            >
              {formError}
            </Box>
          ) : null}
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          sx={{
            justifyContent: "center",
            px: { xs: 2, sm: 2.5, lg: 3 },
            py: 1.75,
            bgcolor: "#F8FAFC",
            borderTop: "1px solid #E9EDF2",
          }}
        >
          <Button
            component={Link}
            href="/patients"
            variant="secondary"
            disabled={isLoading}
            sx={{ width: { xs: "100%", sm: 140 } }}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} sx={{ width: { xs: "100%", sm: isEdit ? 168 : 140 }, px: 2.5 }}>
            {isLoading ? "Saving…" : isEdit ? "Save changes" : "Save patient"}
          </Button>
        </Stack>

        <SuccessDialog
          open={successOpen}
          message={isEdit ? "Patient updated successfully." : "Patient added successfully."}
          onClose={handleSuccessClose}
        />
      </Box>
    </Stack>
  );
}

export default function AddPatientRoute() {
  return (
    <Suspense
      fallback={
        <Stack sx={{ minHeight: 240, alignItems: "center", justifyContent: "center" }}>
          <CircularProgress size={22} />
        </Stack>
      }
    >
      <AddPatientPage />
    </Suspense>
  );
}
