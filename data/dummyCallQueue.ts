import type { QueueCallItem, CallQueueSnapshot } from "@/types/queue";

function reindex(items: QueueCallItem[]): QueueCallItem[] {
  const active = items.filter((item) => item.status === "in_progress");
  const rest = items
    .filter((item) => item.status !== "in_progress")
    .sort((a, b) => a.position - b.position);

  return [...active, ...rest].map((item, index) => ({ ...item, position: index + 1 }));
}

/** Demo queue snapshot for UI review. */
export function createDummyCallQueue(now = Date.now()): CallQueueSnapshot {
  const ago = (ms: number) => new Date(now - ms).toISOString();

  const items: QueueCallItem[] = reindex([
    {
      id: "q-1001",
      position: 1,
      patientName: "Margaret Chen",
      phone: "+1 (555) 014-2088",
      channel: "call",
      status: "in_progress",
      estimate: "active",
      queuedAt: ago(8 * 60 * 1000),
      startedAt: ago(2 * 60 * 1000 + 20 * 1000),
      doctor: "Dr. Patel",
      reason: "Missed annual wellness visit",
    },
    {
      id: "q-1002",
      position: 2,
      patientName: "Daniel Brooks",
      phone: "+1 (555) 017-3301",
      channel: "call",
      status: "in_progress",
      estimate: "active",
      queuedAt: ago(7 * 60 * 1000),
      startedAt: ago(110 * 1000),
      doctor: "Dr. Nguyen",
      reason: "Medication follow-up",
    },
    {
      id: "q-1003",
      position: 3,
      patientName: "Aisha Rahman",
      phone: "+1 (555) 012-8840",
      channel: "call",
      status: "in_progress",
      estimate: "active",
      queuedAt: ago(5 * 60 * 1000),
      startedAt: ago(48 * 1000),
      doctor: "Dr. Alvarez",
      reason: "Lab results outreach",
    },
    {
      id: "q-1004",
      position: 4,
      patientName: "James Okonkwo",
      phone: "+1 (555) 018-4412",
      channel: "call",
      status: "queued",
      estimate: "next",
      queuedAt: ago(4 * 60 * 1000),
      startedAt: null,
      doctor: "Dr. Patel",
      reason: "Post-discharge check-in",
    },
    {
      id: "q-1005",
      position: 5,
      patientName: "Priya Shah",
      phone: "+1 (555) 021-7730",
      channel: "call",
      status: "queued",
      estimate: "about_2m",
      queuedAt: ago(9 * 60 * 1000),
      startedAt: null,
      doctor: "Dr. Kim",
      reason: "Colonoscopy reminder",
    },
    {
      id: "q-1006",
      position: 6,
      patientName: "Robert Hale",
      phone: "+1 (555) 016-9034",
      channel: "text",
      status: "paused",
      estimate: "on_hold",
      queuedAt: ago(12 * 60 * 1000),
      startedAt: null,
      doctor: "Dr. Nguyen",
      reason: "Care gap SMS follow-up",
    },
    {
      id: "q-1007",
      position: 7,
      patientName: "Elena Vargas",
      phone: "+1 (555) 019-6621",
      channel: "call",
      status: "queued",
      estimate: "about_5m",
      queuedAt: ago(15 * 60 * 1000),
      startedAt: null,
      doctor: "Dr. Alvarez",
      reason: "Flu shot campaign",
    },
    {
      id: "q-1008",
      position: 8,
      patientName: "Thomas Reed",
      phone: "+1 (555) 011-5098",
      channel: "call",
      status: "failed",
      estimate: "needs_retry",
      queuedAt: ago(18 * 60 * 1000),
      startedAt: ago(16 * 60 * 1000),
      doctor: "Dr. Patel",
      reason: "No answer",
    },
  ]);

  return {
    items,
    updatedAt: new Date(now).toISOString(),
  };
}

export function reindexQueueItems(items: QueueCallItem[]): QueueCallItem[] {
  return reindex(items);
}
