import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQuery";
import { getBaseUrl } from "@/lib/api/baseUrl";
import { patientsApi } from "@/lib/api/patientsApi";
import { callsApi } from "@/lib/api/callsApi";

function smsUrl(path: string): string {
  return `${getBaseUrl()}${path}`;
}

export const smsApi = createApi({
  reducerPath: "smsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Sms"],
  endpoints: (builder) => ({
    startOutboundSms: builder.mutation<unknown, { id: number | string }>({
      query: ({ id }) => {
        const numericId = Number(id);
        return {
          url: smsUrl("/api/ai-sms/outbound/"),
          method: "POST",
          body: { id: Number.isFinite(numericId) ? numericId : id },
        };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(patientsApi.util.invalidateTags([{ type: "Patient", id: "LIST" }]));
          dispatch(callsApi.util.invalidateTags([{ type: "Call", id: "LIST" }]));
        } catch {
          // Keep current cache when the SMS request fails.
        }
      },
    }),
  }),
});

export const { useStartOutboundSmsMutation } = smsApi;
