import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQuery";

export interface SettingsPayload {
  calls_enabled: boolean;
  recording_enabled: boolean;
  start_time: string;
  end_time: string;
  timezone: string;
  max_calls_per_run: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function unwrap(response: unknown): Record<string, unknown> {
  const record = asRecord(response);
  if (!record) return {};
  if ("start_time" in record || "timezone" in record || "calls_enabled" in record) {
    return record;
  }
  for (const key of ["data", "result", "settings"]) {
    const nested = asRecord(record[key]);
    if (nested && ("start_time" in nested || "timezone" in nested || "calls_enabled" in nested)) {
      return nested;
    }
  }
  return record;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") {
      return false;
    }
  }
  return fallback;
}

function asCount(value: unknown): number {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 1) return 5;
  return Math.round(count);
}

export function mapSettingsPayload(response: unknown): SettingsPayload {
  const source = unwrap(response);
  return {
    calls_enabled: asBoolean(source.calls_enabled, false),
    recording_enabled: asBoolean(source.recording_enabled, true),
    start_time: String(source.start_time ?? "09:00:00"),
    end_time: String(source.end_time ?? "17:00:00"),
    timezone: String(source.timezone ?? "America/New_York"),
    max_calls_per_run: asCount(source.max_calls_per_run),
  };
}

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Settings"],
  endpoints: (builder) => ({
    getSettings: builder.query<SettingsPayload, void>({
      query: () => "/settings/",
      transformResponse: (response: unknown) => mapSettingsPayload(response),
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation<SettingsPayload, SettingsPayload>({
      query: (body) => ({
        url: "/settings/",
        method: "PATCH",
        body,
      }),
      transformResponse: (response: unknown, _meta, arg) => {
        const record = unwrap(response);
        if (!("start_time" in record) && !("calls_enabled" in record) && !("timezone" in record)) {
          return arg;
        }
        return mapSettingsPayload(response);
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(settingsApi.util.updateQueryData("getSettings", undefined, () => data));
        } catch {
          // The settings form reports the save error.
        }
      },
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
