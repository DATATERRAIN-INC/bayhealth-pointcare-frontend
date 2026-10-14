import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQuery";
import { getBaseUrl } from "@/lib/api/baseUrl";

export type PointCareCallPayload = {
  phone_number: string;
  name: string;
  agent_number: string;
  address: string;
};

function pointCareUrl(path: string): string {
  return `${getBaseUrl()}${path}`;
}

export const formFillerApi = createApi({
  reducerPath: "formFillerApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    triggerPointCareCall: builder.mutation<unknown, PointCareCallPayload>({
      query: (body) => ({
        url: pointCareUrl("/api/ai-pointcare/call/"),
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useTriggerPointCareCallMutation } = formFillerApi;
