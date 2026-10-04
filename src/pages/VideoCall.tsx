import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, CameraOff } from 'lucide-react';
import { messagesApi } from '@/api/messages';
import { callsApi } from '@/api/calls';
import { getSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import { callState as deviceCall } from '@/lib/callState';

/**
 * One-to-one video call.
 *
 * The caller opens /video/:matchId from the chat; the person being called gets
 * an incoming-call screen (IncomingCall) or a push, and accepting opens
 * /video/:matchId?answer=1. Signaling goes through the server to the other
 * person's own socket room:
 *
 *   caller  call:invite ─▶ callee sees it, taps Accept
 *   callee  call:accept ─▶ caller creates the offer
 *   caller  call:offer  ─▶ callee  call:answer ─▶ both trade call:ice
 *
 * The previous version had no incoming call at all and picked the caller by
 * comparing a user id with the match id, so for many pairs both sides waited
 * for an offer (or both sent one) and the call could never connect.
 */

const FALLBACK_ICE: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
const RING_TIMEOUT_MS = 45_000;
/** Callee side: how long to wait for the caller's offer after accepting. */
const OFFER_TIMEOUT_MS = 20_000;
/** A dropped connection gets this long to recover before the call ends. */
const RECONNECT_GRACE_MS = 10_000;

type CallState = 'starting' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'ended';
type EndReason =
  | 'hangup' | 'remoteHangup' | 'noAnswer' | 'declined' | 'busy'
  | 'unavailable' | 'missed' | 'failed' | 'permission' | 'unsupported';

function formatTimer(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

async function getMedia(): Promise<MediaStream> {
  const audio = { echoCancellation: true, noiseSuppression: true };
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio,
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    });
  } catch (err) {
    // No camera (or it is busy): still let the person talk.
    const name = (err as DOMException)?.name;
    if (name === 'NotFoundError' || name === 'NotReadableError' || name === 'OverconstrainedError') {
      return navigator.mediaDevices.getUserMedia({ audio });
    }
    throw err;
  }
}

export default function VideoCall() {
  const { t } = useTranslation();
  const { matchId } = useParams<{ matchId: string }>();
  const [searchParams] = useSearchParams();
  const isCallee = searchParams.get('answer') === '1';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [callState, setCallState] = useState<CallState>('starting');
  const [endReason, setEndReason] = useState<EndReason | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [wasConnected, setWasConnected] = useState(false);
  const [partner, setPartner] = useState<{ name: string; photo: string | null }>({ name: '', photo: null });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const connectedAtRef = useRef<number | null>(null);
  /** Hang-up from the button: set by the call effect, which owns the state it needs. */
  const hangUpRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!matchId) return;
    messagesApi.getMessages(matchId)
      .then((d) => setPartner({ name: d.matchName || '', photo: d.matchAvatar || null }))
      .catch(() => {});
  }, [matchId]);

  // Call timer, counted from the moment media connected.
  useEffect(() => {
    if (callState !== 'connected' && callState !== 'reconnecting') return;
    const id = setInterval(() => {
      if (connectedAtRef.current) setElapsed(Math.floor((Date.now() - connectedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [callState]);

  useEffect(() => {
    if (!matchId || !user?.id) return;
    const socket = getSocket();
    let pc: RTCPeerConnection | null = null;
    let finished = false;
    let accepted = false;
    const pendingIce: RTCIceCandidateInit[] = [];
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
      return id;
    };
    const clearTimer = (id?: ReturnType<typeof setTimeout>) => {
      if (id) { clearTimeout(id); timers.delete(id); }
    };
    let ringTimer: ReturnType<typeof setTimeout> | undefined;
    let offerTimer: ReturnType<typeof setTimeout> | undefined;
    let dropTimer: ReturnType<typeof setTimeout> | undefined;

    const mine = (p: { matchId?: string } | undefined) => p?.matchId === matchId;
    deviceCall.active = true;

    const finish = (reason: EndReason, signal?: 'call:end' | 'call:cancel' | 'call:decline') => {
      if (finished) return;
      finished = true;
      deviceCall.active = false;
      if (signal) socket.emit(signal, { matchId });
      timers.forEach(clearTimeout);
      timers.clear();
      localStreamRef.current?.getTracks().forEach((tr) => tr.stop());
      localStreamRef.current = null;
      pc?.close();
      pc = null;
      if (connectedAtRef.current) setElapsed(Math.floor((Date.now() - connectedAtRef.current) / 1000));
      setEndReason(reason);
      setCallState('ended');
    };

    hangUpRef.current = () => {
      if (pc && accepted) finish('hangup', 'call:end');
      else if (isCallee) finish('hangup', 'call:end');
      else finish('hangup', 'call:cancel');
    };

    const flushIce = async () => {
      while (pc?.remoteDescription && pendingIce.length) {
        const c = pendingIce.shift()!;
        try { await pc.addIceCandidate(c); } catch { /* a stale candidate is harmless */ }
      }
    };

    const makePeer = (iceServers: RTCIceServer[], stream: MediaStream) => {
      const conn = new RTCPeerConnection({ iceServers });
      stream.getTracks().forEach((tr) => conn.addTrack(tr, stream));
      conn.onicecandidate = (e) => {
        if (e.candidate) socket.emit('call:ice', { matchId, candidate: e.candidate.toJSON() });
      };
      conn.ontrack = (e) => {
        const remote = e.streams[0] ?? new MediaStream([e.track]);
        const el = remoteVideoRef.current;
        if (el && el.srcObject !== remote) {
          el.srcObject = remote;
          el.play().catch(() => {});
        }
      };
      const onState = () => {
        // Older WebKit has no connectionState; ICE state says the same thing.
        const state = conn.connectionState ?? (
          conn.iceConnectionState === 'completed' ? 'connected' : conn.iceConnectionState
        );
        if (state === 'connected') {
          clearTimer(dropTimer);
          if (!connectedAtRef.current) connectedAtRef.current = Date.now();
          setWasConnected(true);
          setCallState('connected');
        } else if (state === 'disconnected') {
          setCallState('reconnecting');
          clearTimer(dropTimer);
          dropTimer = later(() => finish('failed', 'call:end'), RECONNECT_GRACE_MS);
        } else if (state === 'failed') {
          finish('failed', 'call:end');
        }
      };
      conn.onconnectionstatechange = onState;
      conn.oniceconnectionstatechange = onState;
      return conn;
    };

    const onIce = async (p: { matchId: string; candidate: RTCIceCandidateInit }) => {
      if (!mine(p) || !p.candidate) return;
      pendingIce.push(p.candidate);
      await flushIce();
    };
    const onRemoteEnd = (p: { matchId: string }) => { if (mine(p)) finish('remoteHangup'); };

    // Caller side
    const onAccepted = async (p: { matchId: string }) => {
      if (!mine(p) || isCallee || finished || accepted || !pc) return;
      accepted = true;
      clearTimer(ringTimer);
      setCallState('connecting');
      try {
        await pc.setLocalDescription(await pc.createOffer());
        socket.emit('call:offer', { matchId, offer: pc.localDescription });
      } catch {
        finish('failed', 'call:end');
      }
    };
    const onAnswer = async (p: { matchId: string; answer: RTCSessionDescriptionInit }) => {
      if (!mine(p) || !pc || pc.signalingState !== 'have-local-offer') return;
      try {
        await pc.setRemoteDescription(p.answer);
        await flushIce();
      } catch {
        finish('failed', 'call:end');
      }
    };
    const onDeclined = (p: { matchId: string; reason?: string }) => {
      if (mine(p) && !isCallee) finish(p.reason === 'busy' ? 'busy' : 'declined');
    };

    // Callee side
    const onOffer = async (p: { matchId: string; offer: RTCSessionDescriptionInit }) => {
      if (!mine(p) || !isCallee || !pc || finished) return;
      clearTimer(offerTimer);
      accepted = true;
      try {
        await pc.setRemoteDescription(p.offer);
        await flushIce();
        await pc.setLocalDescription(await pc.createAnswer());
        socket.emit('call:answer', { matchId, answer: pc.localDescription });
      } catch {
        finish('failed', 'call:end');
      }
    };

    socket.on('call:ice', onIce);
    socket.on('call:end', onRemoteEnd);
    socket.on('call:cancelled', onRemoteEnd);
    socket.on('call:accepted', onAccepted);
    socket.on('call:answer', onAnswer);
    socket.on('call:declined', onDeclined);
    socket.on('call:offer', onOffer);

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') {
        finish('unsupported', isCallee ? 'call:decline' : undefined);
        return;
      }
      const icePromise = callsApi.iceServers().catch(() => FALLBACK_ICE);
      let stream: MediaStream;
      try {
        stream = await getMedia();
      } catch {
        finish('permission', isCallee ? 'call:decline' : undefined);
        return;
      }
      if (finished) { stream.getTracks().forEach((tr) => tr.stop()); return; }
      localStreamRef.current = stream;
      setHasVideo(stream.getVideoTracks().length > 0);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const iceServers = await icePromise;
      if (finished) return;
      pc = makePeer(iceServers, stream);

      if (isCallee) {
        setCallState('connecting');
        socket.emit('call:accept', { matchId });
        // The caller may have hung up while this screen was opening.
        offerTimer = later(() => finish('missed'), OFFER_TIMEOUT_MS);
        return;
      }

      setCallState('ringing');
      try {
        const ack = await socket.timeout(10_000).emitWithAck('call:invite', { matchId }) as { ok: boolean; reason?: string };
        if (!ack?.ok) {
          finish(ack?.reason === 'unavailable' ? 'unavailable' : 'failed');
          return;
        }
      } catch {
        finish('failed');
        return;
      }
      if (!accepted) ringTimer = later(() => finish('noAnswer', 'call:cancel'), RING_TIMEOUT_MS);
    })();

    return () => {
      socket.off('call:ice', onIce);
      socket.off('call:end', onRemoteEnd);
      socket.off('call:cancelled', onRemoteEnd);
      socket.off('call:accepted', onAccepted);
      socket.off('call:answer', onAnswer);
      socket.off('call:declined', onDeclined);
      socket.off('call:offer', onOffer);
      // Leaving the screen any other way (back gesture) still hangs up.
      if (!finished) hangUpRef.current();
    };
  }, [matchId, user?.id, isCallee]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((tr) => { tr.enabled = !tr.enabled; });
    setIsMuted((m) => !m);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((tr) => { tr.enabled = !tr.enabled; });
    setIsCameraOff((c) => !c);
  };

  const live = callState === 'connected' || callState === 'reconnecting';
  const statusText =
    callState === 'ringing' ? t('video.calling')
      : callState === 'reconnecting' ? t('video.reconnecting')
        : t('video.connecting');

  const endText: Record<EndReason, string> = {
    hangup: t('video.callEnded'),
    remoteHangup: t('video.callEnded'),
    noAnswer: t('video.noAnswer'),
    declined: t('video.declined'),
    busy: t('video.declined'),
    unavailable: t('video.unavailable'),
    missed: t('video.callEnded'),
    failed: t('video.connectionFailed'),
    permission: t('video.permissionDenied'),
    unsupported: t('video.unsupported'),
  };
  const isProblem = endReason === 'failed' || endReason === 'permission' || endReason === 'unsupported' || endReason === 'unavailable';

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: '#000' }}>
      <div className="w-full max-w-[430px] min-h-[100dvh] relative flex flex-col overflow-hidden" style={{ backgroundColor: '#000' }}>

        {/* Remote video (full screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: live ? 'block' : 'none' }}
        />

        {/* Ringing / connecting */}
        {!live && callState !== 'ended' && (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10"
            style={{ background: 'radial-gradient(circle at 50% 40%, rgba(187,131,201,0.2) 0%, transparent 60%)' }}>
            <motion.div
              className="w-28 h-28 rounded-full overflow-hidden mb-4"
              style={{ border: '2px solid rgba(187,131,201,0.5)' }}
              animate={callState === 'ringing' ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={{ duration: 1.4, repeat: callState === 'ringing' ? Infinity : 0, ease: 'easeInOut' }}
            >
              <UserAvatar src={partner.photo} name={partner.name} className="text-5xl" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {partner.name}
            </h2>
            <AnimatePresence mode="wait">
              <motion.p key={statusText}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: "'Outfit', sans-serif" }}>
                {statusText}
              </motion.p>
            </AnimatePresence>
          </div>
        )}

        {/* Name, timer and reconnecting state while in the call */}
        {live && (
          <div className="absolute top-12 left-0 right-0 flex justify-center z-20">
            <span className="text-white text-sm font-medium tabular-nums px-3 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', fontFamily: 'ui-monospace, monospace' }}>
              {partner.name} · {callState === 'reconnecting' ? t('video.reconnecting') : formatTimer(elapsed)}
            </span>
          </div>
        )}

        {/* Own camera. The video element stays mounted: it used to be removed
            when the camera was switched off, and came back black. */}
        {callState !== 'ended' && (
          <div className="absolute z-20 rounded-2xl overflow-hidden"
            style={{ width: 100, height: 140, bottom: 'calc(120px + env(safe-area-inset-bottom))', right: 16, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', backgroundColor: '#1a1a1a' }}>
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            {(isCameraOff || !hasVideo) && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
                <CameraOff size={24} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        {callState !== 'ended' && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-6"
            style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}>
            <motion.button whileTap={{ scale: 0.9 }} transition={{ duration: 0.12 }} onClick={toggleMute}
              aria-label={isMuted ? t('video.unmute') : t('video.mute')}
              className="rounded-full flex items-center justify-center"
              style={{ width: 64, height: 64, backgroundColor: isMuted ? '#E86A6A' : '#FFF', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
              {isMuted ? <MicOff size={26} className="text-white" /> : <Mic size={26} className="text-[var(--charcoal)]" />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} transition={{ duration: 0.12 }} onClick={() => hangUpRef.current()}
              aria-label={t('video.hangUp')}
              className="rounded-full flex items-center justify-center"
              style={{ width: 72, height: 72, backgroundColor: '#E86A6A', boxShadow: '0 4px 24px rgba(232,106,106,0.4)' }}>
              <PhoneOff size={30} className="text-white" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} transition={{ duration: 0.12 }} onClick={toggleCamera}
              disabled={!hasVideo}
              aria-label={isCameraOff ? t('video.cameraOn') : t('video.cameraOff')}
              className="rounded-full flex items-center justify-center"
              style={{ width: 64, height: 64, backgroundColor: isCameraOff || !hasVideo ? '#E86A6A' : '#FFF', opacity: hasVideo ? 1 : 0.6, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
              {isCameraOff || !hasVideo ? <VideoOff size={26} className="text-white" /> : <VideoIcon size={26} className="text-[var(--charcoal)]" />}
            </motion.button>
          </div>
        )}

        {/* Call ended */}
        <AnimatePresence>
          {callState === 'ended' && endReason && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8"
              style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex flex-col items-center gap-5 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: isProblem ? '#F0B84A' : '#E86A6A' }}>
                  <PhoneOff size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {isProblem ? t('video.callFailed') : t('video.callEnded')}
                </h3>
                {wasConnected ? (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'ui-monospace, monospace' }}>
                    {t('video.duration', { time: formatTimer(elapsed) })}
                  </p>
                ) : null}
                {endReason !== 'hangup' && endReason !== 'remoteHangup' && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif" }}>
                    {endText[endReason]}
                  </p>
                )}
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(`/chat/${matchId}`, { replace: true })}
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
