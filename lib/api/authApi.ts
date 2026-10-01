import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getBaseUrl } from "@/lib/api/baseUrl";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginApiResponse,
  LoginRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ValidatePasswordTokenResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
} from "@/types/auth";

export {
  consumeAuthStatusMessage,
  extractAuthMessage,
  extractResetToken,
  isPasswordTokenValid,
  isValidEmail,
  safeStatusMessage,
  stashAuthStatusMessage,
} from "@/lib/api/passwordReset";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    timeout: 20000,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginApiResponse, LoginRequest>({
      query: ({ email, password }) => ({
        url: "/api/users/login/",
        method: "POST",
        body: { email, password },
      }),
    }),
    forgotPassword: builder.mutation<ForgotPasswordResponse, ForgotPasswordRequest>({
      query: ({ email }) => ({
        url: "/api/users/forgot-password/",
        method: "POST",
        body: { email },
      }),
    }),
    verifyResetCode: builder.mutation<VerifyResetCodeResponse, VerifyResetCodeRequest>({
      query: ({ email, reset_code }) => ({
        url: "/api/users/verify-reset-code/",
        method: "POST",
        body: { email, reset_code },
      }),
    }),
    validatePasswordToken: builder.query<ValidatePasswordTokenResponse, string>({
      query: (token) => ({
        url: "/api/users/validate-password-token/",
        params: { token },
      }),
    }),
    resetPassword: builder.mutation<ResetPasswordResponse, ResetPasswordRequest>({
      query: ({ token, new_password, confirm_password }) => ({
        url: "/api/users/reset-password/",
        method: "POST",
        body: { token, new_password, confirm_password },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useVerifyResetCodeMutation,
  useLazyValidatePasswordTokenQuery,
  useResetPasswordMutation,
} = authApi;
