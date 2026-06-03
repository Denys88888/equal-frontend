/**
 * Equal Dating App — API Type Definitions
 * Auto-generated from OpenAPI 3.0.3 spec (equal-backend-api.yaml)
 *
 * These interfaces mirror the NestJS backend DTOs and entity schemas.
 * Keep them in sync with backend changes.
 */

// ───────────────────────────────────────────────────────────
// CORE USER TYPES
// ───────────────────────────────────────────────────────────

/** Authentication method used by the user */
export type AuthType = 'pi' | 'email';

/** Base user record returned by auth endpoints */
export interface User {
  id: string;
  username: string;
  piUid?: string;
  email?: string;
  authType: AuthType;
}

/** A single profile photo */
export interface Photo {
  id: string;
  url: string;
  isMain: boolean;
  order: number;
}

/** Full user profile — returned by /me */
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  birthDate: string;
  age: number;
  city: string;
  goals: string[];
  interests: string[];
  photos: Photo[];
  trustScore: number;
  badges: string[];
  sparkBalance: number;
  verified: boolean;
  isActive: boolean;
  lastActiveAt?: string;
}

/** Condensed profile card shown on the Discover swipe screen */
export interface ProfileCard {
  id: string;
  name: string;
  age: number;
  distance: number;
  compatibility: number;
  bio: string;
  photo: string;
  photos?: string[];
  interests: string[];
  verified: boolean;
  activeNow: boolean;
  isNew?: boolean;
  badges: string[];
}

// ───────────────────────────────────────────────────────────
// MESSAGING TYPES
// ───────────────────────────────────────────────────────────

/** Message content type discriminator */
export type MessageType = 'text' | 'voice' | 'gift' | 'system';

/** A chat message inside a match conversation */
export interface Message {
  id: string;
  matchId?: string;
  senderId: string;
  content: string;
  type: MessageType;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
}

/** A mutual match between two users */
export interface Match {
  id: string;
  user: ProfileCard;
  createdAt: string;
  lastMessage?: Message;
  unreadCount: number;
  isTyping: boolean;
}

// ───────────────────────────────────────────────────────────
// CLUB TYPES
// ───────────────────────────────────────────────────────────

/** Interest-based community / club */
export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  memberCount: number;
  postCount: number;
  isJoined: boolean;
  isAdmin?: boolean;
}

/** A post inside a club feed */
export interface ClubPost {
  id: string;
  author: User;
  content: string;
  photoUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

// ───────────────────────────────────────────────────────────
// EVENT TYPES
// ───────────────────────────────────────────────────────────

/** Currency used for event pricing */
export type EventCurrency = 'PI' | 'USD';

/** RSVP status for an event */
export type RsvpStatus = 'going' | 'interested' | 'not_going';

/** An offline/in-person event */
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  city: string;
  category: string;
  price: number;
  currency?: EventCurrency;
  maxAttendees?: number;
  attendeesCount: number;
  isRsvped: boolean;
  coverImage?: string;
  host?: User;
}

// ───────────────────────────────────────────────────────────
// REPORT TYPES
// ───────────────────────────────────────────────────────────

/** Predefined report reasons */
export type ReportReason = 'spam' | 'harassment' | 'fake_profile' | 'inappropriate' | 'other';

/** Context where the report originated */
export type ReportContext = 'chat' | 'profile' | 'club_post';

/** Report status as tracked by moderation */
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

/** Moderation action taken on a report */
export type ReportAction = 'warn' | 'ban' | 'none';

/** A user-submitted moderation report */
export interface Report {
  id: string;
  reporterId?: string;
  targetUserId: string;
  targetUserName: string;
  reason: string;
  description?: string;
  context?: string;
  status: ReportStatus;
  action?: ReportAction;
  createdAt: string;
  resolvedAt?: string;
}

// ───────────────────────────────────────────────────────────
// PAYMENT / SPARK TYPES
// ───────────────────────────────────────────────────────────

/** In-app spark currency balance */
export interface SparkBalance {
  balance: number;
}

/** Pi payment approval payload */
export interface PaymentApproval {
  paymentId: string;
}

/** Pi payment completion payload */
export interface PaymentCompletion {
  paymentId: string;
  txid: string;
}

// ───────────────────────────────────────────────────────────
// ADMIN TYPES
// ───────────────────────────────────────────────────────────

/** Admin dashboard analytics snapshot */
export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  newToday: number;
  totalMatches: number;
  newMatches: number;
  pendingReports: number;
  totalConversations: number;
  messagesToday: number;
}

/** Admin-facing user record */
export interface UserAdmin {
  id: string;
  name: string;
  username: string;
  email?: string;
  trustScore: number;
  status: 'active' | 'banned' | 'reported';
  verified: boolean;
  createdAt: string;
  lastActiveAt?: string;
  reportsCount: number;
  badges: string[];
}

/** Available badge types that can be awarded */
export type BadgeType = 'verified' | 'life_of_party' | 'dating_pro' | 'max_trust';

/** Verification selfie submission status */
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

/** Gesture required for selfie video verification */
export type VerificationGesture = 'raise_left_hand' | 'turn_head_right' | 'smile';

// ───────────────────────────────────────────────────────────
// REQUEST DTOs
// ───────────────────────────────────────────────────────────

/** Swipe action payload for /discover/action */
export interface SwipeActionRequest {
  targetUserId: string;
  action: 'like' | 'dislike' | 'spark';
}

/** Swipe action response */
export interface SwipeActionResponse {
  isMatch: boolean;
  matchId?: string;
}

/** Send-message payload */
export interface SendMessageRequest {
  content: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
}

/** Pi Network authentication payload */
export interface AuthPiRequest {
  accessToken: string;
  scopes: string[];
}

/** Email authentication payload (register or login) */
export interface AuthEmailRequest {
  email: string;
  password: string;
  name?: string;
}

/** Authentication response — JWT + user data */
export interface AuthResponse {
  token: string;
  user: User;
}

/** Token refresh response */
export interface TokenRefreshResponse {
  token: string;
}

/** Report submission payload */
export interface ReportRequest {
  targetUserId: string;
  reason: ReportReason;
  description?: string;
  context?: ReportContext;
}

/** Create club payload */
export interface CreateClubRequest {
  name: string;
  description: string;
  category: string;
  icon?: string;
}

/** Create club post payload */
export interface CreatePostRequest {
  content: string;
  photoUrl?: string;
}

/** RSVP to an event */
export interface RsvpRequest {
  status: RsvpStatus;
}

/** Trust-score adjustment (admin) */
export interface AdjustTrustRequest {
  score: number;
  reason: string;
}

/** Badge award payload (admin) */
export interface AwardBadgeRequest {
  badge: BadgeType;
}

/** Verification selfie submission */
export interface VerificationSelfieRequest {
  video: File;
  gesture: VerificationGesture;
}

/** Verification selfie response */
export interface VerificationSelfieResponse {
  status: VerificationStatus;
}

/** Donation initiation response */
export interface DonationResponse {
  paymentId: string;
  url: string;
}

// ───────────────────────────────────────────────────────────
// DISCOVERY FILTER TYPES
// ───────────────────────────────────────────────────────────

/** Query parameters for the /discover endpoint */
export interface DiscoverFilters {
  /** Latitude of current user */
  lat?: number;
  /** Longitude of current user */
  lon?: number;
  /** Maximum distance in kilometers (default: 50) */
  maxDistance?: number;
  /** Minimum age filter (default: 18) */
  ageMin?: number;
  /** Maximum age filter (default: 99) */
  ageMax?: number;
  /** Show only verified users */
  verifiedOnly?: boolean;
  /** Filter by shared interests */
  interests?: string[];
  /** Exclude already-seen profile IDs */
  excludeIds?: string[];
}

// ───────────────────────────────────────────────────────────
// RESPONSE WRAPPER TYPES
// ───────────────────────────────────────────────────────────

/** Generic paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Generic API success envelope */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/** Generic API error envelope */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  status: number;
}
