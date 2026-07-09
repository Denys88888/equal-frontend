import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { TOKEN_KEY } from '@/api/client';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/v1', '') || 'https://equal-backend.onrender.com';

export interface IncomingMessage {
  matchId: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export function useSocket(
  matchId: string | undefined,
  onMessage: (msg: IncomingMessage) => void,
  onTypingStart?: (userId: string) => void,
  onTypingStop?: (userId: string) => void,
) {
  const socketRef = useRef<Socket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!matchId) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:match', matchId);
    });

    socket.on('message:new', (msg: IncomingMessage) => {
      onMessageRef.current(msg);
    });

    if (onTypingStart) socket.on('typing:start', ({ userId }: { userId: string }) => onTypingStart(userId));
    if (onTypingStop) socket.on('typing:stop', ({ userId }: { userId: string }) => onTypingStop(userId));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  const sendTypingStart = useCallback((userId: string) => {
    socketRef.current?.emit('typing:start', { matchId, userId });
  }, [matchId]);

  const sendTypingStop = useCallback((userId: string) => {
    socketRef.current?.emit('typing:stop', { matchId, userId });
  }, [matchId]);

  return { sendTypingStart, sendTypingStop };
}
