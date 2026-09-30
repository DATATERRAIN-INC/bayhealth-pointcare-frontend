import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "@/lib/auth";
import { getBaseUrl } from "@/lib/api/baseUrl";
import type { CreatePatientRequest, PatientApiRecord } from "@/types/patient";
import type { PatientRecord, PatientSource } from "@/data/gapPatients";

function mapSource(value: unknown): PatientSource {
  return String(value ?? "").toLowerCase() === "excel" ? "Excel" : "Manual";
}

export function mapApiPatient(record: PatientApiRecord): PatientRecord {
  const fullName =
    record.name?.trim() ||
    [record.first_name, record.last_name].filter(Boolean).join(" ").trim() ||
    "Unnamed patient";

  return {
    id: String(record.id),
    name: fullName,
    address: record.address,
    dateOfBirth: record.dob,
    doctor: record.doctor,
    source: mapSource(record.source),
  };
}

export const patientsApi = createApi({
  reducerPath: "patientsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/ai-call`,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Patient"],
  endpoints: (builder) => ({
    getPatients: builder.query<PatientRecord[], void>({
      query: () => "/patients/",
      transformResponse: (response: PatientApiRecord[] | { results?: PatientApiRecord[] }) => {
        const rows = Array.isArray(response) ? response : response.results ?? [];
        return rows.map(mapApiPatient);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Patient" as const, id })),
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
  }),
});

export const { useGetPatientsQuery, useCreatePatientMutation } = patientsApi;
