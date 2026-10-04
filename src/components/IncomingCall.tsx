import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';
import { getSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import { callState } from '@/lib/callState';

interface Incoming {
  matchId: string;
  name: string;
  photo: string | null;
}

/** Matches the caller's ring timeout, so a missed call does not linger. */
const RING_MS = 45_000;

/**
 * The screen that rings when someone video-calls you, on whatever page you
 * are. Before it existed nothing on the callee's side reacted to a call, so a
 * call could only connect if both people happened to open it at once.
 */
export default function IncomingCall() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [call, setCall] = useState<Incoming | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const onIncoming = (p: Incoming) => {
      if (!p?.matchId) return;
      // Already in a call: tell the caller instead of ringing over it.
      if (callState.active) {
        socket.emit('call:decline', { matchId: p.matchId, reason: 'busy' });
        return;
      }
      setCall({ matchId: p.matchId, name: p.name || '', photo: p.photo ?? null });
    };
    const onGone = (p: { matchId: string }) => setCall((c) => (c && c.matchId === p?.matchId ? null : c));
    socket.on('call:incoming', onIncoming);
    socket.on('call:cancelled', onGone);
    socket.on('call:end', onGone);
    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:cancelled', onGone);
      socket.off('call:end', onGone);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!call) return;
    const pattern = [600, 400, 600, 1400];
    const vibrate = () => { try { navigator.vibrate?.(pattern); } catch { /* not supported */ } };
    vibrate();
    const buzz = setInterval(vibrate, 3000);
    const expire = setTimeout(() => setCall(null), RING_MS);
    return () => {
      clearInterval(buzz);
      clearTimeout(expire);
      try { navigator.vibrate?.(0); } catch { /* not supported */ }
    };
  }, [call]);

  const accept = () => {
    if (!call) return;
    setCall(null);
    navigate(`/video/${call.matchId}?answer=1`);
  };

  const decline = () => {
    if (!call) return;
    getSocket().emit('call:decline', { matchId: call.matchId });
    setCall(null);
  };

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          key={call.matchId}
          role="alertdialog"
          aria-label={t('video.incoming')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)' }}
        >
          <div className="w-full max-w-[430px] flex flex-col items-center justify-between px-8"
            style={{
              paddingTop: 'calc(96px + env(safe-area-inset-top))',
              paddingBottom: 'calc(56px + env(safe-area-inset-bottom))',
              background: 'radial-gradient(circle at 50% 30%, rgba(187,131,201,0.25) 0%, transparent 60%)',
            }}>
            <div className="flex flex-col items-center text-center">
              <motion.div
                className="w-32 h-32 rounded-full overflow-hidden mb-6"
                style={{ border: '2px solid rgba(187,131,201,0.6)' }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <UserAvatar src={call.photo} name={call.name} className="text-5xl" />
              </motion.div>
              <h2 className="text-3xl font-semibold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {call.name}
              </h2>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif" }}>
                {t('video.incoming')}
              </p>
            </div>

            <div className="w-full flex items-start justify-around">
              <div className="flex flex-col items-center gap-3">
                <motion.button whileTap={{ scale: 0.9 }} onClick={decline}
                  aria-label={t('video.decline')}
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 72, height: 72, backgroundColor: '#E86A6A', boxShadow: '0 4px 24px rgba(232,106,106,0.4)' }}>
                  <PhoneOff size={30} className="text-white" />
                </motion.button>
                <span className="text-sm text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{t('video.decline')}</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <motion.button whileTap={{ scale: 0.9 }} onClick={accept}
                  aria-label={t('video.accept')}
                  className="rounded-full flex items-center justify-center"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 72, height: 72, backgroundColor: '#4CC38A', boxShadow: '0 4px 24px rgba(76,195,138,0.45)' }}>
                  <Phone size={30} className="text-white" />
                </motion.button>
                <span className="text-sm text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{t('video.accept')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
