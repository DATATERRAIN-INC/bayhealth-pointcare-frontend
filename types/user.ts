export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
