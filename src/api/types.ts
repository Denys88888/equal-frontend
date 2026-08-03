// ── API Types ──────────────────────────────────────────

// ── User & Auth ────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  name: string;
  role?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role?: string;
  bio: string;
  birthDate: string;
  city: string;
  goals: string[];
  interests: string[];
  photos: Photo[];
  trustScore: number;
  verified: boolean;
  sparkBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  url: string;
  isMain: boolean;
  order: number;
  createdAt: string;
}

// ── Auth ───────────────────────────────────────────────

export interface AuthPiRequest {
  accessToken: string;
  scopes: string[];
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
}

export interface TokenRefreshResponse {
  token: string;
}

// ── Verification ───────────────────────────────────────

export interface VerificationSelfieResponse {
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
}

export type VerificationGesture = 'blink' | 'smile' | 'turn_left' | 'turn_right';

// ── Discover ───────────────────────────────────────────

export interface ProfileCard {
  id: string;
  name: string;
  age: number;
  distance: number;
  compatibility: number;
  bio: string;
  photo: string;
  photos: string[];
  interests: string[];
  verified: boolean;
  activeNow: boolean;
  isNew: boolean;
  badges?: string[];
}

export interface DiscoverResponse {
  profiles: ProfileCard[];
  total: number;
  hasMore: boolean;
}

export interface SwipeResult {
  success: boolean;
  isMatch: boolean;
  matchId?: string;
  /** Present when the swipe consumed a spark (server-authoritative balance). */
  sparkBalance?: number;
}

// ── Matches & Messages ─────────────────────────────────

export interface Match {
  id: string;
  name: string;
  photo: string;
  compatibility: number;
  isNew: boolean;
  sparkUsed: boolean;
  isOnline: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isTyping?: boolean;
  hasConversation: boolean;
}

export interface Message {
  id: string;
  type: 'TEXT' | 'VOICE' | 'IMAGE' | 'GIFT' | 'SYSTEM';
  content: string;
  sender: 'me' | 'them';
  timestamp: string;
  read?: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  partnerId?: string;
  matchName: string;
  matchAvatar: string;
  isOnline: boolean;
  isVerified: boolean;
  sharedInterests: string[];
  icebreakers: string[];
}

export interface SendMessageRequest {
  content: string;
  type: 'TEXT' | 'VOICE' | 'IMAGE' | 'GIFT' | 'SYSTEM';
}

export interface SendMessageResponse extends Message {}

// ── Clubs ──────────────────────────────────────────────

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  memberCount: number;
  postCount: number;
  isJoined: boolean;
  createdAt: string;
}

export interface ClubPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  photo?: string;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface CreateClubRequest {
  name: string;
  description: string;
  category: string;
  icon?: string;
}

export interface CreatePostRequest {
  content: string;
  photo?: string;
}

// ── Events ─────────────────────────────────────────────

export interface Event {
  id: string;
  title: string;
  description: string;
  city: string;
  category: string;
  date: string;
  time?: string;
  location?: string;
  hostId: string;
  hostName: string;
  attendeeCount: number;
  maxAttendees?: number;
  isAttending: boolean;
  photo?: string;
  createdAt: string;
}

export interface RsvpRequest {
  status: 'going' | 'interested' | 'not_going';
}

// ── Payments ───────────────────────────────────────────

export interface DonationResponse {
  paymentId: string;
  piUrl: string;
}

// ── Admin ──────────────────────────────────────────────

/**
 * Field names match GET /admin/stats exactly (admin.service.ts getStats()).
 * Revenue fields: Equal has no A2U payout or fee split — every completed
 * payment (gift or paid-event ticket) goes to the app's own Pi wallet, so
 * these totals ARE the app's revenue, not a commission slice of it.
 */
export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalMatches: number;
  pendingReports: number;
  revenueTotalPi: number;
  revenueTotalCount: number;
  revenueTodayPi: number;
  revenueTodayCount: number;
  giftRevenuePi: number;
  giftRevenueCount: number;
  ticketRevenuePi: number;
  ticketRevenueCount: number;
}

export interface UserAdmin {
  id: string;
  username: string;
  name: string;
  trustScore: number;
  verified: boolean;
  createdAt: string;
  role: 'user' | 'moderator' | 'admin';
  isBanned: boolean;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  action?: 'warn' | 'ban' | 'none';
}

export interface AdjustTrustRequest {
  score: number;
  reason: string;
}

export interface AwardBadgeRequest {
  badge: string;
}
