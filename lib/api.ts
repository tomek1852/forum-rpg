"use client";

import axios from "axios";
import { useAuthStore } from "./auth-store";
import type {
  AuthResponse,
  CharacterPayload,
  CharacterResponse,
  CharactersResponse,
  CurrentUserResponse,
  ForumCategoriesResponse,
  ForumCategoryResponse,
  ForumPostResponse,
  ForumReplyPayload,
  ForumThreadPayload,
  ForumThreadResponse,
  NotificationsResponse,
  LoginPayload,
  ModerationAccountsResponse,
  ModerationAccountMutationResponse,
  RegisterResponse,
  RegisterPayload,
  RequestEmailVerificationPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
  Role,
  UpdateProfilePayload,
  UpdateAccountStatusPayload,
  UpdateUserRolePayload,
  UserProfileResponse,
  VerificationResponse,
  VerifyEmailPayload,
  AccountStatus,
} from "./types";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

const publicClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      if (originalRequest?.url?.includes("/auth/refresh")) {
        useAuthStore.getState().clearSession();
      }

      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      useAuthStore.getState().clearSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshPromise ??= refreshAccessToken(refreshToken).finally(() => {
      refreshPromise = null;
    });

    const nextAccessToken = await refreshPromise;

    if (!nextAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

    return api(originalRequest);
  },
);

async function refreshAccessToken(refreshToken: string) {
  try {
    const { data } = await publicClient.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });

    useAuthStore.getState().setSession(data);

    return data.tokens.accessToken;
  } catch {
    useAuthStore.getState().clearSession();
    return null;
  }
}

export async function loginUser(payload: LoginPayload) {
  const { data } = await publicClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerUser(payload: RegisterPayload) {
  const { data } = await publicClient.post<RegisterResponse>(
    "/auth/register",
    payload,
  );
  return data;
}

export async function requestEmailVerification(
  payload: RequestEmailVerificationPayload,
) {
  const { data } = await publicClient.post<VerificationResponse>(
    "/auth/request-email-verification",
    payload,
  );
  return data;
}

export async function verifyEmail(payload: VerifyEmailPayload) {
  const { data } = await publicClient.post<VerificationResponse>(
    "/auth/verify-email",
    payload,
  );
  return data;
}

export async function requestPasswordReset(payload: RequestPasswordResetPayload) {
  const { data } = await publicClient.post<{
    message: string;
    developmentResetToken?: string;
  }>("/auth/request-password-reset", payload);
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const { data } = await publicClient.post<{ message: string }>(
    "/auth/reset-password",
    payload,
  );
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get<CurrentUserResponse>("/auth/me");
  return data;
}

export async function logoutUser(refreshToken: string) {
  const { data } = await publicClient.post<{ message: string }>("/auth/logout", {
    refreshToken,
  });
  return data;
}

export async function getUserProfile(userId: string) {
  const { data } = await api.get<UserProfileResponse>(`/users/${userId}`);
  return data;
}

export async function updateMyProfile(payload: UpdateProfilePayload) {
  const { data } = await api.patch<UserProfileResponse>("/users/me", payload);
  return data;
}

export async function getMyCharacters() {
  const { data } = await api.get<CharactersResponse>("/characters/my");
  return data;
}

export async function getCharactersByUser(userId: string) {
  const { data } = await api.get<CharactersResponse>(`/characters/user/${userId}`);
  return data;
}

export async function getCharacter(characterId: string) {
  const { data } = await api.get<CharacterResponse>(`/characters/${characterId}`);
  return data;
}

export async function createCharacter(payload: CharacterPayload) {
  const { data } = await api.post<CharacterResponse>("/characters", payload);
  return data;
}

export async function updateCharacter(
  characterId: string,
  payload: CharacterPayload,
) {
  const { data } = await api.patch<CharacterResponse>(
    `/characters/${characterId}`,
    payload,
  );
  return data;
}

export async function getForumCategories() {
  const { data } = await api.get<ForumCategoriesResponse>("/forum/categories");
  return data;
}

export async function getForumCategory(categoryId: string) {
  const { data } = await api.get<ForumCategoryResponse>(
    `/forum/categories/${categoryId}`,
  );
  return data;
}

export async function getForumThread(threadId: string) {
  const { data } = await api.get<ForumThreadResponse>(`/forum/threads/${threadId}`);
  return data;
}

export async function createForumThread(payload: ForumThreadPayload) {
  const { data } = await api.post<{ thread: ForumThreadResponse["thread"] }>(
    "/forum/threads",
    payload,
  );
  return data;
}

export async function createForumPost(
  threadId: string,
  payload: ForumReplyPayload,
) {
  const { data } = await api.post<ForumPostResponse>(
    `/forum/threads/${threadId}/posts`,
    payload,
  );
  return data;
}

export async function getNotifications() {
  const { data } = await api.get<NotificationsResponse>("/notifications");
  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  const { data } = await api.patch<{
    message: string;
    unreadCount: number;
  }>(`/notifications/${notificationId}/read`);
  return data;
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.patch<{
    message: string;
    unreadCount: number;
  }>("/notifications/read-all");
  return data;
}

export async function getModerationAccounts() {
  const { data } = await api.get<ModerationAccountsResponse>(
    "/users/moderation/accounts",
  );
  return data;
}

export async function updateModerationAccountStatus(
  userId: string,
  status: AccountStatus,
) {
  const payload: UpdateAccountStatusPayload = { status };
  const { data } = await api.patch<ModerationAccountMutationResponse>(
    `/users/moderation/accounts/${userId}/status`,
    payload,
  );
  return data;
}

export async function updateModerationUserRole(userId: string, role: Role) {
  const payload: UpdateUserRolePayload = { role };
  const { data } = await api.patch<ModerationAccountMutationResponse>(
    `/users/moderation/accounts/${userId}/role`,
    payload,
  );
  return data;
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "Wystapil nieoczekiwany blad.";
}
