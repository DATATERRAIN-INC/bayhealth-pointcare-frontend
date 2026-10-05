import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQuery";
import type { OutreachCall, OutreachChannel, OutreachStatus, TranscriptLine } from "@/data/gapCalls";
import type { CallApiRecord, CallTranscriptResponse, CallsListResponse, TranscriptApiLine } from "@/types/call";
import type { CallQueueSnapshot, QueueCallItem, QueueStatus } from "@/types/queue";
import { reindexQueueItems } from "@/data/dummyCallQueue";

const CALL_TIME_ZONE = "America/New_York";

export interface CallsQuery {
  page: number;
  pageSize: number;
  status?: OutreachStatus;
  channel?: OutreachChannel;
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

function mapQueueStatus(value: string | undefined): QueueStatus | null {
  const status = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (status === "queued" || status === "pending" || status === "waiting" || status === "scheduled" || status === "ringing" || status === "dialing") {
    return "queued";
  }
  if (status === "paused" || status === "on_hold") return "paused";
  if (status === "failed" || status === "error" || status === "no_answer") return "failed";
  if (status === "completed" || status === "complete" || status === "ended") return "completed";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "in_progress" || status === "ongoing" || status === "active" || status === "connected") {
    return "in_progress";
  }
  return null;
}

function queueTimestamp(record: CallApiRecord): number {
  const iso = record.started_at || record.created_at || record.updated_at || "";
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function formatPhone(record: CallApiRecord): string {
  const raw = String(record.to_number || record.from_number || "").trim();
  return raw || "—";
}

function mapQueueItem(record: CallApiRecord, position: number, status: QueueStatus): QueueCallItem {
  return {
    id: String(record.id),
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
                : "about_5m",
    queuedAt: record.created_at ?? record.started_at ?? null,
    startedAt: record.started_at ?? null,
  };
}

function asCallRecords(response: CallsListResponse | CallApiRecord[]): CallApiRecord[] {
  if (Array.isArray(response)) return response;
  return response.results ?? [];
}

function buildQueueSnapshot(response: CallsListResponse | CallApiRecord[]): CallQueueSnapshot {
  const mapped = asCallRecords(response)
    .map((record) => {
      const status = mapQueueStatus(record.status);
      return status ? { record, status } : null;
    })
    .filter((item): item is { record: CallApiRecord; status: QueueStatus } => Boolean(item))
    .sort((a, b) => queueTimestamp(a.record) - queueTimestamp(b.record))
    .map((item, index) => mapQueueItem(item.record, index + 1, item.status));

  return {
    items: reindexQueueItems(mapped),
    updatedAt: new Date().toISOString(),
  };
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
      query: ({ page, pageSize, status, channel }) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
        });
        if (status) params.set("status", status);
        if (channel) params.set("channel", channel);
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
    getCallQueue: builder.query<CallQueueSnapshot, void>({
      query: () => "/calls/?page=1&page_size=50&status=in_progress",
      transformResponse: (response: CallsListResponse | CallApiRecord[]) => buildQueueSnapshot(response),
      providesTags: [{ type: "Call", id: "QUEUE" }],
    }),
    getCallTranscript: builder.query<TranscriptLine[], string>({
      query: (retellCallId) => `/calls/?retell_call_id=${encodeURIComponent(retellCallId)}`,
      transformResponse: (response: CallTranscriptResponse) => (response.transcript ?? []).map(mapTranscriptLine),
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
      ],
    }),
  }),
});

export const {
  useGetCallsQuery,
  useGetCallQueueQuery,
  useGetCallTranscriptQuery,
  useStartOutboundCallMutation,
} = callsApi;
