export type Role = "PLAYER" | "GM" | "ADMIN";
export type AccountStatus = "PENDING_APPROVAL" | "ACTIVE" | "BLOCKED";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: Role;
  status: AccountStatus;
  emailVerified: boolean;
  lastSeenAt: string | null;
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

export interface RegisterResponse {
  message: string;
  user: User;
  developmentVerificationToken?: string;
}

export interface CurrentUserResponse {
  user: User;
}

export interface VerificationResponse {
  message: string;
  developmentVerificationToken?: string;
}

export interface UserProfileResponse {
  user: User;
}

export interface Character {
  id: string;
  name: string;
  title: string | null;
  summary: string | null;
  biography: string | null;
  appearance: string | null;
  avatarUrl: string | null;
  statsJson: Record<string, string | number> | null;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterResponse {
  character: Character;
}

export interface CharactersResponse {
  characters: Character[];
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

export interface VerifyEmailPayload {
  token: string;
}

export interface RequestEmailVerificationPayload {
  email: string;
}

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface CharacterPayload {
  name: string;
  title?: string;
  summary?: string;
  biography?: string;
  appearance?: string;
  avatarUrl?: string;
  statsJson?: Record<string, string | number>;
  isPublic?: boolean;
}
