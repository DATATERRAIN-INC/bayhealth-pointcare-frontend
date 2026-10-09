import type { TranscriptApiLine } from "@/types/call";

export interface SmsConversationApiRecord {
  id: number | string;
  chat_id: string;
  patient_id: number | string;
  patient_name: string;
  status?: string;
  created_at: string;
}

export interface SmsConversationsListResponse {
  count: number;
  total_pages: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: SmsConversationApiRecord[];
}

export interface SmsTranscriptResponse {
  chat_id: string;
  transcript: TranscriptApiLine[];
  recording_url?: string | null;
  recording?: string | null;
  live_agent_recording_url?: string | null;
  liveAgentRecordingUrl?: string | null;
}
