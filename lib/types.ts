export type Role = "PLAYER" | "GM" | "ADMIN";
export type AccountStatus = "PENDING_APPROVAL" | "ACTIVE" | "BLOCKED";
export type StatValueType = "NUMBER" | "TEXT";
export type SkillProposalStatus = "PENDING" | "APPROVED" | "REJECTED";

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

export interface StatDefinition {
  id: string;
  key: string;
  label: string;
  description: string | null;
  valueType: StatValueType;
  minValue: number | null;
  maxValue: number | null;
  defaultNumericValue: number | null;
  defaultTextValue: string | null;
  isRequired: boolean;
  isActive: boolean;
  position: number;
  worldId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterStatValue {
  id: string;
  numericValue: number | null;
  textValue: string | null;
  createdAt: string;
  updatedAt: string;
  statDefinition: StatDefinition;
}

export interface CharacterSkill {
  id: string;
  name: string;
  description: string;
  mechanics: string | null;
  costs: string | null;
  limitations: string | null;
  grantedAt: string;
  updatedAt: string;
  characterId: string;
  approvedById: string | null;
  sourceProposalId: string | null;
}

export interface ProgressRule {
  id: string;
  code: string;
  label: string;
  description: string | null;
  expValue: number;
  phValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressEntry {
  id: string;
  expDelta: number;
  phDelta: number;
  reason: string;
  note: string | null;
  createdAt: string;
  characterId: string;
  grantedById: string | null;
  ruleId: string | null;
  grantedBy: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
  rule: ProgressRule | null;
}

export interface SkillProposal {
  id: string;
  name: string;
  description: string;
  mechanics: string | null;
  costs: string | null;
  limitations: string | null;
  status: SkillProposalStatus;
  reviewerComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  characterId: string;
  proposerId: string;
  reviewerId: string | null;
  character: {
    id: string;
    name: string;
    ownerId: string;
  };
  proposer: {
    id: string;
    username: string;
    displayName: string | null;
  };
  reviewer: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
  createdSkill: CharacterSkill | null;
}

export interface World {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  statDefinitions: StatDefinition[];
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
  experiencePoints: number;
  heroPoints: number;
  world: Pick<World, "id" | "name" | "slug"> | null;
  statValues: CharacterStatValue[];
  skills: CharacterSkill[];
  skillProposals: SkillProposal[];
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterResponse {
  character: Character;
}

export interface CharacterRankingEntry {
  position: number;
  characterId: string;
  name: string;
  world: Pick<World, "id" | "name" | "slug"> | null;
  experiencePoints: number;
  heroPoints: number;
}

export interface CharacterRankingsResponse {
  rankings: CharacterRankingEntry[];
}

export interface ProgressMutationResponse {
  message: string;
  entry: ProgressEntry;
  character: Character;
}

export interface ProgressHistoryResponse {
  entries: ProgressEntry[];
}

export interface CharactersResponse {
  characters: Character[];
}

export interface WorldsResponse {
  worlds: World[];
}

export interface WorldResponse {
  world: World;
}

export interface WorldMutationResponse {
  message: string;
  world: World;
}

export interface StatDefinitionMutationResponse {
  message: string;
  statDefinition: StatDefinition;
}

export interface SkillProposalResponse {
  message: string;
  proposal: SkillProposal;
}

export interface SkillProposalsResponse {
  proposals: SkillProposal[];
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
  | "FORUM_POST_QUOTE"
  | "SKILL_PROPOSAL_CREATED"
  | "SKILL_PROPOSAL_APPROVED"
  | "SKILL_PROPOSAL_REJECTED";

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
  worldId: string;
  title?: string;
  summary?: string;
  biography?: string;
  appearance?: string;
  avatarUrl?: string;
  statValues?: Array<{
    statDefinitionId: string;
    numericValue?: number;
    textValue?: string;
  }>;
  isPublic?: boolean;
}

export interface CreateWorldPayload {
  name: string;
  slug?: string;
  summary?: string;
  description?: string;
}

export interface CreateStatDefinitionPayload {
  worldId: string;
  key: string;
  label: string;
  description?: string;
  valueType?: StatValueType;
  minValue?: number;
  maxValue?: number;
  defaultNumericValue?: number;
  defaultTextValue?: string;
  isRequired?: boolean;
  position?: number;
}

export interface CreateSkillProposalPayload {
  characterId: string;
  name: string;
  description: string;
  mechanics?: string;
  costs?: string;
  limitations?: string;
}

export interface ReviewSkillProposalPayload {
  status: SkillProposalStatus;
  reviewerComment?: string;
}

export interface AddProgressPayload {
  expDelta?: number;
  phDelta?: number;
  reason: string;
  note?: string;
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
