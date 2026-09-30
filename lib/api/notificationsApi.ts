import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQuery";
import { getBaseUrl } from "@/lib/api/baseUrl";
import type {
  NotificationItem,
  NotificationList,
  NotificationQuery,
  NotificationSummary,
} from "@/types/notification";

function notificationsUrl(path: string): string {
  return `${getBaseUrl()}${path}`;
}

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

function mapList(response: unknown): NotificationList {
  if (Array.isArray(response)) {
    const results = response.map(mapNotification).filter((item): item is NotificationItem => item !== null);
    return { count: results.length, totalPages: 1, page: 1, pageSize: results.length, results };
  }
  const record = asRecord(response);
  const rows = Array.isArray(record?.results) ? record.results : [];
  const results = rows.map(mapNotification).filter((item): item is NotificationItem => item !== null);
  return {
    count: asCount(record?.count) ?? results.length,
    totalPages: asCount(record?.total_pages) ?? 1,
    page: asCount(record?.page) ?? 1,
    pageSize: asCount(record?.page_size) ?? results.length,
    results,
  };
}

function mapSummary(response: unknown): NotificationSummary {
  const record = asRecord(response) ?? {};
  const nested = asRecord(record.data) ?? asRecord(record.summary) ?? record;
  const unread =
    asCount(nested.unread) ??
    asCount(nested.unread_count) ??
    asCount(nested.not_read) ??
    asCount(asRecord(nested.is_read)?.false) ??
    0;
  const read =
    asCount(nested.read) ??
    asCount(nested.read_count) ??
    asCount(asRecord(nested.is_read)?.true) ??
    0;
  return { unread, read };
}

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Notification"],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationList, NotificationQuery>({
      query: ({ page, pageSize, eventType, isRead }) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
        });
        if (eventType) params.set("event_type", eventType);
        if (typeof isRead === "boolean") params.set("is_read", String(isRead));
        return notificationsUrl(`/api/notifications/?${params.toString()}`);
      },
      transformResponse: mapList,
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: "Notification" as const, id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),
    getNotificationSummary: builder.query<NotificationSummary, void>({
      query: () => notificationsUrl("/api/notifications/summary/"),
      transformResponse: mapSummary,
      providesTags: [{ type: "Notification", id: "SUMMARY" }],
    }),
    markNotificationRead: builder.mutation<unknown, number>({
      query: (id) => ({
        url: notificationsUrl(`/api/notifications/${id}/mark-read/`),
        method: "POST",
      }),
      invalidatesTags: [{ type: "Notification", id: "SUMMARY" }, { type: "Notification", id: "LIST" }],
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        let wasUnread = false;
        const patches = notificationsApi.util.selectCachedArgsForQuery(getState(), "getNotifications").map((args) =>
          dispatch(
            notificationsApi.util.updateQueryData("getNotifications", args, (draft) => {
              const item = draft.results.find((row) => row.id === id);
              if (item && !item.is_read) {
                wasUnread = true;
                item.is_read = true;
              }
            }),
          ),
        );
        const summaryPatch = wasUnread
          ? dispatch(
              notificationsApi.util.updateQueryData("getNotificationSummary", undefined, (draft) => {
                if (draft.unread > 0) {
                  draft.unread -= 1;
                  draft.read += 1;
                }
              }),
            )
          : null;
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
          summaryPatch?.undo();
        }
      },
    }),
    markAllNotificationsRead: builder.mutation<unknown, void>({
      query: () => ({
        url: notificationsUrl("/api/notifications/mark-all-read/"),
        method: "POST",
      }),
      invalidatesTags: [{ type: "Notification", id: "SUMMARY" }, { type: "Notification", id: "LIST" }],
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        const patches = notificationsApi.util.selectCachedArgsForQuery(getState(), "getNotifications").map((args) =>
          dispatch(
            notificationsApi.util.updateQueryData("getNotifications", args, (draft) => {
              draft.results.forEach((row) => {
                row.is_read = true;
              });
            }),
          ),
        );
        const summaryPatch = dispatch(
          notificationsApi.util.updateQueryData("getNotificationSummary", undefined, (draft) => {
            draft.read += draft.unread;
            draft.unread = 0;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
          summaryPatch.undo();
        }
      },
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationSummaryQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
