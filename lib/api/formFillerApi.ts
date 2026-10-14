import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type OutboundFormPayload = {
  phone_number: string;
  name: string;
};

function getFormFillerBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_FORM_FILLER_BASE_URL || "http://127.0.0.1:8001";
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "http://127.0.0.1:8001";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export const formFillerApi = createApi({
  reducerPath: "formFillerApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getFormFillerBaseUrl(),
    timeout: 20000,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    triggerOutbound: builder.mutation<unknown, OutboundFormPayload>({
      query: (body) => ({
        url: "/form-filler/outbound/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useTriggerOutboundMutation } = formFillerApi;
