// ── API Types ──────────────────────────────────────────

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
}

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
  type: 'text' | 'voice' | 'gift' | 'image';
  content: string;
  sender: 'me' | 'them';
  timestamp: string;
  duration?: string;
  giftType?: 'coffee' | 'rose' | 'song' | 'spark';
  giftPrice?: string;
  read?: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  matchName: string;
  matchAvatar: string;
  isOnline: boolean;
  isVerified: boolean;
  sharedInterests: string[];
  icebreakers: string[];
}

export interface SendMessageRequest {
  content: string;
  type: 'text' | 'voice' | 'gift' | 'image';
}

export interface SendMessageResponse extends Message {}
