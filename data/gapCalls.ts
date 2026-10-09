import type { CallStatus } from "@/components/shared/CallStatusChip";

export type OutreachStatus = "completed" | "in_progress" | "not_attended" | "callback";
export type OutreachChannel = "call" | "text";

export interface TranscriptLine {
  /** Display label from API `name` (e.g. "AI agent", "Live agent", "Patient"). */
  speaker: string;
  /** True when API speaker role is patient (right-aligned bubble). */
  fromPatient: boolean;
  time: string;
  text: string;
}

export interface OutreachCall {
  id: string;
  callNumber: number;
  patientName: string;
  channel: OutreachChannel;
  status: CallStatus | null;
  started: string;
  duration: string;
  dateLabel: string;
  windowLabel: string;
  hasTranscript: boolean;
  messageCount: number;
  retellCallId: string;
  /** AI SMS conversation id from `/api/ai-sms/conversations/`. */
  chatId?: string;
  /** Playable recording URL from the calls API (when recording is enabled). */
  recordingUrl: string | null;
  /** Live-agent leg recording URL from the calls API. */
  liveAgentRecordingUrl: string | null;
  messages: TranscriptLine[];
}

export const channelMeta: Record<OutreachChannel, { label: string; color: string; bg: string }> = {
  call: { label: "Call", color: "#1C4E8A", bg: "#E8F1FB" },
  text: { label: "Text", color: "#1C4E8A", bg: "#E8F1FB" },
};
