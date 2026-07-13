import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, CameraOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { TOKEN_KEY } from '@/api/client';
import { messagesApi } from '@/api/messages';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/v1', '') || 'https://equal-backend.onrender.com';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

type CallState = 'connecting' | 'ringing' | 'connected' | 'ended' | 'error';

function formatTimer(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function VideoCall() {
  const { t } = useTranslation();
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [callState, setCallState] = useState<CallState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [matchName, setMatchName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCallerRef = useRef(false);

  // Load match name
  useEffect(() => {
    if (!matchId) return;
    messagesApi.getMessages(matchId).then(d => setMatchName(d.matchName || '')).catch(() => {});
  }, [matchId]);

  // Timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const cleanUp = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    socketRef.current?.disconnect();
    pcRef.current = null;
    localStreamRef.current = null;
  }, []);

  const handleEndCall = useCallback(() => {
    socketRef.current?.emit('call:end', { matchId });
    setTotalDuration(elapsed);
    setCallState('ended');
    cleanUp();
  }, [elapsed, matchId, cleanUp]);

  // WebRTC setup
  useEffect(() => {
    if (!matchId || !user?.id) return;

    const socket = io(BACKEND_URL, { auth: { token: localStorage.getItem(TOKEN_KEY) }, transports: ['websocket'] });
    socketRef.current = socket;

    const createPeerConnection = () => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.onicecandidate = e => {
        if (e.candidate) socket.emit('call:ice', { matchId, candidate: e.candidate });
      };

      pc.ontrack = e => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        setCallState('connected');
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setTotalDuration(elapsed);
          setCallState('ended');
          cleanUp();
        }
      };

      return pc;
    };

    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        return stream;
      } catch {
        setErrorMsg('Camera/microphone access denied');
        setCallState('error');
        return null;
      }
    };

    socket.on('connect', async () => {
      socket.emit('join:match', matchId);

      // Determine caller: lower userId string initiates
      isCallerRef.current = (user.id || '') < matchId;

      const stream = await startLocalStream();
      if (!stream) return;

      const pc = createPeerConnection();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      if (isCallerRef.current) {
        setCallState('ringing');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:offer', { matchId, offer, callerId: user.id });
      }
    });

    socket.on('call:offer', async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      if (isCallerRef.current) return; // we are caller, ignore
      setCallState('ringing');
      const stream = localStreamRef.current || await startLocalStream();
      if (!stream) return;
      const pc = pcRef.current || createPeerConnection();
      if (!pcRef.current) stream.getTracks().forEach(t => pc.addTrack(t, stream));
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('call:answer', { matchId, answer });
    });

    socket.on('call:answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      await pcRef.current?.setRemoteDescription(answer);
    });

    socket.on('call:ice', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try { await pcRef.current?.addIceCandidate(candidate); } catch { /* ignore */ }
    });

    socket.on('call:end', () => {
      setTotalDuration(elapsed);
      setCallState('ended');
      cleanUp();
    });

    return () => {
      cleanUp();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, user?.id]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOff(c => !c);
  };

  const statusText = callState === 'connecting' ? t('video.connecting')
    : callState === 'ringing' ? t('video.ringing')
    : callState === 'connected' ? t('video.inCall')
    : callState === 'error' ? errorMsg
    : t('video.callEnded');

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: '#000' }}>
      <div className="w-full max-w-[430px] relative flex flex-col" style={{ backgroundColor: '#000' }}>

        {/* Remote video (full screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: callState === 'connected' ? 'block' : 'none' }}
        />

        {/* Connecting/ringing overlay */}
        {callState !== 'connected' && callState !== 'ended' && (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10"
            style={{ background: 'radial-gradient(circle at 50% 40%, rgba(187,131,201,0.2) 0%, transparent 60%)' }}>
            <div className="w-28 h-28 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(187,131,201,0.25)', border: '2px solid rgba(187,131,201,0.4)' }}>
              <span className="text-5xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {matchName.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {matchName || 'Connecting…'}
            </h2>
            <AnimatePresence mode="wait">
              <motion.p key={callState}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: "'Outfit', sans-serif" }}>
                {statusText}
              </motion.p>
            </AnimatePresence>
          </div>
        )}

        {/* Timer while connected */}
        {callState === 'connected' && (
          <div className="absolute top-12 left-0 right-0 flex justify-center z-20">
            <span className="text-white text-sm font-medium tabular-nums px-3 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', fontFamily: "ui-monospace, monospace" }}>
              {matchName} · {formatTimer(elapsed)}
            </span>
          </div>
        )}

        {/* Local video PIP */}
        <div className="absolute z-20 rounded-2xl overflow-hidden"
          style={{ width: 100, height: 140, bottom: 100, right: 16, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {isCameraOff ? (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
              <CameraOff size={24} style={{ color: 'rgba(255,255,255,0.5)' }} />
            </div>
          ) : (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          )}
        </div>

        {/* Controls */}
        {callState !== 'ended' && callState !== 'error' && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-6 pb-8"
            style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}>
            <motion.button whileTap={{ scale: 0.9 }} transition={{ duration: 0.12 }} onClick={toggleMute}
              className="rounded-full flex items-center justify-center"
              style={{ width: 64, height: 64, backgroundColor: isMuted ? '#E86A6A' : '#FFF', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
              {isMuted ? <MicOff size={26} className="text-white" /> : <Mic size={26} className="text-[#232323]" />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} transition={{ duration: 0.12 }} onClick={handleEndCall}
              className="rounded-full flex items-center justify-center"
              style={{ width: 72, height: 72, backgroundColor: '#E86A6A', boxShadow: '0 4px 24px rgba(232,106,106,0.4)' }}>
              <PhoneOff size={30} className="text-white" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} transition={{ duration: 0.12 }} onClick={toggleCamera}
              className="rounded-full flex items-center justify-center"
              style={{ width: 64, height: 64, backgroundColor: isCameraOff ? '#E86A6A' : '#FFF', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
              {isCameraOff ? <VideoOff size={26} className="text-white" /> : <VideoIcon size={26} className="text-[#232323]" />}
            </motion.button>
          </div>
        )}

        {/* Call ended overlay */}
        <AnimatePresence>
          {(callState === 'ended' || callState === 'error') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex flex-col items-center gap-5">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: callState === 'error' ? '#F0B84A' : '#E86A6A' }}>
                  <PhoneOff size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {callState === 'error' ? t('video.callFailed') : t('video.callEnded')}
                </h3>
                {callState === 'ended' && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "ui-monospace, monospace" }}>
                    Duration: {formatTimer(totalDuration || elapsed)}
                  </p>
                )}
                {callState === 'error' && (
                  <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif" }}>
                    {errorMsg}
                  </p>
                )}
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(`/chat/${matchId}`)}
                  className="mt-4 px-8 py-3 rounded-full text-base font-semibold"
                  style={{ backgroundColor: '#BB83C9', color: '#FFF', fontFamily: "'Outfit', sans-serif", boxShadow: '0 4px 16px rgba(187,131,201,0.4)' }}>
                  {t('video.backToChat')}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
