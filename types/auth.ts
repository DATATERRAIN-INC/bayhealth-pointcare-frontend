export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export interface VerifyResetCodeRequest {
  email: string;
  reset_code: string;
}

/** POST /api/users/verify-reset-code/ → { email, token } */
export interface VerifyResetCodeResponse {
  email?: string;
  token?: string;
  PASSWORD_RESET_URL?: string;
  password_reset_url?: string;
  detail?: string;
  message?: string;
  data?: {
    email?: string;
    token?: string;
    PASSWORD_RESET_URL?: string;
    password_reset_url?: string;
  };
  [key: string]: unknown;
}

/** GET /api/users/validate-password-token/?token=... → { valid: true } */
export interface ValidatePasswordTokenResponse {
  valid?: boolean;
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export interface LoginApiUser {
  id?: number | string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  role?: string;
  [key: string]: unknown;
}

export interface LoginApiResponse {
  access_token: string;
  refresh_token: string;
  token?: string;
  access?: string;
  key?: string;
  refresh?: string;
  user?: LoginApiUser;
  data?: {
    access_token?: string;
    refresh_token?: string;
    token?: string;
    access?: string;
    user?: LoginApiUser;
  };
  [key: string]: unknown;
}
