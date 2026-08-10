import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mic, Play, Save, RotateCcw, Square } from 'lucide-react';
import { uploadVoiceIntro } from '@/api/dailyMatch';
import { useToast } from '@/hooks/useToast';

/** Fixed clip length, per spec. */
const CLIP_MS = 10_000;
const BAR_COUNT = 7;

/**
 * Records a fixed 10-second voice intro.
 *
 * A voice intro is mandatory for Daily Match — a profile without one is
 * excluded from matching server-side, so this is surfaced during onboarding
 * and in the profile editor rather than buried in settings.
 */
export default function VoiceIntroRecorder({
  existingUrl,
  onSaved,
}: {
  existingUrl?: string | null;
  onSaved?: (url: string) => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Object URLs leak if not revoked; also stop any live mic track on unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      recorderRef.current?.stream.getTracks().forEach((tr) => tr.stop());
    };
  }, [previewUrl]);

  const stopRecording = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    const rec = recorderRef.current;
    if (rec && rec.state === 'recording') rec.stop();
  }, []);

  const startRecording = useCallback(async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(t('chat.voiceUnsupported', { defaultValue: 'Voice recording is not supported on this device' }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Opus in WebM is what the spec asks for; Safari only offers mp4, so fall
      // back rather than throwing and leaving the user with a dead button.
      const preferred = 'audio/webm;codecs=opus';
      const mimeType = MediaRecorder.isTypeSupported(preferred) ? preferred : '';
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const recorded = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setRecording(false);
        setSecondsLeft(0);
        if (recorded.size === 0) {
          setError(t('chat.voiceFailed', { defaultValue: 'Recording failed — please try again' }));
          return;
        }
        setBlob(recorded);
        setPreviewUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(recorded);
        });
      };

      rec.start();
      setRecording(true);
      setSecondsLeft(CLIP_MS / 1000);
      stopTimerRef.current = setTimeout(stopRecording, CLIP_MS);
    } catch {
      setError(t('chat.micDenied', { defaultValue: 'Microphone access is needed to record a voice intro' }));
    }
  }, [stopRecording, t]);

  // Countdown display, driven separately from the hard stop timer.
  useEffect(() => {
    if (!recording) return;
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tick);
  }, [recording]);

  const handleSave = async () => {
    if (!blob) return;
    setSaving(true);
    try {
      const { voiceIntroUrl } = await uploadVoiceIntro(blob);
      showToast('success', t('dailyMatch.voiceSaved', { defaultValue: 'Voice intro saved' }));
      onSaved?.(voiceIntroUrl);
      setBlob(null);
    } catch {
      showToast('error', t('dailyMatch.voiceFailed', { defaultValue: "Couldn't save voice intro" }));
    } finally {
      setSaving(false);
    }
  };

  const playbackSrc = previewUrl ?? existingUrl ?? null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Mic size={18} className="text-[#BB83C9]" />
        <h3 className="text-sm font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {t('dailyMatch.voiceIntroTitle', { defaultValue: 'Voice intro' })}
        </h3>
      </div>
      <p className="text-xs text-[var(--charcoal)]/50 mb-3">
        {t('dailyMatch.voiceIntroRequired', { defaultValue: "Required — profiles without a voice intro aren't matched" })}
      </p>

      {/* Waveform: purely decorative, animated only while recording */}
      <div className="flex items-end justify-center gap-1.5 h-14 mb-3">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            className="w-2 rounded-full"
            style={{ backgroundColor: recording ? '#BB83C9' : 'var(--linen-dark)' }}
            animate={recording ? { height: [12, 44, 20, 38, 14] } : { height: 12 }}
            transition={recording ? { duration: 0.9, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' } : { duration: 0.2 }}
          />
        ))}
      </div>

      {recording && (
        <p className="text-center text-sm font-semibold text-[#E86A6A] mb-3">
          {t('dailyMatch.recording', { defaultValue: 'Recording…' })} {secondsLeft}s
        </p>
      )}

      {error && <p className="text-xs text-center mb-2" style={{ color: '#E86A6A' }}>{error}</p>}

      {playbackSrc && !recording && (
        <audio ref={audioRef} src={playbackSrc} controls className="w-full mb-3 h-9" />
      )}

      <div className="flex gap-2">
        {!recording && !blob && (
          <button
            onClick={startRecording}
            className="flex-1 h-11 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: '#BB83C9' }}
          >
            <Mic size={16} />
            {existingUrl
              ? t('dailyMatch.reRecord', { defaultValue: 'Re-record' })
              : t('dailyMatch.record', { defaultValue: 'Record 10s' })}
          </button>
        )}

        {recording && (
          <button
            onClick={stopRecording}
            className="flex-1 h-11 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: '#E86A6A' }}
          >
            <Square size={16} />
            {t('dailyMatch.recording', { defaultValue: 'Recording…' })}
          </button>
        )}

        {blob && !recording && (
          <>
            <button
              onClick={() => audioRef.current?.play()}
              className="flex-1 h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 border-[1.5px]"
              style={{ borderColor: 'var(--linen-dark)', color: 'var(--charcoal)' }}
            >
              <Play size={16} />
              {t('dailyMatch.playback', { defaultValue: 'Play' })}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: '#7DE0B3', color: 'var(--charcoal)', opacity: saving ? 0.6 : 1 }}
            >
              <Save size={16} />
              {t('dailyMatch.saveVoice', { defaultValue: 'Save' })}
            </button>
            <button
              onClick={startRecording}
              aria-label={t('dailyMatch.reRecord', { defaultValue: 'Re-record' })}
              className="w-11 h-11 rounded-full flex items-center justify-center border-[1.5px]"
              style={{ borderColor: 'var(--linen-dark)', color: 'var(--charcoal)' }}
            >
              <RotateCcw size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
