export type OutreachStatus = "completed" | "in_progress" | "not_attended";

export interface TranscriptLine {
  speaker: "AI agent" | "Patient";
  time: string;
  text: string;
}

export interface OutreachCall {
  id: string;
  callNumber: number;
  patientName: string;
  status: OutreachStatus;
  started: string;
  duration: string;
  dateLabel: string;
  windowLabel: string;
  hasTranscript: boolean;
  messageCount: number;
  retellCallId: string;
  messages: TranscriptLine[];
}

export const statusMeta: Record<OutreachStatus, { label: string; color: string }> = {
  completed: { label: "Completed", color: "#1B7A45" },
  in_progress: { label: "In Progress", color: "#F08A1A" },
  not_attended: { label: "Not attended", color: "#D14343" },
};
