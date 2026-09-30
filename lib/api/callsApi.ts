import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthToken } from "@/lib/auth";
import { getBaseUrl } from "@/lib/api/baseUrl";
import type { OutreachCall, OutreachStatus, TranscriptLine } from "@/data/gapCalls";
import type { CallApiRecord, CallTranscriptResponse, CallsListResponse, TranscriptApiLine } from "@/types/call";

const CALL_TIME_ZONE = "America/New_York";

export interface CallsQuery {
  page: number;
  pageSize: number;
  status?: OutreachStatus;
}

export interface CallsPage {
  count: number;
  totalPages: number;
  page: number;
  pageSize: number;
  results: OutreachCall[];
}

function mapStatus(value: string | undefined): OutreachStatus {
  const status = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (status === "completed" || status === "complete" || status === "ended") return "completed";
  if (status === "in_progress" || status === "ongoing" || status === "ringing" || status === "queued") {
    return "in_progress";
  }
  return "not_attended";
}

function formatClock(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CALL_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDateLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CALL_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatWindowLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CALL_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "—";
  const mins = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  if (mins === 0) return `${remainder}s`;
  return `${mins}m ${remainder}s`;
}

export function mapApiCall(record: CallApiRecord): OutreachCall {
  const id = String(record.id);
  return {
    id,
    callNumber: Number(record.id) || 0,
    patientName: record.patient_name?.trim() || "Unknown patient",
    status: mapStatus(record.status),
    started: formatClock(record.started_at),
    duration: formatDuration(record.duration_seconds),
    dateLabel: formatDateLabel(record.started_at),
    windowLabel: formatWindowLabel(record.started_at),
    hasTranscript: Boolean(record.has_transcript),
    messageCount: record.message_count ?? 0,
    retellCallId: record.retell_call_id?.trim() ?? "",
    messages: [],
  };
}

function mapTranscriptLine(line: TranscriptApiLine): TranscriptLine {
  const speaker = line.speaker?.trim().toLowerCase() === "patient" ? "Patient" : "AI agent";
  return {
    speaker,
    time: line.at ? formatClock(line.at) : "",
    text: line.text ?? "",
  };
}

export const callsApi = createApi({
  reducerPath: "callsApi",
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
  tagTypes: ["Call"],
  endpoints: (builder) => ({
    getCalls: builder.query<CallsPage, CallsQuery>({
      query: ({ page, pageSize, status }) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
        });
        if (status) params.set("status", status);
        return `/calls/?${params.toString()}`;
      },
      transformResponse: (response: CallsListResponse | CallApiRecord[]) => {
        if (Array.isArray(response)) {
          return {
            count: response.length,
            totalPages: 1,
            page: 1,
            pageSize: response.length,
            results: response.map(mapApiCall),
          };
        }
        const results = (response.results ?? []).map(mapApiCall);
        return {
          count: response.count ?? results.length,
          totalPages: response.total_pages ?? 1,
          page: response.page ?? 1,
          pageSize: response.page_size ?? results.length,
          results,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: "Call" as const, id })),
              { type: "Call", id: "LIST" },
            ]
          : [{ type: "Call", id: "LIST" }],
    }),
    getCallTranscript: builder.query<TranscriptLine[], string>({
      query: (retellCallId) => `/calls/?retell_call_id=${encodeURIComponent(retellCallId)}`,
      transformResponse: (response: CallTranscriptResponse) => (response.transcript ?? []).map(mapTranscriptLine),
    }),
  }),
});

export const { useGetCallsQuery, useGetCallTranscriptQuery } = callsApi;
