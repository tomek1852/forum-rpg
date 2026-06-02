export type Role = "PLAYER" | "GM" | "ADMIN";
export type MediaType = "IMAGE" | "PDF" | "MAP";
export type IdeaStatus = "OPEN" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";
export type AccountStatus = "PENDING_APPROVAL" | "ACTIVE" | "BLOCKED";
export type PresenceStatus = "ONLINE" | "AWAY" | "OFFLINE";
export type StatValueType = "NUMBER" | "TEXT";
export type SkillProposalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type EventParticipationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type BadgeCondition =
  | "FIRST_POST"
  | "FIRST_CHARACTER"
  | "EXP_100"
  | "EXP_500"
  | "EXP_1000"
  | "SKILL_APPROVED"
  | "EVENT_PARTICIPANT"
  | "CUSTOM";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: BadgeCondition;
  threshold: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterBadge {
  id: string;
  awardedAt: string;
  note: string | null;
  characterId: string;
  badgeId: string;
  awardedById: string | null;
  badge: Badge;
  awardedBy: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
}

export interface BadgesResponse {
  badges: Badge[];
}

export interface CharacterBadgesResponse {
  badges: CharacterBadge[];
}

export interface BadgeMutationResponse {
  badge: Badge | CharacterBadge;
}

export interface CreateBadgePayload {
  name: string;
  description: string;
  icon: string;
  condition: BadgeCondition;
  threshold?: number;
}

export interface AwardBadgePayload {
  badgeId: string;
  note?: string;
}

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
  presenceStatus: PresenceStatus;
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

export interface WorldLogEntry {
  id: string;
  title: string;
  content: string;
  worldId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
  };
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

export interface EventParticipation {
  id: string;
  status: EventParticipationStatus;
  note: string | null;
  reviewerComment: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  eventId: string;
  characterId: string;
  reviewerId: string | null;
  event: {
    id: string;
    title: string;
    maxParticipants: number | null;
  };
  character: {
    id: string;
    name: string;
    title: string | null;
    ownerId: string;
    world: Pick<World, "id" | "name" | "slug"> | null;
  };
  reviewer: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
}

export interface Event {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  maxParticipants: number | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
  };
  participations: EventParticipation[];
  approvedParticipantCount: number;
  pendingParticipantCount: number;
  remainingSlots: number | null;
}

export interface CharacterResponse {
  character: Character;
}

export interface CharacterRankingEntry {
  position: number;
  characterId: string;
  name: string;
  avatarUrl: string | null;
  world: Pick<World, "id" | "name" | "slug"> | null;
  experiencePoints: number;
  heroPoints: number;
}

export interface CharacterRankingsResponse {
  rankings: CharacterRankingEntry[];
  nextCursor: string | null;
}

export interface WorldRankingEntry {
  worldId: string;
  name: string;
  slug: string;
  activeCharacterCount: number;
  totalExp: number;
  lastActivityAt: string | null;
}

export interface WorldRankingsResponse {
  worlds: WorldRankingEntry[];
}

export interface CharacterRankResponse {
  globalExpRank: number;
  globalPhRank: number;
  worldExpRank: number | null;
  worldPhRank: number | null;
  worldId: string | null;
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

export interface WorldLogsResponse {
  world: Pick<World, "id" | "name" | "slug" | "summary" | "description">;
  entries: WorldLogEntry[];
}

export interface WorldLogResponse {
  message: string;
  entry: WorldLogEntry;
}

export interface EventsResponse {
  events: Event[];
}

export interface EventResponse {
  event: Event;
}

export interface EventMutationResponse {
  message: string;
  event: Event;
}

export interface EventParticipationResponse {
  message: string;
  participation: EventParticipation;
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
  sortOrder: number;
  allowedRoles: Role[];
  isArchived: boolean;
  createdById: string | null;
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

export interface ForumCategoryPayload {
  title: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  allowedRoles?: Role[];
}

export interface UpdateForumCategoryPayload {
  title?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  allowedRoles?: Role[];
  isArchived?: boolean;
}

export interface ForumCategoryMutationResponse {
  category: Omit<ForumCategory, "threadCount" | "latestThread">;
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
  | "SKILL_PROPOSAL_REJECTED"
  | "MODERATION_REPORT_RESOLVED";

export type ModerationReportTargetType = "POST" | "THREAD" | "USER";
export type ModerationReportStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";

export interface ModerationReportAuthor {
  id: string;
  username: string;
  displayName: string | null;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  targetType: ModerationReportTargetType;
  targetId: string;
  reason: string;
  status: ModerationReportStatus;
  resolvedById: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: ModerationReportAuthor;
  resolvedBy: ModerationReportAuthor | null;
}

export interface ModerationReportsResponse {
  reports: ModerationReport[];
}

export interface ModerationReportResponse {
  report: ModerationReport;
}

export interface ModerationReportMutationResponse {
  message: string;
  report: ModerationReport;
}

export interface CreateModerationReportPayload {
  targetType: ModerationReportTargetType;
  targetId: string;
  reason: string;
}

export interface UpdateModerationReportPayload {
  status: ModerationReportStatus;
  resolution?: string;
}

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

export interface MessageParticipant {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: Role;
}

export interface MessageRecipientSearchResponse {
  users: MessageParticipant[];
}

export interface PrivateMessage {
  id: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  senderId: string;
  sender: MessageParticipant;
}

export interface PrivateConversationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  unreadCount: number;
  otherParticipant: MessageParticipant;
  lastMessage: PrivateMessage | null;
}

export interface PrivateConversationsResponse {
  conversations: PrivateConversationSummary[];
}

export interface PrivateConversationMessagesResponse {
  conversation: PrivateConversationSummary;
  messages: PrivateMessage[];
}

export interface PrivateMessageResponse {
  message: PrivateMessage;
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

export interface CreateWorldLogPayload {
  title: string;
  content: string;
}

export interface CreateEventPayload {
  title: string;
  summary?: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  maxParticipants?: number;
}

export interface UpdateEventPayload {
  title?: string;
  summary?: string;
  description?: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  maxParticipants?: number;
}

export interface CreateEventParticipationPayload {
  characterId: string;
  note?: string;
}

export interface ReviewEventParticipationPayload {
  status: EventParticipationStatus;
  reviewerComment?: string;
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

export interface CreateConversationPayload {
  participantId: string;
}

export interface PrivateMessagePayload {
  content: string;
}

export interface UpdateAccountStatusPayload {
  status: AccountStatus;
}

export interface UpdateUserRolePayload {
  role: Role;
}

export interface ActivityLogActor {
  id: string;
  username: string;
  displayName: string | null;
}

export interface ActivityLogEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  actor: ActivityLogActor;
}

export interface ActivityLogResponse {
  entries: ActivityLogEntry[];
  nextCursor: string | null;
}

export interface ActivityLogQueryParams {
  cursor?: string;
  limit?: number;
  actorId?: string;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
}

export interface AdminUsersParams {
  search?: string;
  role?: Role;
  status?: AccountStatus;
  sortBy?: "createdAt" | "lastLogin" | "username";
  page?: number;
  limit?: number;
}

export interface AdminUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminStatsResponse {
  usersByStatus: Partial<Record<AccountStatus, number>>;
  usersByRole: Partial<Record<Role, number>>;
  reportsByStatus: Partial<Record<ModerationReportStatus, number>>;
  characterCount: number;
  activeConversationCount: number;
}

export interface AdminUserActivityResponse {
  entries: ActivityLogEntry[];
}

// Docs & Media

export interface DocCategoryAuthor {
  id: string;
  username: string;
  displayName: string | null;
}

export interface DocCategory {
  id: string;
  name: string;
  description: string | null;
  worldId: string | null;
  sortOrder: number;
  isPublic: boolean;
  createdAt: string;
  createdById: string | null;
  createdBy: DocCategoryAuthor | null;
}

export interface DocPage {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  author: DocCategoryAuthor;
  category: { id: string; name: string };
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  uploadedById: string;
  worldId: string | null;
  createdAt: string;
  uploadedBy: DocCategoryAuthor;
}

export interface DocCategoriesResponse {
  categories: DocCategory[];
}

export interface DocCategoryPagesResponse {
  category: DocCategory;
  pages: DocPage[];
}

export interface DocPageResponse {
  page: DocPage & { category: DocCategory };
}

export interface MediaAssetsResponse {
  assets: MediaAsset[];
}

export interface MediaAssetResponse {
  asset: MediaAsset;
}

export interface CreateDocCategoryPayload {
  name: string;
  description?: string;
  worldId?: string;
  sortOrder?: number;
  isPublic?: boolean;
}

export interface UpdateDocCategoryPayload {
  name?: string;
  description?: string;
  worldId?: string;
  sortOrder?: number;
  isPublic?: boolean;
}

export interface CreateDocPagePayload {
  title: string;
  content: string;
  categoryId: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface UpdateDocPagePayload {
  title?: string;
  content?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface CreateMediaAssetPayload {
  name: string;
  url: string;
  type: MediaType;
  worldId?: string;
}

// Ideas

export interface Idea {
  id: string;
  title: string;
  content: string;
  authorId: string;
  status: IdeaStatus;
  category: string | null;
  gmNote: string | null;
  createdAt: string;
  updatedAt: string;
  author: DocCategoryAuthor;
}

export interface IdeasResponse {
  ideas: Idea[];
}

export interface IdeaResponse {
  idea: Idea;
}

export interface CreateIdeaPayload {
  title: string;
  content: string;
  category?: string;
}

export interface UpdateIdeaStatusPayload {
  status: IdeaStatus;
  gmNote?: string;
}

// Combat

export type CombatStatus = "PREPARING" | "ACTIVE" | "FINISHED" | "CANCELLED";
export type CombatActionType = "ATTACK" | "DEFEND" | "SKILL" | "ITEM" | "PASS";

export interface CombatCharacterRef {
  id: string;
  name: string;
  avatarUrl: string | null;
  ownerId: string;
}

export interface CombatEffect {
  id: string;
  participantId: string;
  name: string;
  description: string | null;
  duration: number;
  appliedAt: number;
  sourceActionId: string | null;
}

export interface CombatParticipant {
  id: string;
  encounterId: string;
  characterId: string;
  initiative: number | null;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  turnOrder: number | null;
  joinedAt: string;
  character: CombatCharacterRef;
  effects: CombatEffect[];
}

export interface CombatEncounterSummary {
  id: string;
  worldId: string;
  title: string;
  status: CombatStatus;
  roundNumber: number;
  gmId: string;
  createdAt: string;
  updatedAt: string;
  gm: { id: string; username: string; displayName: string | null };
  _count: { participants: number };
}

export interface CombatEncounter extends Omit<CombatEncounterSummary, "_count"> {
  participants: CombatParticipant[];
}

export interface CombatEncountersResponse {
  encounters: CombatEncounterSummary[];
}

export interface CombatEncounterResponse {
  encounter: CombatEncounter;
}

export interface CreateCombatPayload {
  title: string;
  worldId: string;
  characterIds: string[];
}

export interface SetInitiativePayload {
  entries: Array<{ characterId: string; initiative: number }>;
}
