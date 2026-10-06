import type { CallStatus } from "@/components/shared/CallStatusChip";

export type OutreachStatus = "completed" | "in_progress" | "not_attended" | "callback";
export type OutreachChannel = "call" | "text";

export interface TranscriptLine {
  speaker: "AI agent" | "Patient";
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
  messages: TranscriptLine[];
}

export const channelMeta: Record<OutreachChannel, { label: string; color: string; bg: string }> = {
  call: { label: "Call", color: "#1C4E8A", bg: "#E8F1FB" },
  text: { label: "Text", color: "#0F6B4C", bg: "#E6F6EF" },
};
