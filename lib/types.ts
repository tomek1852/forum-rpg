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

export interface ForumAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: Role;
}

export interface ForumCategory {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  position: number;
  threadCount: number;
  latestThread: {
    id: string;
    categoryId: string;
    title: string;
    lastPostAt: string;
    postCount: number;
    author: ForumAuthor;
  } | null;
}

export interface ForumThreadSummary {
  id: string;
  categoryId: string;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  lastPostAt: string;
  postCount: number;
  excerpt: string | null;
  author: ForumAuthor;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  lastPostAt: string;
  postCount: number;
  author: ForumAuthor;
}

export interface ForumPost {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: ForumAuthor;
  quotePost: {
    id: string;
    content: string;
    createdAt: string;
    author: ForumAuthor;
  } | null;
}

export interface ForumCategoriesResponse {
  categories: ForumCategory[];
}

export interface ForumCategoryResponse {
  category: Omit<ForumCategory, "latestThread">;
  threads: ForumThreadSummary[];
}

export interface ForumThreadResponse {
  category: Pick<ForumCategory, "id" | "title" | "description" | "color">;
  thread: ForumThread;
  posts: ForumPost[];
}

export interface ForumPostResponse {
  post: ForumPost;
}

export type NotificationType =
  | "FORUM_NEW_THREAD"
  | "FORUM_THREAD_REPLY"
  | "FORUM_POST_QUOTE";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  userId: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface ModerationAccountsResponse {
  users: User[];
}

export interface ModerationAccountMutationResponse {
  message: string;
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

export interface ForumThreadPayload {
  categoryId: string;
  title: string;
  content: string;
}

export interface ForumReplyPayload {
  content: string;
  quotePostId?: string;
}

export interface UpdateAccountStatusPayload {
  status: AccountStatus;
}

export interface UpdateUserRolePayload {
  role: Role;
}
