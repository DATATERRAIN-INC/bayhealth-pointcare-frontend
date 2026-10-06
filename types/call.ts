export interface CallApiRecord {
  id: number | string;
  patient?: number | string;
  patient_name?: string;
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
  paused?: boolean;
  from_number?: string;
  to_number?: string;
  agent_id?: string;
  transfer_number?: string;
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  has_transcript?: boolean;
  message_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TranscriptApiLine {
  at: string | null;
  text: string;
  speaker: string;
}

export interface CallTranscriptResponse {
  transcript: TranscriptApiLine[];
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
