import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQuery";
import { parseCallStatus, type CallStatus } from "@/components/shared/CallStatusChip";
import type { OutreachCall, OutreachChannel, OutreachStatus, TranscriptLine } from "@/data/gapCalls";
import {
  liveAgentRecordingUrlFromResponse,
  pickLiveAgentRecordingUrl,
  pickRecordingUrl,
  recordingUrlFromResponse,
} from "@/lib/api/callRecording";
import type {
  CallApiRecord,
  CallTranscriptPayload,
  CallTranscriptResponse,
  CallsListResponse,
  TranscriptApiLine,
} from "@/types/call";
import type { ProcessingEstimate, QueueCallItem, QueueStatus } from "@/types/queue";
import { formatPhoneNumber } from "@/constants/phone";

const CALL_TIME_ZONE = "America/New_York";

export interface CallsQuery {
  page: number;
  pageSize: number;
  status?: OutreachStatus;
  channel?: OutreachChannel;
  patient?: string | number;
  /** Patient first/last/full name or call id. */
  search?: string;
}

export interface CallQueueQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export interface QueuedCallQueueQuery {
  page: number;
  pageSize: number;
  status: string;
  search?: string;
}

export interface CallsPage {
  count: number;
  totalPages: number;
  page: number;
  pageSize: number;
  results: OutreachCall[];
}

function mapStatus(value: string | undefined): CallStatus | null {
  const parsed = parseCallStatus(value);
  if (parsed) return parsed;
  const status = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (status === "complete" || status === "ended") return "completed";
  if (status === "ongoing" || status === "ringing") return "in_progress";
  return null;
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

/** Date + time for the Calls and texts Started column (America/New_York). */
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CALL_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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
  if (status === "scheduled") return "scheduled";
  if (status === "failed" || status === "not_attended") return "failed";
  if (status === "completed" || status === "complete" || status === "ended") return "completed";
  if (status === "cancelled" || status === "canceled" || status === "cancel") return "cancelled";
  return "queued";
}

function estimateForQueuedPosition(positionAmongQueued: number): ProcessingEstimate {
  if (positionAmongQueued <= 1) return "next";
  if (positionAmongQueued === 2) return "about_2m";
  if (positionAmongQueued <= 4) return "about_5m";
  return "about_10m";
}

function patientDisplayName(record: CallApiRecord): string {
  const full = String(record.full_name ?? record.patient_name ?? "").trim();
  if (full) return full;
  const first = String(record.patient_first_name ?? record.first_name ?? "").trim();
  const last = String(record.patient_last_name ?? record.last_name ?? "").trim();
  const joined = [first, last].filter(Boolean).join(" ").trim();
  return joined || "Unknown patient";
}

function mapQueueItem(record: CallApiRecord, position: number, status: QueueStatus): QueueCallItem {
  const reason =
    record.reason?.trim() || record.service_name?.trim() || record.decline_reason?.trim() || "";
  return {
    id: String(record.id ?? ""),
    position,
    patientName: patientDisplayName(record),
    phone: formatPhone(record),
    channel: mapChannel(record),
    status,
    estimate:
      status === "in_progress"
        ? "active"
        : status === "paused"
          ? "on_hold"
          : status === "scheduled"
            ? "scheduled"
            : status === "failed"
              ? "needs_retry"
              : status === "completed"
                ? "done"
                : status === "cancelled"
                  ? "removed"
                  : estimateForQueuedPosition(position),
    queuedAt: record.created_at ?? record.started_at ?? null,
    startedAt: record.started_at ?? null,
    scheduledAt: record.scheduled_at ?? null,
    doctor: record.doctor?.trim() || undefined,
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

export interface CallSummary {
  all: number;
  completed: number;
  in_progress: number;
  not_attended: number;
  callback: number;
  queued: number;
  scheduled: number;
  paused: number;
  cancel: number;
}

function asCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
}

/** Normalize one or many call ids for bulk status PUT `{ call_ids, status }`. */
function toCallIds(
  id?: number | string,
  ids?: Array<number | string>,
): Array<number | string> {
  const source = ids?.length ? ids : id != null ? [id] : [];
  return source.map((value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  });
}

function mapCallSummary(response: Partial<CallSummary> | null | undefined): CallSummary {
  return {
    all: asCount(response?.all),
    completed: asCount(response?.completed),
    in_progress: asCount(response?.in_progress),
    not_attended: asCount(response?.not_attended),
    callback: asCount(response?.callback),
    queued: asCount(response?.queued),
    scheduled: asCount(response?.scheduled),
    paused: asCount(response?.paused),
    cancel: asCount(response?.cancel),
  };
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
    const paused = record.is_paused === true || record.paused === true;
    const scheduled =
      !paused &&
      (mapQueueStatusFromApi(record.status) === "scheduled" || Boolean(record.scheduled_at));
    const status = paused ? "paused" : scheduled ? "scheduled" : mapQueueStatusFromApi(record.status);
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
    patientName: patientDisplayName(record),
    channel,
    status: mapStatus(record.status),
    started: formatDateTime(record.started_at),
    duration: channel === "text" ? "—" : formatDuration(record.duration_seconds),
    dateLabel: formatDateLabel(record.started_at),
    windowLabel: formatWindowLabel(record.started_at),
    hasTranscript: Boolean(record.has_transcript),
    messageCount: record.message_count ?? 0,
    retellCallId: record.retell_call_id?.trim() ?? "",
    recordingUrl: pickRecordingUrl(record) || null,
    liveAgentRecordingUrl: pickLiveAgentRecordingUrl(record) || null,
    messages: [],
  };
}

function mapTranscriptLine(line: TranscriptApiLine): TranscriptLine {
  const role = line.speaker?.trim().toLowerCase() ?? "";
  const fromPatient = role === "patient";
  const displayName =
    line.name?.trim() ||
    (fromPatient ? "Patient" : role === "live_agent" ? "Live agent" : "AI agent");
  return {
    speaker: displayName,
    fromPatient,
    time: line.at ? formatClock(line.at) : "",
    text: line.text ?? "",
  };
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function transcriptLinesFrom(source: unknown): TranscriptApiLine[] {
  const record = asObject(source);
  if (!record) return [];
  const transcript = record.transcript;
  if (!Array.isArray(transcript)) return [];
  return transcript as TranscriptApiLine[];
}

/** Normalize list / detail / transcript envelopes into one payload with both recording URLs. */
export function mapCallTranscriptPayload(
  response: CallTranscriptResponse | CallsListResponse | CallApiRecord[] | unknown,
): CallTranscriptPayload {
  const candidates: unknown[] = [];
  if (Array.isArray(response)) {
    candidates.push(...response);
  } else {
    const record = asObject(response);
    if (record) {
      candidates.push(record);
      const results = record.results;
      if (Array.isArray(results) && results[0]) candidates.unshift(results[0]);
      const data = asObject(record.data);
      if (data) candidates.unshift(data);
    }
  }

  let recordingUrl = recordingUrlFromResponse(response);
  let liveAgentRecordingUrl = liveAgentRecordingUrlFromResponse(response);
  let rawLines: TranscriptApiLine[] = transcriptLinesFrom(response);

  for (const candidate of candidates) {
    if (!recordingUrl) recordingUrl = pickRecordingUrl(candidate);
    if (!liveAgentRecordingUrl) liveAgentRecordingUrl = pickLiveAgentRecordingUrl(candidate);
    if (rawLines.length === 0) rawLines = transcriptLinesFrom(candidate);
  }

  return {
    transcript: rawLines.map(mapTranscriptLine),
    recordingUrl: recordingUrl || null,
    liveAgentRecordingUrl: liveAgentRecordingUrl || null,
  };
}

export const callsApi = createApi({
  reducerPath: "callsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Call"],
  endpoints: (builder) => ({
    getCalls: builder.query<CallsPage, CallsQuery>({
      query: ({ page, pageSize, status, channel, patient, search }) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
        });
        if (status) params.set("status", status);
        if (channel) params.set("channel", channel);
        if (patient !== undefined && patient !== null && String(patient).trim()) {
          params.set("patient", String(patient));
        }
        if (search?.trim()) params.set("search", search.trim());
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
    getCallQueue: builder.query<InProgressCallsPage, CallQueueQuery>({
      query: ({ page, pageSize, search }) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
          status: "in_progress",
        });
        if (search?.trim()) params.set("search", search.trim());
        return `/calls/?${params.toString()}`;
      },
      transformResponse: (response: CallsListResponse | CallApiRecord[]) => mapQueueCallsPage(response),
      providesTags: [
        { type: "Call", id: "QUEUE" },
        { type: "Call", id: "STATUS_in_progress" },
      ],
      keepUnusedDataFor: 120,
    }),
    getCallSummary: builder.query<CallSummary, void>({
      query: () => "/calls/summary/",
      transformResponse: (response: Partial<CallSummary>) => mapCallSummary(response),
      providesTags: [{ type: "Call", id: "SUMMARY" }],
      keepUnusedDataFor: 120,
    }),
    getQueuedCallQueue: builder.query<InProgressCallsPage, QueuedCallQueueQuery>({
      query: ({ page, pageSize, status, search }) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
          status,
          // ordering: "dial_queue",
        });
        if (search?.trim()) params.set("search", search.trim());
        return `/calls/?${params.toString()}`;
      },
      transformResponse: (response: CallsListResponse | CallApiRecord[]) => mapQueueCallsPage(response),
      providesTags: (_result, _error, arg) => {
        const statuses = String(arg.status)
          .split(",")
          .map((part) => part.trim().toLowerCase())
          .filter(Boolean);
        return [
          { type: "Call" as const, id: "QUEUE_WAITING" },
          ...statuses.map((status) => ({ type: "Call" as const, id: `STATUS_${status}` })),
        ];
      },
      keepUnusedDataFor: 120,
    }),
    getCallTranscript: builder.query<CallTranscriptPayload, string>({
      query: (retellCallId) => `/calls/?retell_call_id=${encodeURIComponent(retellCallId)}`,
      transformResponse: (response: CallTranscriptResponse | CallsListResponse | CallApiRecord[]) =>
        mapCallTranscriptPayload(response),
    }),
    setCallPaused: builder.mutation<
      unknown,
      { id?: number | string; ids?: Array<number | string>; paused: boolean }
    >({
      query: ({ id, ids, paused }) => ({
        url: "/calls/",
        method: "PUT",
        body: {
          call_ids: toCallIds(id, ids),
          status: paused ? "paused" : "queued",
        },
      }),
      invalidatesTags: [
        { type: "Call", id: "LIST" },
        { type: "Call", id: "QUEUE" },
        { type: "Call", id: "QUEUE_WAITING" },
        { type: "Call", id: "SUMMARY" },
      ],
    }),
    cancelCall: builder.mutation<unknown, { id?: number | string; ids?: Array<number | string> }>({
      query: ({ id, ids }) => ({
        url: "/calls/",
        method: "PUT",
        body: {
          call_ids: toCallIds(id, ids),
          status: "cancel",
        },
      }),
      invalidatesTags: [
        { type: "Call", id: "LIST" },
        { type: "Call", id: "QUEUE" },
        { type: "Call", id: "QUEUE_WAITING" },
        { type: "Call", id: "SUMMARY" },
      ],
    }),
    triggerCall: builder.mutation<unknown, { id: number | string }>({
      query: ({ id }) => ({
        url: `/calls/${id}/trigger/`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Call", id: "LIST" },
        { type: "Call", id: "QUEUE" },
        { type: "Call", id: "QUEUE_WAITING" },
        { type: "Call", id: "SUMMARY" },
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
        { type: "Call", id: "SUMMARY" },
      ],
    }),
  }),
});

export const {
  useGetCallsQuery,
  useGetCallQueueQuery,
  useGetCallSummaryQuery,
  useGetQueuedCallQueueQuery,
  useGetCallTranscriptQuery,
  useSetCallPausedMutation,
  useCancelCallMutation,
  useTriggerCallMutation,
  useStartOutboundCallMutation,
} = callsApi;
