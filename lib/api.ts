"use client";

import axios from "axios";
import { useAuthStore } from "./auth-store";
import type {
  AccountStatus,
  ActivityLogQueryParams,
  ActivityLogResponse,
  AdminStatsResponse,
  AdminUserActivityResponse,
  AdminUsersParams,
  AdminUsersResponse,
  AddProgressPayload,
  CreateModerationReportPayload,
  ModerationReportMutationResponse,
  ModerationReportResponse,
  ModerationReportsResponse,
  ModerationReportStatus,
  ModerationReportTargetType,
  UpdateModerationReportPayload,
  AuthResponse,
  CharacterPayload,
  CharacterRankingsResponse,
  CharacterResponse,
  CharactersResponse,
  CreateConversationPayload,
  CreateSkillProposalPayload,
  CreateStatDefinitionPayload,
  CreateEventPayload,
  CreateEventParticipationPayload,
  CreateWorldLogPayload,
  CreateWorldPayload,
  CurrentUserResponse,
  EventMutationResponse,
  EventParticipationResponse,
  EventResponse,
  EventsResponse,
  ForumCategoriesResponse,
  ForumCategoryMutationResponse,
  ForumCategoryPayload,
  ForumCategoryResponse,
  ForumPostResponse,
  ForumReplyPayload,
  ForumThreadPayload,
  ForumThreadResponse,
  UpdateForumCategoryPayload,
  LoginPayload,
  ModerationAccountMutationResponse,
  ModerationAccountsResponse,
  MessageRecipientSearchResponse,
  NotificationsResponse,
  PrivateConversationMessagesResponse,
  PrivateConversationsResponse,
  PrivateMessagePayload,
  PrivateMessageResponse,
  ProgressHistoryResponse,
  ProgressMutationResponse,
  RegisterPayload,
  RegisterResponse,
  RequestEmailVerificationPayload,
  RequestPasswordResetPayload,
  ReviewEventParticipationPayload,
  ReviewSkillProposalPayload,
  ResetPasswordPayload,
  Role,
  SkillProposalResponse,
  SkillProposalsResponse,
  StatDefinitionMutationResponse,
  UpdateAccountStatusPayload,
  UpdateEventPayload,
  UpdateProfilePayload,
  UpdateUserRolePayload,
  UserProfileResponse,
  VerificationResponse,
  VerifyEmailPayload,
  WorldLogResponse,
  WorldLogsResponse,
  WorldMutationResponse,
  WorldsResponse,
  WorldRankingsResponse,
  CharacterRankResponse,
  AwardBadgePayload,
  BadgeMutationResponse,
  BadgesResponse,
  CharacterBadgesResponse,
  CreateBadgePayload,
  CreateDocCategoryPayload,
  CreateDocPagePayload,
  CreateIdeaPayload,
  CreateMediaAssetPayload,
  DocCategoriesResponse,
  DocCategoryPagesResponse,
  DocPageResponse,
  IdeaResponse,
  IdeasResponse,
  IdeaStatus,
  MediaAssetsResponse,
  MediaAssetResponse,
  UpdateDocCategoryPayload,
  UpdateDocPagePayload,
  UpdateIdeaStatusPayload,
  CombatEncountersResponse,
  CombatEncounterResponse,
  CombatStatus,
  CreateCombatPayload,
  SetInitiativePayload,
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
  const { data } = await publicClient.post<RegisterResponse>("/auth/register", payload);
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

export async function searchUsersForMessages(query: string) {
  const { data } = await api.get<MessageRecipientSearchResponse>("/users/search", {
    params: {
      query,
    },
  });
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

export async function getCharacterRankings(params?: {
  worldId?: string;
  sortBy?: "exp" | "heroPoints" | "skillsCount" | "createdAt";
  limit?: number;
  cursor?: string;
}) {
  const search = new URLSearchParams();
  if (params?.worldId) search.set("worldId", params.worldId);
  if (params?.sortBy) search.set("sortBy", params.sortBy);
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.cursor) search.set("cursor", params.cursor);
  const query = search.toString() ? `?${search.toString()}` : "";
  const { data } = await api.get<CharacterRankingsResponse>(`/characters/rankings${query}`);
  return data;
}

export async function getWorldRankings() {
  const { data } = await api.get<WorldRankingsResponse>("/rankings/worlds");
  return data;
}

export async function getCharacterRank(characterId: string) {
  const { data } = await api.get<CharacterRankResponse>(`/characters/${characterId}/rank`);
  return data;
}

export async function getWorlds() {
  const { data } = await api.get<WorldsResponse>("/worlds");
  return data;
}

export async function getWorldLogs(worldId: string) {
  const { data } = await api.get<WorldLogsResponse>(`/worlds/${worldId}/world-log`);
  return data;
}

export async function getEvents() {
  const { data } = await api.get<EventsResponse>("/events");
  return data;
}

export async function getEvent(eventId: string) {
  const { data } = await api.get<EventResponse>(`/events/${eventId}`);
  return data;
}

export async function createCharacter(payload: CharacterPayload) {
  const { data } = await api.post<CharacterResponse>("/characters", payload);
  return data;
}

export async function createEvent(payload: CreateEventPayload) {
  const { data } = await api.post<EventMutationResponse>("/events", payload);
  return data;
}

export async function updateEvent(eventId: string, payload: UpdateEventPayload) {
  const { data } = await api.patch<EventMutationResponse>(`/events/${eventId}`, payload);
  return data;
}

export async function createEventParticipation(
  eventId: string,
  payload: CreateEventParticipationPayload,
) {
  const { data } = await api.post<EventParticipationResponse>(
    `/events/${eventId}/participations`,
    payload,
  );
  return data;
}

export async function reviewEventParticipation(
  participationId: string,
  payload: ReviewEventParticipationPayload,
) {
  const { data } = await api.patch<EventParticipationResponse>(
    `/events/participations/${participationId}/review`,
    payload,
  );
  return data;
}

export async function updateCharacter(characterId: string, payload: CharacterPayload) {
  const { data } = await api.patch<CharacterResponse>(
    `/characters/${characterId}`,
    payload,
  );
  return data;
}

export async function getCharacterProgress(characterId: string) {
  const { data } = await api.get<ProgressHistoryResponse>(
    `/characters/${characterId}/progress`,
  );
  return data;
}

export async function addCharacterProgress(
  characterId: string,
  payload: AddProgressPayload,
) {
  const { data } = await api.post<ProgressMutationResponse>(
    `/characters/${characterId}/progress`,
    payload,
  );
  return data;
}

export async function createWorld(payload: CreateWorldPayload) {
  const { data } = await api.post<WorldMutationResponse>("/worlds", payload);
  return data;
}

export async function createWorldLog(worldId: string, payload: CreateWorldLogPayload) {
  const { data } = await api.post<WorldLogResponse>(
    `/worlds/${worldId}/world-log`,
    payload,
  );
  return data;
}

export async function createWorldStatDefinition(payload: CreateStatDefinitionPayload) {
  const { worldId, ...body } = payload;
  const { data } = await api.post<StatDefinitionMutationResponse>(
    `/worlds/${worldId}/stats`,
    body,
  );
  return data;
}

export async function createSkillProposal(payload: CreateSkillProposalPayload) {
  const { data } = await api.post<SkillProposalResponse>("/skills/proposals", payload);
  return data;
}

export async function getSkillProposalsReviewQueue() {
  const { data } = await api.get<SkillProposalsResponse>("/skills/proposals/review");
  return data;
}

export async function reviewSkillProposal(
  proposalId: string,
  payload: ReviewSkillProposalPayload,
) {
  const { data } = await api.patch<SkillProposalResponse>(
    `/skills/proposals/${proposalId}/review`,
    payload,
  );
  return data;
}

export async function getForumCategories() {
  const { data } = await api.get<ForumCategoriesResponse>("/forum/categories");
  return data;
}

export async function createForumCategory(payload: ForumCategoryPayload) {
  const { data } = await api.post<ForumCategoryMutationResponse>("/forum/categories", payload);
  return data;
}

export async function updateForumCategory(categoryId: string, payload: UpdateForumCategoryPayload) {
  const { data } = await api.patch<ForumCategoryMutationResponse>(
    `/forum/categories/${categoryId}`,
    payload,
  );
  return data;
}

export async function deleteForumCategory(categoryId: string) {
  const { data } = await api.delete<ForumCategoryMutationResponse>(
    `/forum/categories/${categoryId}`,
  );
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

export async function createForumPost(threadId: string, payload: ForumReplyPayload) {
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

export async function createConversation(payload: CreateConversationPayload) {
  const { data } = await api.post<{
    conversation: PrivateConversationsResponse["conversations"][number];
  }>("/messages/conversations", payload);
  return data;
}

export async function getMyConversations() {
  const { data } = await api.get<PrivateConversationsResponse>("/messages/conversations");
  return data;
}

export async function getConversationMessages(conversationId: string) {
  const { data } = await api.get<PrivateConversationMessagesResponse>(
    `/messages/conversations/${conversationId}/messages`,
  );
  return data;
}

export async function sendPrivateMessage(
  conversationId: string,
  payload: PrivateMessagePayload,
) {
  const { data } = await api.post<PrivateMessageResponse>(
    `/messages/conversations/${conversationId}/messages`,
    payload,
  );
  return data;
}

export async function markConversationAsRead(conversationId: string) {
  const { data } = await api.patch<{
    message: string;
    updatedCount: number;
  }>(`/messages/conversations/${conversationId}/read`);
  return data;
}

export async function getModerationAccounts() {
  const { data } = await api.get<ModerationAccountsResponse>(
    "/users/moderation/accounts",
  );
  return data;
}

export async function updateModerationAccountStatus(userId: string, status: AccountStatus) {
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

export async function createModerationReport(payload: CreateModerationReportPayload) {
  const { data } = await api.post<ModerationReportMutationResponse>(
    "/moderation/reports",
    payload,
  );
  return data;
}

export async function getModerationReports(filters?: {
  status?: ModerationReportStatus;
  targetType?: ModerationReportTargetType;
}) {
  const { data } = await api.get<ModerationReportsResponse>("/moderation/reports", {
    params: filters,
  });
  return data;
}

export async function getModerationReport(id: string) {
  const { data } = await api.get<ModerationReportResponse>(`/moderation/reports/${id}`);
  return data;
}

export async function updateModerationReport(
  id: string,
  payload: UpdateModerationReportPayload,
) {
  const { data } = await api.patch<ModerationReportMutationResponse>(
    `/moderation/reports/${id}`,
    payload,
  );
  return data;
}

export async function getActivityLog(params?: ActivityLogQueryParams) {
  const { data } = await api.get<ActivityLogResponse>("/admin/activity-log", {
    params,
  });
  return data;
}

export async function getAdminUsers(params?: AdminUsersParams) {
  const { data } = await api.get<AdminUsersResponse>("/admin/users", { params });
  return data;
}

export async function getAdminUserActivity(userId: string) {
  const { data } = await api.get<AdminUserActivityResponse>(
    `/admin/users/${userId}/activity`,
  );
  return data;
}

export async function updateAdminUserStatus(userId: string, status: AccountStatus) {
  const { data } = await api.patch<ModerationAccountMutationResponse>(
    `/admin/users/${userId}/status`,
    { status },
  );
  return data;
}

export async function updateAdminUserRole(userId: string, role: Role) {
  const { data } = await api.patch<ModerationAccountMutationResponse>(
    `/admin/users/${userId}/role`,
    { role },
  );
  return data;
}

export async function getAdminStats() {
  const { data } = await api.get<AdminStatsResponse>("/admin/stats");
  return data;
}

export async function getBadges(): Promise<BadgesResponse> {
  const { data } = await api.get<BadgesResponse>("/badges");
  return data;
}

export async function getCharacterBadges(characterId: string): Promise<CharacterBadgesResponse> {
  const { data } = await api.get<CharacterBadgesResponse>(`/characters/${characterId}/badges`);
  return data;
}

export async function createBadge(payload: CreateBadgePayload): Promise<BadgeMutationResponse> {
  const { data } = await api.post<BadgeMutationResponse>("/admin/badges", payload);
  return data;
}

export async function awardBadge(
  characterId: string,
  payload: AwardBadgePayload,
): Promise<BadgeMutationResponse> {
  const { data } = await api.post<BadgeMutationResponse>(`/characters/${characterId}/badges`, payload);
  return data;
}

export async function removeBadge(characterId: string, badgeId: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/characters/${characterId}/badges/${badgeId}`);
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

  if (error instanceof Error) {
    return error.message;
  }

  return "Wystąpił nieoczekiwany błąd.";
}

// Docs

export async function getDocCategories(worldId?: string): Promise<DocCategoriesResponse> {
  const { data } = await api.get<DocCategoriesResponse>("/docs/categories", {
    params: worldId ? { worldId } : {},
  });
  return data;
}

export async function getDocCategoryPages(categoryId: string): Promise<DocCategoryPagesResponse> {
  const { data } = await api.get<DocCategoryPagesResponse>(`/docs/categories/${categoryId}/pages`);
  return data;
}

export async function getDocPage(pageId: string): Promise<DocPageResponse> {
  const { data } = await api.get<DocPageResponse>(`/docs/pages/${pageId}`);
  return data;
}

export async function createDocCategory(
  payload: CreateDocCategoryPayload,
): Promise<{ category: import("./types").DocCategory }> {
  const { data } = await api.post("/docs/categories", payload);
  return data;
}

export async function updateDocCategory(
  id: string,
  payload: UpdateDocCategoryPayload,
): Promise<{ category: import("./types").DocCategory }> {
  const { data } = await api.patch(`/docs/categories/${id}`, payload);
  return data;
}

export async function createDocPage(
  payload: CreateDocPagePayload,
): Promise<{ page: import("./types").DocPage }> {
  const { data } = await api.post("/docs/pages", payload);
  return data;
}

export async function updateDocPage(
  id: string,
  payload: UpdateDocPagePayload,
): Promise<{ page: import("./types").DocPage }> {
  const { data } = await api.patch(`/docs/pages/${id}`, payload);
  return data;
}

export async function getMediaAssets(worldId?: string): Promise<MediaAssetsResponse> {
  const { data } = await api.get<MediaAssetsResponse>("/docs/media", {
    params: worldId ? { worldId } : {},
  });
  return data;
}

export async function createMediaAsset(
  payload: CreateMediaAssetPayload,
): Promise<MediaAssetResponse> {
  const { data } = await api.post<MediaAssetResponse>("/docs/media", payload);
  return data;
}

// Ideas

export async function getIdeas(status?: IdeaStatus): Promise<IdeasResponse> {
  const { data } = await api.get<IdeasResponse>("/ideas", {
    params: status ? { status } : {},
  });
  return data;
}

export async function createIdea(payload: CreateIdeaPayload): Promise<IdeaResponse> {
  const { data } = await api.post<IdeaResponse>("/ideas", payload);
  return data;
}

export async function updateIdeaStatus(
  id: string,
  payload: UpdateIdeaStatusPayload,
): Promise<IdeaResponse> {
  const { data } = await api.patch<IdeaResponse>(`/ideas/${id}/status`, payload);
  return data;
}

// Combat

export async function getCombatEncounters(params?: {
  worldId?: string;
  status?: CombatStatus;
}): Promise<CombatEncountersResponse> {
  const { data } = await api.get<CombatEncountersResponse>("/combat", { params });
  return data;
}

export async function getCombatEncounter(id: string): Promise<CombatEncounterResponse> {
  const { data } = await api.get<CombatEncounterResponse>(`/combat/${id}`);
  return data;
}

export async function createCombatEncounter(
  payload: CreateCombatPayload,
): Promise<CombatEncounterResponse> {
  const { data } = await api.post<CombatEncounterResponse>("/combat", payload);
  return data;
}

export async function setCombatInitiative(
  id: string,
  payload: SetInitiativePayload,
): Promise<CombatEncounterResponse> {
  const { data } = await api.post<CombatEncounterResponse>(`/combat/${id}/initiative`, payload);
  return data;
}

export async function startCombatEncounter(id: string): Promise<CombatEncounterResponse> {
  const { data } = await api.post<CombatEncounterResponse>(`/combat/${id}/start`);
  return data;
}
