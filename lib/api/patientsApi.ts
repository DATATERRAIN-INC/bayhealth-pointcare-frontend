import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQuery";
import type { CreatePatientRequest, PatientApiRecord, PatientTryAttemptApi } from "@/types/patient";
import type { PatientRecord, PatientSource, PatientTryAttempt } from "@/data/gapPatients";
import type { OutreachChannel } from "@/data/gapCalls";
import { parseCallStatus } from "@/components/shared/CallStatusChip";
import { normalizeCountryCode, sanitizePhoneDigits } from "@/lib/phone";

/** Build the exact POST/PATCH body keys expected by `/api/ai-call/patients/`. */
export function buildPatientSaveBody(input: {
  firstName: string;
  lastName: string;
  address: string;
  dobIso: string;
  doctor: string;
  countryCode: string;
  phoneNumber: string;
  serviceName: string;
  isBlocked?: boolean;
}): CreatePatientRequest {
  const countryCode = normalizeCountryCode(input.countryCode);
  return {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    address: input.address.trim(),
    dob: input.dobIso,
    doctor: input.doctor.trim(),
    service_name: input.serviceName.trim(),
    country_code: countryCode,
    phone_number: sanitizePhoneDigits(input.phoneNumber, countryCode),
    is_blocked: Boolean(input.isBlocked),
  };
}

function asBlocked(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

function mapSource(value: unknown): PatientSource {
  return String(value ?? "").toLowerCase() === "excel" ? "Excel" : "Manual";
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function mapPatientChannel(...values: unknown[]): OutreachChannel | null {
  for (const value of values) {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase();
    if (!normalized) continue;
    if (normalized === "text" || normalized === "sms" || normalized === "message" || normalized === "messaging") {
      return "text";
    }
    if (normalized === "call" || normalized === "voice" || normalized === "phone" || normalized === "outbound") {
      return "call";
    }
  }
  return null;
}

function pickLastCall(record: PatientApiRecord) {
  const nested = record.last_call && typeof record.last_call === "object" ? record.last_call : null;
  const lastCallId = firstString(
    record.call_id,
    record.last_call_id,
    record.latest_call_id,
    record.call_number,
    nested?.id,
    nested?.call_id,
  );
  const lastCallChannel = mapPatientChannel(
    record.channel,
    record.call_channel,
    record.last_call_channel,
    nested?.channel,
  );
  const retellCallId = firstString(record.retell_call_id, nested?.retell_call_id);
  const durationSeconds = parseDurationSeconds(record.duration_seconds ?? nested?.duration_seconds);
  const hasTranscript =
    Boolean(record.has_transcript) ||
    Boolean(nested?.has_transcript);
  return {
    lastCallId: lastCallId || null,
    lastCallChannel,
    retellCallId,
    hasTranscript,
    durationSeconds,
  };
}

function parseDurationSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    const parsed = Number(value);
    return parsed >= 0 ? parsed : null;
  }
  return null;
}

function mapAttemptChannel(callType: unknown): OutreachChannel {
  const raw = String(callType ?? "")
    .trim()
    .toLowerCase();
  if (raw.includes("sms") || raw.includes("text") || raw === "message") return "text";
  return "call";
}

function mapTryAttempt(raw: PatientTryAttemptApi, index: number): PatientTryAttempt {
  return {
    id: firstString(raw.id) || `attempt-${index}`,
    datetime: typeof raw.datetime === "string" && raw.datetime.trim() ? raw.datetime.trim() : null,
    callType: String(raw.call_type ?? "").trim() || "outbound",
    channel: mapAttemptChannel(raw.call_type),
    status: parseCallStatus(raw.status),
    retellCallId: firstString(raw.retell_call_id),
  };
}

function mapPatientTries(value: unknown): { count: number; attempts: PatientTryAttempt[] } {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return { count: Math.floor(value), attempts: [] };
  }
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    const parsed = Number(value);
    return { count: parsed >= 0 ? Math.floor(parsed) : 0, attempts: [] };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { count: 0, attempts: [] };
  }

  const record = value as { count?: unknown; attempts?: unknown };
  const rawAttempts = Array.isArray(record.attempts) ? (record.attempts as PatientTryAttemptApi[]) : [];
  const attempts = rawAttempts
    .map((item, index) => mapTryAttempt(item, index))
    .sort((a, b) => {
      const aTime = a.datetime ? new Date(a.datetime).getTime() : 0;
      const bTime = b.datetime ? new Date(b.datetime).getTime() : 0;
      return aTime - bTime;
    });

  const countValue = record.count;
  const count =
    typeof countValue === "number" && Number.isFinite(countValue) && countValue >= 0
      ? Math.floor(countValue)
      : typeof countValue === "string" && countValue.trim() && Number.isFinite(Number(countValue))
        ? Math.max(0, Math.floor(Number(countValue)))
        : attempts.length;

  return { count: Math.max(count, attempts.length), attempts };
}

export interface PatientListQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export interface PatientList {
  results: PatientRecord[];
  count: number;
}

function patientRows(response: unknown): PatientApiRecord[] {
  if (Array.isArray(response)) return response as PatientApiRecord[];
  if (!response || typeof response !== "object") return [];
  const record = response as Record<string, unknown>;
  for (const key of ["results", "data", "patients"]) {
    const value = record[key];
    if (Array.isArray(value)) return value as PatientApiRecord[];
    if (value && typeof value === "object") {
      const nested = (value as { results?: unknown }).results;
      if (Array.isArray(nested)) return nested as PatientApiRecord[];
    }
  }
  return [];
}

function patientCount(response: unknown, fallback: number): number {
  if (!response || typeof response !== "object" || Array.isArray(response)) return fallback;
  const count = (response as { count?: unknown }).count;
  if (typeof count === "number" && Number.isFinite(count)) return count;
  if (typeof count === "string" && count.trim() && Number.isFinite(Number(count))) return Number(count);
  return fallback;
}

export function mapApiPatient(record: PatientApiRecord): PatientRecord {
  const id = String(record.id);
  const fullName =
    record.full_name?.trim() ||
    record.name?.trim() ||
    [record.first_name, record.last_name].filter(Boolean).join(" ").trim() ||
    "Unnamed patient";
  const split = splitName(fullName);
  const lastCall = pickLastCall(record);
  const callStatus = parseCallStatus(record.call_status);
  const tries = mapPatientTries(record.patient_tries ?? record.tries);

  return {
    id,
    name: fullName,
    firstName: record.first_name?.trim() || split.firstName,
    lastName: record.last_name?.trim() || split.lastName,
    address: record.address,
    dateOfBirth: record.dob,
    doctor: record.doctor,
    source: mapSource(record.source),
    countryCode: record.country_code?.trim() || "+1",
    phoneNumber: sanitizePhoneDigits(
      String(record.phone_number ?? ""),
      record.country_code?.trim() || "+1",
    ),
    serviceName: record.service_name?.trim() || record.reason_for_call?.trim() || "",
    blocked: asBlocked(record.is_blocked),
    callStatus,
    lastCallId: lastCall.lastCallId,
    lastCallChannel: lastCall.lastCallChannel ?? (callStatus ? "call" : null),
    retellCallId: lastCall.retellCallId,
    hasTranscript: lastCall.hasTranscript,
    durationSeconds: lastCall.durationSeconds,
    patientTries: tries.count,
    tryAttempts: tries.attempts,
  };
}

export const patientsApi = createApi({
  reducerPath: "patientsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Patient"],
  endpoints: (builder) => ({
    getPatients: builder.query<PatientList, PatientListQuery>({
      query: ({ page, pageSize, search }) => ({
        url: "/patients/",
        params: {
          page,
          page_size: pageSize,
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: (response: unknown): PatientList => {
        const results = patientRows(response).map(mapApiPatient);
        return { results, count: patientCount(response, results.length) };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: "Patient" as const, id })),
              { type: "Patient", id: "LIST" },
            ]
          : [{ type: "Patient", id: "LIST" }],
    }),
    createPatient: builder.mutation<PatientApiRecord, CreatePatientRequest>({
      query: (body) => ({
        url: "/patients/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Patient", id: "LIST" }],
    }),
    updatePatient: builder.mutation<PatientApiRecord, { id: string; body: CreatePatientRequest }>({
      query: ({ id, body }) => ({
        url: `/patients/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Patient", id },
        { type: "Patient", id: "LIST" },
      ],
    }),
    uploadPatients: builder.mutation<unknown, File>({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: "/patients/upload/",
          method: "POST",
          body,
        };
      },
      invalidatesTags: [{ type: "Patient", id: "LIST" }],
    }),
    setPatientBlockedStatus: builder.mutation<PatientApiRecord, { id: string; is_blocked: boolean }>({
      query: ({ id, is_blocked }) => ({
        url: `/patients/${id}/`,
        method: "PATCH",
        body: { is_blocked },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Patient", id },
        { type: "Patient", id: "LIST" },
      ],
      async onQueryStarted({ id, is_blocked }, { dispatch, getState, queryFulfilled }) {
        const patches = patientsApi.util.selectCachedArgsForQuery(getState(), "getPatients").map((queryArgs) =>
          dispatch(
            patientsApi.util.updateQueryData("getPatients", queryArgs, (draft) => {
              const row = draft.results.find((item) => item.id === id);
              if (row) row.blocked = is_blocked;
            }),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
    }),
  }),
});

export const {
  useGetPatientsQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useSetPatientBlockedStatusMutation,
  useUploadPatientsMutation,
} = patientsApi;
