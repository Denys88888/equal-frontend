import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { TOKEN_KEY } from '@/api/client';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/v1', '') || 'https://equal-backend.onrender.com';

export interface IncomingMessage {
  matchId: string;
  content: string;
  senderId: string;
  createdAt: string;
  // Present when the message came from the REST route (gifts, voice notes);
  // the legacy socket-only path omits them.
  id?: string;
  type?: 'TEXT' | 'VOICE' | 'IMAGE' | 'GIFT' | 'SYSTEM';
  giftType?: string | null;
}

export interface MatchNewEvent {
  matchId: string;
  withUserId: string;
}

// Singleton socket shared across the app so all hooks share one connection
let _socket: Socket | null = null;
function getSocket(): Socket {
  if (!_socket || !_socket.connected) {
    const token = localStorage.getItem(TOKEN_KEY);
    _socket = io(BACKEND_URL, { auth: { token }, transports: ['websocket'] });
  }
  return _socket;
}

/** Used in Chat screen — joins a match room and listens for messages/typing */
export function useSocket(
  matchId: string | undefined,
  onMessage: (msg: IncomingMessage) => void,
  onTypingStart?: (userId: string) => void,
  onTypingStop?: (userId: string) => void,
  onPresence?: (userId: string, isOnline: boolean) => void,
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onPresenceRef = useRef(onPresence);
  onPresenceRef.current = onPresence;

  useEffect(() => {
    if (!matchId) return;
    const socket = getSocket();

    const onConnect = () => socket.emit('join:match', matchId);
    if (socket.connected) socket.emit('join:match', matchId);
    else socket.on('connect', onConnect);

    const onMsg = (msg: IncomingMessage) => onMessageRef.current(msg);
    socket.on('message:new', onMsg);

    const onTStart = ({ userId }: { userId: string }) => onTypingStart?.(userId);
    const onTStop = ({ userId }: { userId: string }) => onTypingStop?.(userId);
    socket.on('typing:start', onTStart);
    socket.on('typing:stop', onTStop);

    const onPres = ({ userId, isOnline }: { userId: string; isOnline: boolean }) =>
      onPresenceRef.current?.(userId, isOnline);
    socket.on('presence:update', onPres);

    return () => {
      socket.off('connect', onConnect);
      socket.off('message:new', onMsg);
      socket.off('typing:start', onTStart);
      socket.off('typing:stop', onTStop);
      socket.off('presence:update', onPres);
    };
  }, [matchId]);

  const sendTypingStart = useCallback((userId: string) => {
    getSocket().emit('typing:start', { matchId, userId });
  }, [matchId]);

  const sendTypingStop = useCallback((userId: string) => {
    getSocket().emit('typing:stop', { matchId, userId });
  }, [matchId]);

  return { sendTypingStart, sendTypingStop };
}

/** Used app-wide (e.g. AuthProvider) — joins user room and listens for match:new */
export function useUserSocket(
  userId: string | undefined,
  onMatchNew?: (event: MatchNewEvent) => void,
) {
  const onMatchRef = useRef(onMatchNew);
  onMatchRef.current = onMatchNew;

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();

    const onConnect = () => socket.emit('join:user', userId);
    if (socket.connected) socket.emit('join:user', userId);
    else socket.on('connect', onConnect);

    const onMatch = (event: MatchNewEvent) => onMatchRef.current?.(event);
    socket.on('match:new', onMatch);

    return () => {
      socket.off('connect', onConnect);
      socket.off('match:new', onMatch);
    };
  }, [userId]);
}

export interface IncomingClubMessage {
  id: string;
  clubId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

/** Joins a club's chat room. The server only admits actual members. */
export function useClubSocket(
  clubId: string | undefined,
  onMessage: (msg: IncomingClubMessage) => void,
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!clubId) return;
    const socket = getSocket();

    const join = () => socket.emit('join:club', clubId);
    if (socket.connected) join();
    else socket.on('connect', join);

    const onMsg = (msg: IncomingClubMessage) => {
      if (msg.clubId === clubId) onMessageRef.current(msg);
    };
    socket.on('club:message', onMsg);

    return () => {
      socket.emit('leave:club', clubId);
      socket.off('connect', join);
      socket.off('club:message', onMsg);
    };
  }, [clubId]);
}
