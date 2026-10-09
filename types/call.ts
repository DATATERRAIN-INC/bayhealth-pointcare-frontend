import type { TranscriptLine } from "@/data/gapCalls";

export interface CallApiRecord {
  id: number | string;
  patient?: number | string;
  patient_name?: string;
  doctor?: string;
  /** Why the patient is being called (service / care gap). */
  reason?: string;
  service_name?: string;
  decline_reason?: string;
  retell_call_id?: string;
  flow?: string;
  /** Outreach channel: call | text | sms */
  channel?: string;
  type?: string;
  message_type?: string;
  communication_type?: string;
  status?: string;
  is_paused?: boolean;
  paused?: boolean;
  scheduled_at?: string | null;
  schedule_kind?: string;
  schedule_raw_time?: string;
  from_number?: string;
  to_number?: string;
  agent_id?: string;
  transfer_number?: string;
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  has_transcript?: boolean;
  /** Signed or API URL for the call audio (often .wav). */
  recording_url?: string;
  recording?: string;
  live_agent_recording_url?: string;
  liveAgentRecordingUrl?: string;
  transcript?: TranscriptApiLine[];
  message_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TranscriptApiLine {
  at?: string | null;
  text: string;
  /** Role key from API: patient | agent | live_agent */
  speaker: string;
  /** Display label from API, e.g. "AI agent", "Live agent", "Patient" */
  name?: string;
  segment?: string;
}

export interface CallTranscriptResponse {
  transcript: TranscriptApiLine[];
  recording_url?: string;
  recording?: string;
  live_agent_recording_url?: string;
  liveAgentRecordingUrl?: string;
}

export interface CallTranscriptPayload {
  transcript: TranscriptLine[];
  recordingUrl: string | null;
  liveAgentRecordingUrl: string | null;
}

export interface CallsListResponse {
  count: number;
  total_pages: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: CallApiRecord[];
}
