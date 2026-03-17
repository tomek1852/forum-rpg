export type Role = "PLAYER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenTtl: string;
    refreshTokenTtl: string;
  };
}

export interface CurrentUserResponse {
  user: User;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface RequestPasswordResetPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}
