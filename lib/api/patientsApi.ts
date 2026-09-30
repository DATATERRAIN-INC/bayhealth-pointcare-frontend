import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQuery";
import type { CreatePatientRequest, PatientApiRecord } from "@/types/patient";
import type { PatientRecord, PatientSource } from "@/data/gapPatients";
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
    record.name?.trim() ||
    [record.first_name, record.last_name].filter(Boolean).join(" ").trim() ||
    "Unnamed patient";
  const split = splitName(fullName);

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
    phoneNumber: record.phone_number?.trim() || "",
    liveAgentCountryCode: record.live_agent_country_code?.trim() || "+1",
    liveAgentNumber: record.live_agent_number?.trim() || "",
    blocked: asBlocked(record.is_blocked),
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
