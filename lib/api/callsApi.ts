import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQuery";
import type { OutreachCall, OutreachChannel, OutreachStatus, TranscriptLine } from "@/data/gapCalls";
import type { CallApiRecord, CallTranscriptResponse, CallsListResponse, TranscriptApiLine } from "@/types/call";
import type { ProcessingEstimate, QueueCallItem, QueueStatus } from "@/types/queue";
import { formatPhoneNumber } from "@/constants/phone";

const CALL_TIME_ZONE = "America/New_York";

export interface CallsQuery {
  page: number;
  pageSize: number;
  status?: OutreachStatus;
  channel?: OutreachChannel;
  patient?: string | number;
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

export function mapChannel(record: CallApiRecord): OutreachChannel {
  const raw = String(
    record.channel ?? record.type ?? record.message_type ?? record.communication_type ?? record.flow ?? "call",
  )
    .trim()
    .toLowerCase();
  if (raw.includes("sms") || raw.includes("text") || raw === "message") return "text";
  return "call";
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

function formatPhone(record: CallApiRecord): string {
  const raw = String(record.to_number || record.from_number || "").trim();
  return formatPhoneNumber(raw);
}

function mapQueueStatusFromApi(value: string | undefined): QueueStatus {
  const status = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (status === "in_progress" || status === "ongoing" || status === "ringing") return "in_progress";
  if (status === "queued") return "queued";
  if (status === "paused") return "paused";
  if (status === "failed" || status === "not_attended") return "failed";
  if (status === "completed" || status === "complete" || status === "ended") return "completed";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  return "queued";
}

function estimateForQueuedPosition(positionAmongQueued: number): ProcessingEstimate {
  if (positionAmongQueued <= 1) return "next";
  if (positionAmongQueued === 2) return "about_2m";
  if (positionAmongQueued <= 4) return "about_5m";
  return "about_10m";
}

function mapQueueItem(record: CallApiRecord, position: number, status: QueueStatus): QueueCallItem {
  const reason =
    record.reason?.trim() || record.service_name?.trim() || record.decline_reason?.trim() || "";
  return {
    id: String(record.id ?? ""),
    position,
    patientName: record.patient_name?.trim() || "Unknown patient",
    phone: formatPhone(record),
    channel: mapChannel(record),
    status,
    estimate:
      status === "in_progress"
        ? "active"
        : status === "paused"
          ? "on_hold"
          : status === "failed"
            ? "needs_retry"
            : status === "completed"
              ? "done"
              : status === "cancelled"
                ? "removed"
                : estimateForQueuedPosition(position),
    queuedAt: record.created_at ?? record.started_at ?? null,
    startedAt: record.started_at ?? null,
    reason: reason || undefined,
  };
}

export interface InProgressCallsPage {
  count: number;
  totalPages: number;
  page: number;
  pageSize: number;
  results: QueueCallItem[];
}

/** Load once. The refresh button refetches. Do not poll with the notification summary. */
export const callQueueSubscriptionOptions = {
  refetchOnMountOrArgChange: 30,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  pollingInterval: 0,
} as const;

function mapQueueCallsPage(response: CallsListResponse | CallApiRecord[]): InProgressCallsPage {
  const records = asCallRecords(response);
  const page = Array.isArray(response) ? 1 : response.page ?? 1;
  const pageSize = Array.isArray(response) ? Math.max(records.length, 1) : response.page_size ?? Math.max(records.length, 1);
  const start = Math.max(0, page - 1) * pageSize;
  const results = records.map((record, index) => {
    const status = record.paused === true ? "paused" : mapQueueStatusFromApi(record.status);
    return mapQueueItem(record, start + index + 1, status);
  });
  const count = Array.isArray(response) ? records.length : response.count ?? results.length;
  return {
    count,
    totalPages: Array.isArray(response) ? 1 : response.total_pages ?? Math.max(1, Math.ceil(count / pageSize)),
    page,
    pageSize,
    results,
  };
}

function asCallRecords(response: CallsListResponse | CallApiRecord[]): CallApiRecord[] {
  if (Array.isArray(response)) return response;
  return response.results ?? [];
}

export function mapApiCall(record: CallApiRecord): OutreachCall {
  const id = String(record.id);
  const channel = mapChannel(record);
  return {
    id,
    callNumber: Number(record.id) || 0,
    patientName: record.patient_name?.trim() || "Unknown patient",
    channel,
    status: mapStatus(record.status),
    started: formatClock(record.started_at),
    duration: channel === "text" ? "—" : formatDuration(record.duration_seconds),
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
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Call"],
  endpoints: (builder) => ({
    getCalls: builder.query<CallsPage, CallsQuery>({
      query: ({ page, pageSize, status, channel, patient }) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
        });
        if (status) params.set("status", status);
        if (channel) params.set("channel", channel);
        if (patient !== undefined && patient !== null && String(patient).trim()) {
          params.set("patient", String(patient));
        }
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
    getCallQueue: builder.query<InProgressCallsPage, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
          status: "in_progress",
        });
        return `/calls/?${params.toString()}`;
      },
      transformResponse: (response: CallsListResponse | CallApiRecord[]) => mapQueueCallsPage(response),
      providesTags: [{ type: "Call", id: "QUEUE" }],
      keepUnusedDataFor: 120,
    }),
    getQueuedCallQueue: builder.query<InProgressCallsPage, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
          status: JSON.stringify(["queued", "paused"]),
        });
        return `/calls/?${params.toString()}`;
      },
      transformResponse: (response: CallsListResponse | CallApiRecord[]) => mapQueueCallsPage(response),
      providesTags: [{ type: "Call", id: "QUEUE_WAITING" }],
      keepUnusedDataFor: 120,
    }),
    getCallTranscript: builder.query<TranscriptLine[], string>({
      query: (retellCallId) => `/calls/?retell_call_id=${encodeURIComponent(retellCallId)}`,
      transformResponse: (response: CallTranscriptResponse) => (response.transcript ?? []).map(mapTranscriptLine),
    }),
    setCallPaused: builder.mutation<unknown, { id: number | string; paused: boolean }>({
      query: ({ id, paused }) => ({
        url: `/calls/${id}/`,
        method: "PUT",
        body: { paused },
      }),
      invalidatesTags: [
        { type: "Call", id: "LIST" },
        { type: "Call", id: "QUEUE" },
        { type: "Call", id: "QUEUE_WAITING" },
      ],
    }),
    startOutboundCall: builder.mutation<unknown, { id: number | string }>({
      query: ({ id }) => {
        const numericId = Number(id);
        return {
          url: "/outbound/",
          method: "POST",
          body: { id: Number.isFinite(numericId) ? numericId : id },
        };
      },
      invalidatesTags: [
        { type: "Call", id: "LIST" },
        { type: "Call", id: "QUEUE" },
        { type: "Call", id: "QUEUE_WAITING" },
      ],
    }),
  }),
});

export const {
  useGetCallsQuery,
  useGetCallQueueQuery,
  useGetQueuedCallQueueQuery,
  useGetCallTranscriptQuery,
  useSetCallPausedMutation,
  useStartOutboundCallMutation,
} = callsApi;
