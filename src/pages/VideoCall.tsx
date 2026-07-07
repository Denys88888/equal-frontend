import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  CameraOff,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────

type CallState = 'connecting' | 'ringing' | 'connected' | 'ended';

interface MatchData {
  name: string;
  avatar: string;
  initials: string;
  bgColor: string;
}

// ── Mock Data ────────────────────────────────────────────

const MOCK_MATCHES: Record<string, MatchData> = {
  sophie: { name: 'Sophie', avatar: '/avatar-sarah.jpg', initials: 'S', bgColor: '#BB83C9' },
  emma: { name: 'Emma', avatar: '/avatar-emma.jpg', initials: 'E', bgColor: '#7DE0B3' },
  olivia: { name: 'Olivia', avatar: '/avatar-olivia.jpg', initials: 'O', bgColor: '#7BC4E8' },
};

// ── Helpers ──────────────────────────────────────────────

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getMatchFromId(matchId: string): MatchData {
  const key = matchId.toLowerCase();
  if (MOCK_MATCHES[key]) return MOCK_MATCHES[key];
  // Fallback: derive from matchId
  const name = key.charAt(0).toUpperCase() + key.slice(1);
  return {
    name,
    avatar: `/${key}.jpg`,
    initials: name.charAt(0).toUpperCase(),
    bgColor: '#BB83C9',
  };
}

// ── Components ───────────────────────────────────────────

function PulsingAvatar({ src, initials, bgColor, isPulsing }: {
  src: string;
  initials: string;
  bgColor: string;
  isPulsing: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings */}
      {isPulsing && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{ width: 160, height: 160, backgroundColor: bgColor, opacity: 0.2 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ width: 160, height: 160, backgroundColor: bgColor, opacity: 0.15 }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.15, 0, 0.15] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
        </>
      )}
      {/* Avatar image or fallback circle */}
      <div
        className="relative w-32 h-32 rounded-full overflow-hidden border-3 border-white/30"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      >
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.style.backgroundColor = bgColor;
              parent.style.display = 'flex';
              parent.style.alignItems = 'center';
              parent.style.justifyContent = 'center';
              const span = document.createElement('span');
              span.textContent = initials;
              span.style.fontSize = '36px';
              span.style.fontWeight = '600';
              span.style.color = '#FFFFFF';
              parent.appendChild(span);
            }
          }}
        />
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────

export default function VideoCall() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const match = getMatchFromId(matchId || 'sophie');

  const [callState, setCallState] = useState<CallState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Call state machine ──
  useEffect(() => {
    const t1 = setTimeout(() => {
      setCallState('ringing');
    }, 1500);

    const t2 = setTimeout(() => {
      setCallState('connected');
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // ── Timer ──
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (callState === 'ended' && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  // ── Handlers ──
  const handleEndCall = useCallback(() => {
    setTotalDuration(elapsedSeconds);
    setCallState('ended');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [elapsedSeconds]);

  const handleBackToChat = useCallback(() => {
    navigate(`/chat/${matchId}`);
  }, [navigate, matchId]);

  const statusText =
    callState === 'connecting'
      ? 'Connecting...'
      : callState === 'ringing'
        ? 'Ringing...'
        : callState === 'connected'
          ? 'In call'
          : 'Call ended';

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: '#000000' }}>
      <div className="w-full max-w-[430px] relative flex flex-col" style={{ backgroundColor: '#000000' }}>
        {/* ═══════════════ Remote Video Area ═══════════════ */}
        <div className="flex-1 flex flex-col items-center justify-center relative" style={{ backgroundColor: '#000000' }}>
          {/* Background subtle gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 40%, rgba(187,131,201,0.15) 0%, transparent 60%)',
            }}
          />

          {/* Bottom gradient for controls visibility */}
          <div
            className="absolute bottom-0 left-0 right-0 h-48"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
            }}
          />

          {/* Avatar + Status */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <PulsingAvatar
              src={match.avatar}
              initials={match.initials}
              bgColor={match.bgColor}
              isPulsing={callState === 'connecting' || callState === 'ringing'}
            />

            {/* Match name */}
            <h2
              className="text-2xl font-semibold text-white tracking-tight mt-2"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {match.name}
            </h2>

            {/* Status text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={callState}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                className="text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {statusText}
              </motion.p>
            </AnimatePresence>

            {/* Timer */}
            <AnimatePresence>
              {callState === 'connected' && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                  className="text-base font-medium tabular-nums"
                  style={{ color: 'rgba(255,255,255,0.85)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                >
                  {formatTimer(elapsedSeconds)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ═══════════════ Call Ended Overlay ═══════════════ */}
        <AnimatePresence>
          {callState === 'ended' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number], delay: 0.1 }}
                className="flex flex-col items-center gap-5"
              >
                {/* Ended icon */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#E86A6A' }}
                >
                  <PhoneOff size={32} className="text-white" strokeWidth={2} />
                </div>

                <h3
                  className="text-2xl font-semibold text-white"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  Call ended
                </h3>

                <p
                  className="text-sm"
                  style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                >
                  Duration: {formatTimer(totalDuration || elapsedSeconds)}
                </p>

                {/* Back to chat button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.1 }}
                  onClick={handleBackToChat}
                  className="mt-4 px-8 py-3 rounded-full text-base font-semibold"
                  style={{
                    backgroundColor: '#BB83C9',
                    color: '#FFFFFF',
                    fontFamily: "'Outfit', system-ui, sans-serif",
                    boxShadow: '0 4px 16px rgba(187,131,201,0.4)',
                  }}
                >
                  Back to chat
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════ Local Video PIP ═══════════════ */}
        <div
          className="absolute z-20 rounded-2xl overflow-hidden"
          style={{
            width: 100,
            height: 140,
            bottom: 100,
            right: 16,
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {isCameraOff ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ backgroundColor: '#1a1a1a' }}>
              <CameraOff size={24} style={{ color: 'rgba(255,255,255,0.5)' }} strokeWidth={2} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                Camera off
              </span>
            </div>
          ) : (
            <img
              src="./avatar-ethan.jpg"
              alt="You"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.style.backgroundColor = '#3A3A3A';
                  parent.style.display = 'flex';
                  parent.style.alignItems = 'center';
                  parent.style.justifyContent = 'center';
                }
              }}
            />
          )}
        </div>

        {/* ═══════════════ Controls Bar ═══════════════ */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-6 pb-8 pt-4"
          style={{
            paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          }}
        >
          {/* Mute */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onClick={() => setIsMuted((prev) => !prev)}
            className="rounded-full flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              backgroundColor: isMuted ? '#E86A6A' : '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            {isMuted ? (
              <MicOff size={26} className="text-white" strokeWidth={2} />
            ) : (
              <Mic size={26} className="text-[#232323]" strokeWidth={2} />
            )}
          </motion.button>

          {/* End Call */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onClick={handleEndCall}
            className="rounded-full flex items-center justify-center"
            style={{
              width: 72,
              height: 72,
              backgroundColor: '#E86A6A',
              boxShadow: '0 4px 24px rgba(232,106,106,0.4)',
            }}
          >
            <PhoneOff size={30} className="text-white" strokeWidth={2} />
          </motion.button>

          {/* Camera */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onClick={() => setIsCameraOff((prev) => !prev)}
            className="rounded-full flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              backgroundColor: isCameraOff ? '#E86A6A' : '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            {isCameraOff ? (
              <VideoOff size={26} className="text-white" strokeWidth={2} />
            ) : (
              <VideoIcon size={26} className="text-[#232323]" strokeWidth={2} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
