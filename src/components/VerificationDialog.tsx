import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheck, Camera, Check, Clock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { submitVerificationSelfie, getVerificationStatus } from '@/api/users';
import type { VerificationGesture } from '@/api/types';

const GESTURES: VerificationGesture[] = ['blink', 'smile', 'turn_left', 'turn_right'];

/** Random each time so a recording can't simply be replayed. */
function pickGesture(): VerificationGesture {
  return GESTURES[Math.floor(Math.random() * GESTURES.length)];
}

type Status = 'none' | 'pending' | 'approved' | 'rejected';

export default function VerificationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [status, setStatus] = useState<Status>('none');
  const [gesture, setGesture] = useState<VerificationGesture>(pickGesture);
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // streamRef alone doesn't trigger a re-render — the "Enable camera" ->
  // "Record" button switch (both its label and its onClick target) read this
  // instead, so the switch actually happens once the stream is granted.
  const [cameraReady, setCameraReady] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    setError('');
    getVerificationStatus()
      .then((r) => setStatus(r.status))
      .catch(() => {});
    setGesture(pickGesture());
    return stopCamera;
  }, [open, stopCamera]);

  const startCamera = useCallback(async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(t('verification.unsupported', { defaultValue: 'Camera recording is not supported on this device' }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
    } catch {
      setError(t('verification.cameraDenied', { defaultValue: 'Camera access is needed to verify your profile' }));
    }
  }, [t]);

  const record = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const rec = new MediaRecorder(stream);
    recorderRef.current = rec;
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'video/webm' });
      stopCamera();
      if (blob.size === 0) {
        setError(t('verification.failed', { defaultValue: 'Recording failed — please try again' }));
        return;
      }
      setSubmitting(true);
      try {
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `verification-${Date.now()}.${ext}`, { type: blob.type });
        const res = await submitVerificationSelfie(file, gesture);
        setStatus(res.status as Status);
      } catch {
        setError(t('verification.failed', { defaultValue: 'Recording failed — please try again' }));
      } finally {
        setSubmitting(false);
      }
    };
    rec.start();
    setRecording(true);
    setSecondsLeft(3);
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tick);
          setRecording(false);
          if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [gesture, stopCamera, t]);

  const gestureLabel = t(`verification.gesture_${gesture}`, {
    defaultValue: {
      blink: 'Blink slowly',
      smile: 'Smile',
      turn_left: 'Turn your head left',
      turn_right: 'Turn your head right',
    }[gesture],
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={20} style={{ color: '#7DE0B3' }} />
            {t('verification.title', { defaultValue: 'Verify your profile' })}
          </DialogTitle>
        </DialogHeader>

        {status === 'approved' ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(125,224,179,0.15)' }}>
              <Check size={28} style={{ color: '#7DE0B3' }} strokeWidth={2.5} />
            </div>
            <p className="text-sm text-center text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {t('verification.approved', { defaultValue: 'Your profile is verified' })}
            </p>
          </div>
        ) : status === 'pending' ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(240,184,74,0.15)' }}>
              <Clock size={28} style={{ color: '#F0B84A' }} strokeWidth={2.5} />
            </div>
            <p className="text-sm text-center text-[var(--charcoal)] opacity-70" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {t('verification.pending', { defaultValue: 'Your submission is being reviewed' })}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {status === 'rejected' && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(232,106,106,0.12)' }}>
                <X size={16} style={{ color: '#E86A6A' }} />
                <span className="text-xs" style={{ color: '#E86A6A', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  {t('verification.rejected', { defaultValue: 'Previous attempt was rejected — you can try again' })}
                </span>
              </div>
            )}

            <div
              className="relative w-full overflow-hidden rounded-2xl"
              style={{ aspectRatio: '3/4', backgroundColor: 'rgba(var(--linen-rgb), 0.5)' }}
            >
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {recording && (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute top-3 left-3 px-2 py-1 rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: '#E86A6A' }}
                >
                  {secondsLeft}s
                </motion.div>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs uppercase tracking-wider opacity-40 text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {t('verification.doThis', { defaultValue: 'Do this on camera' })}
              </p>
              <p className="text-base font-semibold text-[var(--charcoal)] mt-0.5" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {gestureLabel}
              </p>
            </div>

            {error && (
              <span className="text-xs text-center" style={{ color: '#E86A6A' }}>{error}</span>
            )}

            <button
              onClick={cameraReady ? record : startCamera}
              disabled={recording || submitting}
              className="w-full h-[52px] rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: '#BB83C9', opacity: recording || submitting ? 0.6 : 1 }}
            >
              <Camera size={18} />
              {submitting
                ? t('verification.submitting', { defaultValue: 'Submitting…' })
                : recording
                  ? t('verification.recording', { defaultValue: 'Recording…' })
                  : cameraReady
                    ? t('verification.record', { defaultValue: 'Record' })
                    : t('verification.enableCamera', { defaultValue: 'Enable camera' })}
            </button>

            <p className="text-[11px] text-center opacity-40 text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {t('verification.reviewNote', { defaultValue: 'Reviewed by a moderator. Only they see this recording — it is never shown on your profile.' })}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
