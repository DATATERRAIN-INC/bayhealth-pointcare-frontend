export type QueueStatus =
  | "in_progress"
  | "queued"
  | "paused"
  | "failed"
  | "completed"
  | "cancelled";

export type ProcessingEstimate =
  | "active"
  | "next"
  | "about_2m"
  | "about_5m"
  | "about_10m"
  | "on_hold"
  | "needs_retry"
  | "done"
  | "removed";

export interface QueueCallItem {
  id: string;
  position: number;
  patientName: string;
  phone: string;
  channel: "call" | "text";
  status: QueueStatus;
  estimate: ProcessingEstimate;
  queuedAt: string | null;
  startedAt: string | null;
  doctor?: string;
  reason?: string;
}

export interface CallQueueSnapshot {
  items: QueueCallItem[];
  updatedAt: string;
}

export const queueStatusMeta: Record<QueueStatus, { label: string; color: string; bg: string }> = {
  in_progress: { label: "In Progress", color: "#1D5F9A", bg: "#E8F3FC" },
  queued: { label: "Queued", color: "#526071", bg: "#F0F2F5" },
  paused: { label: "Paused", color: "#B45309", bg: "#FEF3C7" },
  failed: { label: "Failed", color: "#D14343", bg: "#FDECEC" },
  completed: { label: "Completed", color: "#178A45", bg: "#E5F6EC" },
  cancelled: { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6" },
};

export const processingEstimateMeta: Record<ProcessingEstimate, string> = {
  active: "On the line now",
  next: "Next up",
  about_2m: "~2 min",
  about_5m: "~5 min",
  about_10m: "~10 min",
  on_hold: "On hold",
  needs_retry: "Failed",
  done: "Finished",
  removed: "Removed",
};

/** Older phase alias used by API mapping. */
export type QueuePhase = "processing" | "ringing" | "waiting";
