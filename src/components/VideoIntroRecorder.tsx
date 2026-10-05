import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Video as VideoIcon, Circle, Square, RotateCcw, Save, Trash2, X, Upload } from 'lucide-react';
import { uploadVideoIntro, deleteVideoIntro } from '@/api/users';
import { useToast } from '@/hooks/useToast';
import { recordedVideoMime, videoPoster } from '@/lib/video';

/** Length the app records. The server accepts up to 30 s for picked files. */
const CLIP_MS = 15_000;
const MAX_FILE_SECONDS = 30;
const MAX_FILE_BYTES = 30 * 1024 * 1024;

type Phase = 'idle' | 'camera' | 'recording' | 'review' | 'saving';

/**
 * Records a short video intro in the app and saves it to the profile.
 *
 * The onboarding version this replaces only previewed a picked file on the
 * phone — nothing was uploaded and no screen ever showed it. Phones that
 * cannot record in a web view (no MediaRecorder) pick a file instead.
 */
export default function VideoIntroRecorder({
  existingUrl,
  onChange,
}: {
  existingUrl?: string | null;
  onChange?: (url: string | null) => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [phase, setPhase] = useState<Phase>('idle');
  // What this card saved or removed; until then, whatever the profile has.
  const [localUrl, setLocalUrl] = useState<string | null | undefined>(undefined);
  const savedUrl = localUrl !== undefined ? localUrl : existingUrl ?? null;
  const [clip, setClip] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(CLIP_MS / 1000);
  const [error, setError] = useState('');

  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };
  const clearTimers = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (stopRef.current) clearTimeout(stopRef.current);
    tickRef.current = null;
    stopRef.current = null;
  };

  useEffect(() => () => {
    clearTimers();
    stopStream();
  }, []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // The live <video> mounts with the camera phase; give it the stream then.
  useEffect(() => {
    const el = liveRef.current;
    if ((phase === 'camera' || phase === 'recording') && el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, [phase]);

  const canRecord = typeof window !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== 'undefined';

  const showClip = (blob: Blob) => {
    setClip(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setPhase('review');
  };

  const openCamera = async () => {
    setError('');
    if (!canRecord) {
      fileRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      setPhase('camera');
    } catch {
      setError(t('videoIntro.cameraDenied'));
    }
  };

  const closeCamera = () => {
    clearTimers();
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    stopStream();
    setPhase('idle');
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mimeType = recordedVideoMime();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 1_500_000 });
    } catch {
      rec = new MediaRecorder(stream);
    }
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      clearTimers();
      stopStream();
      const type = (rec.mimeType || mimeType || 'video/webm').split(';')[0];
      const blob = new Blob(chunksRef.current, { type });
      if (blob.size === 0) {
        setPhase('idle');
        setError(t('videoIntro.failed'));
        return;
      }
      showClip(blob);
    };
    recorderRef.current = rec;
    rec.start(250);
    setSecondsLeft(CLIP_MS / 1000);
    setPhase('recording');
    const startedAt = Date.now();
    tickRef.current = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((CLIP_MS - (Date.now() - startedAt)) / 1000)));
    }, 250);
    stopRef.current = setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, CLIP_MS);
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError(t('videoIntro.tooBig'));
      return;
    }
    const probe = document.createElement('video');
    const url = URL.createObjectURL(file);
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (Number.isFinite(probe.duration) && probe.duration > MAX_FILE_SECONDS) setError(t('videoIntro.tooLong'));
      else showClip(file);
    };
    // Some formats (HEVC on Android) can't be probed here; the server checks.
    probe.onerror = () => { URL.revokeObjectURL(url); showClip(file); };
    probe.src = url;
  };

  const save = async () => {
    if (!clip) return;
    setPhase('saving');
    setError('');
    try {
      const { videoIntroUrl } = await uploadVideoIntro(clip);
      setLocalUrl(videoIntroUrl);
      setClip(null);
      setPreviewUrl(null);
      setPhase('idle');
      onChange?.(videoIntroUrl);
      showToast('success', t('videoIntro.saved'));
    } catch (err) {
      const { status, message } = (err ?? {}) as { status?: number; message?: string };
      setError(/seconds/i.test(message ?? '') ? t('videoIntro.tooLong') : status === 413 ? t('videoIntro.tooBig') : t('videoIntro.failed'));
      setPhase('review');
    }
  };

  const retake = () => {
    setClip(null);
    setPreviewUrl(null);
    void openCamera();
  };

  const remove = async () => {
    setError('');
    try {
      await deleteVideoIntro();
      setLocalUrl(null);
      onChange?.(null);
      showToast('success', t('videoIntro.removed'));
    } catch {
      setError(t('videoIntro.failed'));
    }
  };

  const pill = 'h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2';
  const outline = { borderColor: 'var(--linen-dark)', color: 'var(--charcoal)' } as const;
  const live = phase === 'camera' || phase === 'recording';

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-2 mb-1">
        <VideoIcon size={18} className="text-[#BB83C9]" />
        <h3 className="text-sm font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {t('videoIntro.title')}
        </h3>
      </div>
      <p className="text-xs text-[var(--charcoal)]/50 mb-3">{t('videoIntro.subtitle')}</p>

      {/* Camera, recorded clip, or the saved video */}
      {(live || previewUrl || (savedUrl && phase === 'idle')) && (
        <div className="relative rounded-xl overflow-hidden mb-3 mx-auto" style={{ backgroundColor: '#000', aspectRatio: '3 / 4', maxHeight: 380 }}>
          {live && (
            <video ref={liveRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          )}
          {!live && previewUrl && (
            <video src={previewUrl} controls playsInline className="w-full h-full object-contain" />
          )}
          {!live && !previewUrl && savedUrl && (
            <video src={savedUrl} poster={videoPoster(savedUrl)} controls playsInline preload="metadata" className="w-full h-full object-contain" />
          )}
          {phase === 'recording' && (
            <div className="absolute top-3 left-0 right-0 flex justify-center">
              <span className="px-3 py-1 rounded-full text-sm font-semibold text-white flex items-center gap-1.5" style={{ backgroundColor: 'rgba(232,106,106,0.9)' }}>
                <motion.span className="w-2 h-2 rounded-full bg-white" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                {t('videoIntro.recording', { s: secondsLeft })}
              </span>
            </div>
          )}
          {phase === 'camera' && (
            <button onClick={closeCamera} aria-label={t('videoIntro.cancel')}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <X size={16} className="text-white" />
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-center mb-2" style={{ color: '#E86A6A' }}>{error}</p>}

      <div className="flex gap-2">
        {phase === 'idle' && (
          <>
            <button onClick={openCamera} className={`flex-1 ${pill} text-white`} style={{ backgroundColor: '#BB83C9' }}>
              {canRecord ? <VideoIcon size={16} /> : <Upload size={16} />}
              {savedUrl ? t('videoIntro.rerecord') : canRecord ? t('videoIntro.record') : t('videoIntro.chooseFile')}
            </button>
            {savedUrl && (
              <button onClick={remove} aria-label={t('videoIntro.remove')} className="w-11 h-11 rounded-full flex items-center justify-center border-[1.5px]" style={outline}>
                <Trash2 size={16} />
              </button>
            )}
          </>
        )}

        {phase === 'camera' && (
          <button onClick={startRecording} className={`flex-1 ${pill} text-white`} style={{ backgroundColor: '#E86A6A' }}>
            <Circle size={16} fill="currentColor" />
            {t('videoIntro.startRecording')}
          </button>
        )}

        {phase === 'recording' && (
          <button onClick={stopRecording} className={`flex-1 ${pill} text-white`} style={{ backgroundColor: '#E86A6A' }}>
            <Square size={16} />
            {t('videoIntro.stop')}
          </button>
        )}

        {(phase === 'review' || phase === 'saving') && (
          <>
            <button onClick={save} disabled={phase === 'saving'} className={`flex-1 ${pill}`}
              style={{ backgroundColor: '#7DE0B3', color: 'var(--charcoal)', opacity: phase === 'saving' ? 0.6 : 1 }}>
              <Save size={16} />
              {phase === 'saving' ? t('videoIntro.saving') : t('videoIntro.save')}
            </button>
            <button onClick={retake} disabled={phase === 'saving'} aria-label={t('videoIntro.retake')}
              className="w-11 h-11 rounded-full flex items-center justify-center border-[1.5px]" style={outline}>
              <RotateCcw size={16} />
            </button>
          </>
        )}
      </div>

      <input ref={fileRef} type="file" accept="video/*" capture="user" className="hidden" onChange={onFilePicked} />
    </div>
  );
}
