import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQuery";
import { getBaseUrl } from "@/lib/api/baseUrl";
import {
  liveAgentRecordingUrlFromResponse,
  recordingUrlFromResponse,
} from "@/lib/api/callRecording";
import { patientsApi } from "@/lib/api/patientsApi";
import { callsApi, type CallsPage } from "@/lib/api/callsApi";
import type { OutreachCall, TranscriptLine } from "@/data/gapCalls";
import type { CallTranscriptPayload, TranscriptApiLine } from "@/types/call";
import type {
  SmsConversationApiRecord,
  SmsConversationsListResponse,
  SmsTranscriptResponse,
} from "@/types/sms";

const CALL_TIME_ZONE = "America/New_York";

function smsUrl(path: string): string {
  return `${getBaseUrl()}${path}`;
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

function mapSmsTranscriptLine(line: TranscriptApiLine): TranscriptLine {
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

export function mapSmsConversation(record: SmsConversationApiRecord): OutreachCall {
  const id = String(record.id);
  const chatId = record.chat_id?.trim() ?? "";
  return {
    id,
    callNumber: Number(record.id) || 0,
    patientName: record.patient_name?.trim() || "Unknown patient",
    channel: "text",
    // Text rows always show Sent (green); ignore API status variants.
    status: "ongoing",
    started: formatClock(record.created_at),
    duration: "—",
    dateLabel: formatDateLabel(record.created_at),
    windowLabel: formatWindowLabel(record.created_at),
    hasTranscript: Boolean(chatId),
    messageCount: 0,
    retellCallId: "",
    chatId,
    recordingUrl: null,
    liveAgentRecordingUrl: null,
    messages: [],
  };
}

export function mapSmsTranscriptPayload(response: SmsTranscriptResponse | unknown): CallTranscriptPayload {
  const record =
    response && typeof response === "object" && !Array.isArray(response)
      ? (response as SmsTranscriptResponse)
      : null;
  const lines = Array.isArray(record?.transcript) ? record.transcript : [];
  return {
    transcript: lines.map(mapSmsTranscriptLine),
    recordingUrl: recordingUrlFromResponse(response) || null,
    liveAgentRecordingUrl: liveAgentRecordingUrlFromResponse(response) || null,
  };
}

export const smsApi = createApi({
  reducerPath: "smsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Sms"],
  endpoints: (builder) => ({
    getSmsConversations: builder.query<CallsPage, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
        });
        return smsUrl(`/api/ai-sms/conversations/?${params.toString()}`);
      },
      transformResponse: (response: SmsConversationsListResponse | SmsConversationApiRecord[]) => {
        if (Array.isArray(response)) {
          return {
            count: response.length,
            totalPages: 1,
            page: 1,
            pageSize: response.length,
            results: response.map(mapSmsConversation),
          };
        }
        const results = (response.results ?? []).map(mapSmsConversation);
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
              ...result.results.map(({ id }) => ({ type: "Sms" as const, id })),
              { type: "Sms", id: "LIST" },
            ]
          : [{ type: "Sms", id: "LIST" }],
    }),
    getSmsTranscript: builder.query<CallTranscriptPayload, string>({
      query: (chatId) => {
        const params = new URLSearchParams({ chat_id: chatId });
        return smsUrl(`/api/ai-sms/conversations/?${params.toString()}`);
      },
      transformResponse: (response: SmsTranscriptResponse | unknown) => mapSmsTranscriptPayload(response),
      providesTags: (_result, _error, chatId) => [{ type: "Sms", id: `transcript-${chatId}` }],
    }),
    startOutboundSms: builder.mutation<unknown, { id: number | string }>({
      query: ({ id }) => {
        const numericId = Number(id);
        return {
          url: smsUrl("/api/ai-sms/outbound/"),
          method: "POST",
          body: { id: Number.isFinite(numericId) ? numericId : id },
        };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(patientsApi.util.invalidateTags([{ type: "Patient", id: "LIST" }]));
          dispatch(callsApi.util.invalidateTags([{ type: "Call", id: "LIST" }]));
          dispatch(smsApi.util.invalidateTags([{ type: "Sms", id: "LIST" }]));
        } catch {
          // Keep current cache when the SMS request fails.
        }
      },
    }),
  }),
});

export const {
  useGetSmsConversationsQuery,
  useGetSmsTranscriptQuery,
  useStartOutboundSmsMutation,
} = smsApi;
