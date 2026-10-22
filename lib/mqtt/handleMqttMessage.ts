import { callsApi } from "@/lib/api/callsApi";
import { notificationsApi } from "@/lib/api/notificationsApi";
import { patientsApi } from "@/lib/api/patientsApi";
import type { NotificationItem } from "@/types/notification";
import type { AppDispatch, RootState } from "@/lib/store";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";

type Dispatch = ThunkDispatch<RootState, unknown, UnknownAction> & AppDispatch;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Math.max(0, Math.round(Number(value)));
  }
  return null;
}

function mapNotification(value: unknown): NotificationItem | null {
  const record = asRecord(value);
  if (!record || record.id == null) return null;
  const metadata = asRecord(record.metadata) ?? {};
  return {
    id: Number(record.id),
    event_type: String(record.event_type ?? ""),
    title: String(record.title ?? "Notification"),
    message: String(record.message ?? ""),
    metadata,
    is_read: record.is_read === true || record.is_read === "true" || record.is_read === 1,
    created_at: String(record.created_at ?? ""),
  };
}

/** Broker payloads may be the data object, or wrap it as `{ data: … }`. */
export function unwrapMqttData(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  const nested = asRecord(root.data);
  if (nested && (Array.isArray(nested.results) || nested.event != null || nested.read != null || nested.unread != null)) {
    return nested;
  }
  return root;
}

function normalizeCallStatus(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const status = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!status || status === "null" || status === "undefined") return null;
  if (status === "cancel") return "cancelled";
  return status;
}

const QUEUE_STATUSES = new Set(["queued", "paused", "scheduled"]);
// On the line: dialing, with the AI, waiting for an agent, or with an agent.
const LIVE_STATUSES = new Set(["in_progress", "ongoing", "waiting", "connect_live_agent"]);

function tagsForCallStatus(status: string | null): Array<{ type: "Call"; id: string }> {
  if (!status) return [];
  if (LIVE_STATUSES.has(status)) {
    return [
      { type: "Call", id: "QUEUE" },
      { type: "Call", id: "STATUS_in_progress" },
    ];
  }
  if (QUEUE_STATUSES.has(status)) {
    return [
      { type: "Call", id: "QUEUE_WAITING" },
      { type: "Call", id: `STATUS_${status}` },
    ];
  }
  // completed | not_attended | voicemail_reached | callback | cancelled | …
  return [{ type: "Call", id: "LIST" }];
}

let callRefetchTimer: ReturnType<typeof setTimeout> | null = null;
const pendingCallStatuses = new Set<string>();

function scheduleCallRefetch(dispatch: Dispatch, statuses: Array<string | null>) {
  for (const status of statuses) {
    if (status) pendingCallStatuses.add(status);
  }
  if (callRefetchTimer) clearTimeout(callRefetchTimer);
  // Debounce: upload can publish one call message per row; refetch once.
  callRefetchTimer = setTimeout(() => {
    const tags: Array<{ type: "Call"; id: string }> = [
      { type: "Call", id: "LIST" },
      { type: "Call", id: "SUMMARY" },
    ];
    for (const status of pendingCallStatuses) {
      tags.push(...tagsForCallStatus(status));
    }
    pendingCallStatuses.clear();
    callRefetchTimer = null;
    const unique = Array.from(new Map(tags.map((tag) => [tag.id, tag])).values());
    dispatch(callsApi.util.invalidateTags(unique));
    dispatch(patientsApi.util.invalidateTags([{ type: "Patient", id: "LIST" }]));
  }, 250);
}

function applyNotificationPayload(dispatch: Dispatch, getState: () => RootState, data: Record<string, unknown>) {
  const read = asCount(data.read);
  const unread = asCount(data.unread);
  if (read != null && unread != null) {
    dispatch(
      notificationsApi.util.updateQueryData("getNotificationSummary", undefined, (draft) => {
        draft.read = read;
        draft.unread = unread;
      }),
    );
  }

  const rows = Array.isArray(data.results) ? data.results : null;
  if (rows === null) return;

  const mapped = rows.map(mapNotification).filter((item): item is NotificationItem => item !== null);

  // mark-all-read: empty results — mark every cached row read.
  if (mapped.length === 0) {
    const args = notificationsApi.util.selectCachedArgsForQuery(getState(), "getNotifications");
    args.forEach((queryArgs) => {
      dispatch(
        notificationsApi.util.updateQueryData("getNotifications", queryArgs, (draft) => {
          draft.results.forEach((row) => {
            row.is_read = true;
          });
          if (asCount(data.count) != null) draft.count = asCount(data.count)!;
        }),
      );
    });
    return;
  }

  const args = notificationsApi.util.selectCachedArgsForQuery(getState(), "getNotifications");
  args.forEach((queryArgs) => {
    dispatch(
      notificationsApi.util.updateQueryData("getNotifications", queryArgs, (draft) => {
        if (asCount(data.count) != null) draft.count = asCount(data.count)!;
        if (asCount(data.total_pages) != null) draft.totalPages = asCount(data.total_pages)!;

        for (const item of mapped) {
          const matchesFilter =
            queryArgs.isRead === undefined || queryArgs.isRead === item.is_read;
          const index = draft.results.findIndex((row) => row.id === item.id);

          if (index >= 0) {
            if (!matchesFilter) {
              draft.results.splice(index, 1);
            } else {
              draft.results[index] = item;
            }
            continue;
          }

          // New/updated row: prepend on page 1 when it matches the active filter.
          if (queryArgs.page === 1 && matchesFilter) {
            draft.results.unshift(item);
            if (draft.results.length > draft.pageSize) {
              draft.results.length = draft.pageSize;
            }
          }
        }
      }),
    );
  });

  // Patient add/update/block/upload should refresh the patients table.
  const touchesPatients = mapped.some((item) =>
    /patient_(created|updated|blocked|unblocked|upload)/i.test(item.event_type),
  );
  if (touchesPatients) {
    dispatch(patientsApi.util.invalidateTags([{ type: "Patient", id: "LIST" }]));
  }
}

function applyCallQueueChanged(dispatch: Dispatch, data: Record<string, unknown>) {
  const status = normalizeCallStatus(data.status);
  const previous = normalizeCallStatus(data.previous_status);
  scheduleCallRefetch(dispatch, [status, previous]);
}

/**
 * Apply one MQTT broker message per the frontend contract.
 * Classification is by payload shape, not topic name.
 */
export function handleMqttMessage(
  dispatch: Dispatch,
  getState: () => RootState,
  raw: string,
): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn("[mqtt] non-JSON message ignored");
    return;
  }

  const data = unwrapMqttData(parsed);
  if (!data) return;

  if (data.event === "call_queue_changed") {
    applyCallQueueChanged(dispatch, data);
    return;
  }

  // Notification live payload: has `results` (may be empty for mark-all-read).
  if (Array.isArray(data.results) || (data.read != null && data.unread != null && "results" in data)) {
    applyNotificationPayload(dispatch, getState, data);
  }
}
