export interface LoginRequest {
  email: string;
  password: string;
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
