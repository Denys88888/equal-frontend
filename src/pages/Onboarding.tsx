import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ChevronLeft,
  Camera,
  Plus,
  X,
  Heart,
  Coffee,
  Puzzle,
  Compass,
  MapPin,
  PlayCircle,
  Info,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { updateMe, uploadPhoto } from '@/api/users';
/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PersonalityAnswer {
  questionIndex: number;
  optionIndex: number;
}

interface PhotoItem {
  id: string;
  url: string;
  file?: File;
}

interface ProfileData {
  name: string;
  dob: string;
  city: string;
  bio: string;
  bioPrompt: string;
  interests: string[];
  customInterest: string;
  goal: string;
  personalityAnswers: PersonalityAnswer[];
  photos: PhotoItem[];
  videoIntro: string | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_STEPS = 5;

const QUESTIONS = [
  { q: 'onboarding.q1', options: ['onboarding.q1a', 'onboarding.q1b'] },
  { q: 'onboarding.q2', options: ['onboarding.q2a', 'onboarding.q2b'] },
  { q: 'onboarding.q3', options: ['onboarding.q3a', 'onboarding.q3b'] },
  { q: 'onboarding.q4', options: ['onboarding.q4a', 'onboarding.q4b'] },
  { q: 'onboarding.q5', options: ['onboarding.q5a', 'onboarding.q5b'] },
];

const BIO_PROMPTS = ['onboarding.p1', 'onboarding.p2', 'onboarding.p3', 'onboarding.p4'];

// Stored values stay English (backend matching); labels are translated at render
const INTERESTS = [
  'Sports', 'Movies', 'Tech', 'Travel', 'Cooking', 'Music',
  'Reading', 'Gaming', 'Fitness', 'Art', 'Photography', 'Hiking',
  'Dancing', 'Yoga', 'Podcasts', 'Startups', 'Crypto', 'Philosophy',
  'Foodie', 'Wine',
];
const interestKey = (interest: string) => `onboarding.int_${interest.toLowerCase()}`;

const GOALS = [
  { id: 'serious', label: 'onboarding.goalSerious', desc: 'onboarding.goalSeriousDesc', icon: Heart, color: '#BB83C9' },
  { id: 'casual', label: 'onboarding.goalCasual', desc: 'onboarding.goalCasualDesc', icon: Coffee, color: '#7BC4E8' },
  { id: 'interest', label: 'onboarding.goalInterest', desc: 'onboarding.goalInterestDesc', icon: Puzzle, color: '#7DE0B3' },
  { id: 'notsure', label: 'onboarding.goalNotsure', desc: 'onboarding.goalNotsureDesc', icon: Compass, color: '#F0B84A' },
];

const STEP_TITLES = ['onboarding.title1', 'onboarding.title2', 'onboarding.title3', 'onboarding.title4', 'onboarding.title5'];

const STEP_SUBTITLES = ['onboarding.sub1', 'onboarding.sub2', 'onboarding.sub3', 'onboarding.sub4', 'onboarding.sub5'];

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];
const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];
const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '20%' : '-20%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-20%' : '20%',
    opacity: 0,
  }),
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoSlot, setActivePhotoSlot] = useState<number | null>(null);

  const [data, setData] = useState<ProfileData>({
    name: '',
    dob: '',
    city: '',
    bio: '',
    bioPrompt: '',
    interests: [],
    customInterest: '',
    goal: '',
    personalityAnswers: [],
    photos: [],
    videoIntro: null,
  });

  /* ---- helpers ---- */
  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => {
    if (step === 1) {
      navigate('/');
      return;
    }
    setDirection(-1);
    setStep((s) => s - 1);
    window.scrollTo(0, 0);
  }, [step, navigate]);

  const canSkip = step === 2 || step === 4;

  const handleSkip = () => {
    if (canSkip) goNext();
  };

  /* ---- photo handling ---- */
  const handlePhotoAdd = (slotIndex: number) => {
    setActivePhotoSlot(slotIndex);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activePhotoSlot === null) return;
    const url = URL.createObjectURL(file);
    const newPhoto: PhotoItem = { id: `photo-${Date.now()}`, url, file };

    setData((prev) => {
      const photos = [...prev.photos];
      photos[activePhotoSlot] = newPhoto;
      return { ...prev, photos };
    });
    setActivePhotoSlot(null);
    e.target.value = '';
  };

  const handlePhotoRemove = (index: number) => {
    setData((prev) => {
      const photos = [...prev.photos];
      photos.splice(index, 1);
      return { ...prev, photos };
    });
  };

  const videoInputRef = useRef<HTMLInputElement>(null);
  const handleVideoAdd = () => {
    if (data.videoIntro) {
      setData((prev) => ({ ...prev, videoIntro: null }));
    } else {
      videoInputRef.current?.click();
    }
  };
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setData((prev) => ({ ...prev, videoIntro: url }));
  };
  // Revoke object URL on unmount
  useEffect(() => {
    return () => { if (data.videoIntro?.startsWith('blob:')) URL.revokeObjectURL(data.videoIntro); };
  }, [data.videoIntro]);

  /* ---- completion ---- */
  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await updateMe({
        name: data.name || undefined,
        birthDate: data.dob || undefined,
        city: data.city || undefined,
        bio: data.bio || data.bioPrompt || undefined,
        interests: data.interests.length > 0 ? data.interests : undefined,
        goals: data.goal ? [data.goal] : undefined,
      } as Parameters<typeof updateMe>[0]);

      // Upload photos collected during onboarding
      const photosWithFile = data.photos.filter((p) => p?.file);
      for (let i = 0; i < photosWithFile.length; i++) {
        try {
          await uploadPhoto(photosWithFile[i].file!, i === 0);
        } catch {
          // non-critical
        }
      }
    } catch {
      // non-critical — user can update profile later
    }
    setTimeout(() => navigate('/discover'), 1200);
  };

  /* ---- validation ---- */
  const personalityComplete = data.personalityAnswers.length === QUESTIONS.length;
  const hasPhotos = data.photos.length > 0 && data.photos.some((p) => !!p);
  const basicsComplete = data.name.trim().length >= 2 && data.dob.length > 0;
  const interestsComplete = data.interests.length >= 3;
  const goalSelected = data.goal.length > 0;

  const stepValid =
    step === 1 ? personalityComplete :
    step === 2 ? hasPhotos :
    step === 3 ? basicsComplete :
    step === 4 ? interestsComplete :
    step === 5 ? goalSelected :
    false;

  /* ---- render helpers ---- */
  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: '#F7F4EE' }}>
      <div className="w-full max-w-[430px] relative flex flex-col" style={{ backgroundColor: '#F7F4EE' }}>
        {/* ====== Progress Header ====== */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeSmooth }}
          className="sticky top-0 z-40 flex items-center gap-3 px-5"
          style={{
            backgroundColor: 'rgba(247, 244, 238, 0.85)',
            backdropFilter: 'blur(12px)',
            height: 'calc(56px + env(safe-area-inset-top))',
            paddingTop: 'env(safe-area-inset-top)',
            borderBottom: '1px solid rgba(232, 226, 216, 0.6)',
          }}
        >
          {/* Back */}
          <motion.button
            whileTap={step === 1 ? {} : { scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onClick={goBack}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(12px)',
              opacity: step === 1 ? 0.3 : 1,
              pointerEvents: step === 1 ? 'none' : 'auto',
            }}
          >
            <ChevronLeft size={24} className="text-[#232323]" strokeWidth={2} />
          </motion.button>

          {/* Progress Bar */}
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E2D8' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#BB83C9' }}
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3, ease: easeSmooth }}
            />
          </div>

          {/* Skip */}
          <button
            onClick={handleSkip}
            className="flex-shrink-0 text-sm font-medium"
            style={{
              color: 'rgba(35, 35, 35, 0.5)',
              fontFamily: "'Outfit', system-ui, sans-serif",
              opacity: canSkip ? 1 : 0,
              pointerEvents: canSkip ? 'auto' : 'none',
              width: canSkip ? 'auto' : 0,
            }}
          >
            {t('onboarding.skip')}
          </button>
        </motion.header>

        {/* ====== Main Content ====== */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 flex flex-col px-5 pt-6 pb-28">
            {/* Title */}
            {/* AnimatePresence removed: its exit phase hangs in Pi Browser
                (mode="wait" then never mounts the next step). Keyed remount
                with enter-only animation is reliable. */}
              <motion.div
                key={`title-${step}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                transition={{ duration: 0.35, ease: easeOutExpo }}
              >
                <h1
                  className="text-[28px] font-semibold text-[#232323] leading-tight tracking-tight"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.84px' }}
                >
                  {t(STEP_TITLES[step - 1])}
                </h1>
                <p
                  className="mt-2 text-base"
                  style={{ color: 'rgba(35, 35, 35, 0.6)', fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {t(STEP_SUBTITLES[step - 1])}
                </p>
              </motion.div>

            {/* Step Content */}
            <div className="mt-6 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

                <motion.div
                  key={`step-${step}`}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  transition={{ duration: 0.35, ease: easeOutExpo }}
                  className="flex flex-col gap-6"
                >
                  {step === 1 && (
                    <StepPersonality
                      data={data}
                      update={update}
                    />
                  )}
                  {step === 2 && (
                    <StepPhotos
                      data={data}
                      update={update}
                      onPhotoAdd={handlePhotoAdd}
                      onPhotoRemove={handlePhotoRemove}
                      onVideoAdd={handleVideoAdd}
                      videoInputRef={videoInputRef}
                      onVideoFileChange={handleVideoFileChange}
                    />
                  )}
                  {step === 3 && (
                    <StepBasics
                      data={data}
                      update={update}
                    />
                  )}
                  {step === 4 && (
                    <StepBioInterests
                      data={data}
                      update={update}
                    />
                  )}
                  {step === 5 && (
                    <StepGoals
                      data={data}
                      update={update}
                    />
                  )}
                </motion.div>
            </div>
          </div>
        </main>

        {/* ====== Completion Flash ====== */}
        <AnimatePresence>
          {isCompleting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 z-[300] pointer-events-none"
              style={{ backgroundColor: '#BB83C9' }}
            />
          )}
        </AnimatePresence>

        {/* ====== Continue Button ====== */}
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        >
          <div className="w-full max-w-[430px] px-5 py-4" style={{ backgroundColor: '#F7F4EE' }}>
            <motion.button
              whileTap={stepValid ? { scale: 0.97 } : {}}
              transition={{ duration: 0.08 }}
              onClick={step === 5 ? handleComplete : goNext}
              disabled={!stepValid}
              className="w-full h-14 rounded-full font-semibold text-base text-white transition-colors"
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                backgroundColor: stepValid ? '#BB83C9' : '#E8E2D8',
                opacity: stepValid ? 1 : 0.4,
                boxShadow: stepValid ? '0 4px 16px rgba(187,131,201,0.3)' : 'none',
                cursor: stepValid ? 'pointer' : 'not-allowed',
              }}
            >
              {isCompleting ? t('onboarding.welcome') : step === 5 ? t('onboarding.finish') : t('onboarding.next')}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 1 — Personality Questions                                   */
/* ================================================================== */

function StepPersonality({
  data,
  update,
}: {
  data: ProfileData;
  update: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
}) {
  const { t } = useTranslation();
  const currentQIndex = data.personalityAnswers.length;
  const currentQ = QUESTIONS[currentQIndex] ?? QUESTIONS[QUESTIONS.length - 1];
  const isComplete = data.personalityAnswers.length === QUESTIONS.length;

  const handleSelect = (optionIndex: number) => {
    if (isComplete) return;
    const newAnswers = [
      ...data.personalityAnswers,
      { questionIndex: currentQIndex, optionIndex },
    ];
    update('personalityAnswers', newAnswers);
  };

  const currentAnswer = data.personalityAnswers.find(
    (a) => a.questionIndex === currentQIndex
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Question card */}
      <div>
        {!isComplete ? (
          <motion.div
            key={`q-${currentQIndex}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: easeOutExpo }}
            className="flex flex-col gap-4"
          >
            {/* Question */}
            <div
              className="w-full rounded-[20px] p-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              <p
                className="text-lg font-semibold text-[#232323] mb-4"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.54px' }}
              >
                {t(currentQ.q)}
              </p>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {currentQ.options.map((opt, i) => {
                  const isSelected = currentAnswer?.optionIndex === i;
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.1 }}
                      onClick={() => handleSelect(i)}
                      className="w-full rounded-2xl h-16 font-semibold text-base text-center transition-all"
                      style={{
                        fontFamily: "'Outfit', system-ui, sans-serif",
                        backgroundColor: isSelected ? 'rgba(187,131,201,0.08)' : 'rgba(232,226,216,0.3)',
                        border: isSelected ? '2px solid #BB83C9' : '2px solid transparent',
                        color: isSelected ? '#BB83C9' : '#232323',
                        opacity: currentAnswer && !isSelected ? 0.5 : 1,
                      }}
                    >
                      {t(opt)}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-4"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#A8EBCC' }}
            >
              <Check size={32} style={{ color: '#5BC492' }} strokeWidth={2.5} />
            </div>
            <p
              className="text-xl font-semibold text-[#232323]"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {t('onboarding.allAnswered')}
            </p>
          </motion.div>
        )}
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2">
        {QUESTIONS.map((_, i) => {
          const isCompleted = i < data.personalityAnswers.length;
          const isCurrent = i === currentQIndex && !isComplete;
          return (
            <motion.div
              key={i}
              animate={isCurrent ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3, ease: easeSpring }}
              className="w-2 h-2 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isCompleted ? '#7DE0B3' : isCurrent ? '#BB83C9' : '#E8E2D8',
                width: isCompleted ? 20 : 8,
                height: isCompleted ? 20 : 8,
              }}
            >
              {isCompleted && (
                <Check size={12} className="text-white" strokeWidth={3} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 2 — Photo Upload                                            */
/* ================================================================== */

function StepPhotos({
  data,
  onPhotoAdd,
  onPhotoRemove,
  onVideoAdd,
  videoInputRef,
  onVideoFileChange,
}: {
  data: ProfileData;
  update: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onPhotoAdd: (slotIndex: number) => void;
  onPhotoRemove: (index: number) => void;
  onVideoAdd: () => void;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  onVideoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useTranslation();
  const photos = data.photos;
  const emptySlots = Math.max(0, 9 - photos.length);
  const gridItems: (PhotoItem | null)[] = [
    ...photos,
    ...Array(emptySlots).fill(null),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Photo tips card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: easeOutExpo }}
        className="w-full rounded-2xl p-4 flex items-start gap-3"
        style={{ backgroundColor: 'rgba(168,235,204,0.3)' }}
      >
        <Info size={20} style={{ color: '#5BC492', flexShrink: 0, marginTop: 2 }} />
        <p
          className="text-sm font-medium"
          style={{ color: '#5BC492', fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('onboarding.photoTip')}
        </p>
      </motion.div>

      {/* Photo grid */}
      <Reorder.Group
        axis="y"
        values={gridItems}
        onReorder={() => {
          // Photo reordering would update state here
        }}
        className="grid grid-cols-3 gap-2"
        style={{ listStyle: 'none' }}
      >
        {gridItems.map((item, index) => (
          <Reorder.Item
            key={item ? item.id : `empty-${index}`}
            value={item}
            className="relative aspect-square"
            style={{ borderRadius: 12, overflow: 'hidden' }}
            drag={false}
          >
            {item ? (
              <div className="relative w-full h-full">
                <img
                  src={item.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: 12 }}
                />
                {index === 0 && (
                  <span
                    className="absolute top-2 left-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: '#BB83C9',
                      color: '#FFFFFF',
                      fontFamily: "'Outfit', system-ui, sans-serif",
                      letterSpacing: '0.44px',
                    }}
                  >
                    {t('onboarding.main')}
                  </span>
                )}
                <button
                  onClick={() => onPhotoRemove(index)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(35,35,35,0.6)' }}
                >
                  <X size={14} className="text-white" strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                onClick={() => onPhotoAdd(index)}
                className="w-full h-full flex flex-col items-center justify-center gap-1 rounded-xl"
                style={{
                  border: '2px dashed #E8E2D8',
                  backgroundColor: 'rgba(232,226,216,0.2)',
                }}
              >
                <Camera size={24} style={{ color: 'rgba(35,35,35,0.3)' }} />
                <span
                  className="text-xs font-medium"
                  style={{ color: 'rgba(35,35,35,0.3)', fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {t('onboarding.add')}
                </span>
              </motion.button>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Video intro toggle */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        onClick={onVideoAdd}
        className="w-full h-12 rounded-full flex items-center justify-center gap-2 font-semibold text-base"
        style={{
          fontFamily: "'Outfit', system-ui, sans-serif",
          backgroundColor: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(35,35,35,0.1)',
          color: '#232323',
        }}
      >
        {data.videoIntro ? (
          <>
            <X size={20} strokeWidth={2} />
            {t('onboarding.removeVideo')}
          </>
        ) : (
          <>
            <PlayCircle size={20} strokeWidth={2} />
            {t('onboarding.addVideo')}
          </>
        )}
      </motion.button>

      {/* Hidden video file input */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={onVideoFileChange}
      />

      {data.videoIntro && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-xl overflow-hidden"
          style={{ backgroundColor: '#232323', aspectRatio: '16/9' }}
        >
          <video
            src={data.videoIntro}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
          <button
            onClick={onVideoAdd}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(35,35,35,0.6)' }}
          >
            <X size={14} className="text-white" strokeWidth={2.5} />
          </button>
        </motion.div>
      )}

      {/* Onboarding illustration */}
      <div className="flex justify-center mt-2">
        <img
          src="./onboarding-photo.png"
          alt="Photo tips"
          className="w-40 h-40 object-contain rounded-2xl"
          style={{ opacity: 0.8 }}
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 3 — Basic Information                                       */
/* ================================================================== */

function StepBasics({
  data,
  update,
}: {
  data: ProfileData;
  update: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
}) {
  const { t } = useTranslation();
  const [nameError, setNameError] = useState('');
  const [dobError, setDobError] = useState('');

  const handleNameChange = (val: string) => {
    update('name', val);
    if (val.trim().length >= 2) setNameError('');
  };

  const handleDobChange = (val: string) => {
    update('dob', val);
    if (val) {
      const birthDate = new Date(val);
      const age = Math.floor((Date.now() - birthDate.getTime()) / 31557600000);
      if (age >= 18) setDobError('');
    }
  };

  const handleNameBlur = () => {
    if (data.name.trim().length < 2) {
      setNameError(t('onboarding.nameError'));
    }
  };

  const handleDobBlur = () => {
    if (data.dob) {
      const birthDate = new Date(data.dob);
      const age = Math.floor((Date.now() - birthDate.getTime()) / 31557600000);
      if (age < 18) setDobError(t('onboarding.dobError'));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-semibold text-[#232323]"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '0.44px' }}
        >
          {t('onboarding.yourName')}
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={handleNameBlur}
          placeholder={t('onboarding.namePlaceholder')}
          className="w-full h-[52px] rounded-xl px-4 text-base outline-none transition-all"
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            backgroundColor: 'rgba(232,226,216,0.4)',
            border: nameError ? '1.5px solid #E86A6A' : '1.5px solid transparent',
            color: '#232323',
          }}
        />
        {nameError && (
          <span className="text-xs font-medium" style={{ color: '#E86A6A' }}>
            {nameError}
          </span>
        )}
      </div>

      {/* DOB */}
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-semibold text-[#232323]"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '0.44px' }}
        >
          {t('onboarding.dob')}
        </label>
        <input
          type="date"
          value={data.dob}
          onChange={(e) => handleDobChange(e.target.value)}
          onBlur={handleDobBlur}
          className="w-full h-[52px] rounded-xl px-4 text-base outline-none transition-all"
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            backgroundColor: 'rgba(232,226,216,0.4)',
            border: dobError ? '1.5px solid #E86A6A' : '1.5px solid transparent',
            color: '#232323',
            colorScheme: 'light',
          }}
        />
        {dobError && (
          <span className="text-xs font-medium" style={{ color: '#E86A6A' }}>
            {dobError}
          </span>
        )}
      </div>

      {/* City */}
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-semibold text-[#232323]"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '0.44px' }}
        >
          {t('onboarding.yourCity')}
        </label>
        <div className="relative">
          <MapPin
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(35,35,35,0.3)' }}
          />
          <input
            type="text"
            value={data.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder={t('onboarding.cityPlaceholder')}
            className="w-full h-[52px] rounded-xl pl-11 pr-4 text-base outline-none transition-all"
            style={{
              fontFamily: "'Outfit', system-ui, sans-serif",
              backgroundColor: 'rgba(232,226,216,0.4)',
              border: '1.5px solid transparent',
              color: '#232323',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 4 — Bio & Interests                                         */
/* ================================================================== */

function StepBioInterests({
  data,
  update,
}: {
  data: ProfileData;
  update: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
}) {
  const { t } = useTranslation();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const toggleInterest = (interest: string) => {
    const next = data.interests.includes(interest)
      ? data.interests.filter((i) => i !== interest)
      : [...data.interests, interest];
    update('interests', next);
  };

  const addCustomInterest = () => {
    const trimmed = customValue.trim();
    if (trimmed && !data.interests.includes(trimmed)) {
      update('interests', [...data.interests, trimmed]);
    }
    setCustomValue('');
    setShowCustomInput(false);
  };

  const selectPrompt = (prompt: string) => {
    update('bioPrompt', prompt);
    update('bio', prompt + ' ');
  };

  const bioLen = data.bio.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Bio prompt selector */}
      <div className="flex flex-col gap-3">
        <p
          className="text-sm font-semibold text-[#232323]"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '0.44px' }}
        >
          {t('onboarding.bioPrompt')}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          {BIO_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => selectPrompt(prompt)}
              className="flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                backgroundColor: data.bioPrompt === prompt ? '#BB83C9' : '#E8E2D8',
                color: data.bioPrompt === prompt ? '#FFFFFF' : '#232323',
              }}
            >
              {t(prompt)}
            </button>
          ))}
        </div>
      </div>

      {/* Bio textarea */}
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-semibold text-[#232323]"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '0.44px' }}
        >
          {t('onboarding.yourBio')}
        </label>
        <div className="relative">
          <textarea
            value={data.bio}
            onChange={(e) => {
              if (e.target.value.length <= 500) update('bio', e.target.value);
            }}
            placeholder={t('onboarding.bioPlaceholder')}
            className="w-full min-h-[120px] rounded-2xl p-4 text-base outline-none resize-none transition-all"
            style={{
              fontFamily: "'Outfit', system-ui, sans-serif",
              backgroundColor: 'rgba(232,226,216,0.4)',
              border: '1.5px solid transparent',
              color: '#232323',
            }}
          />
          <span
            className="absolute bottom-3 right-3 text-xs font-medium"
            style={{ color: 'rgba(35,35,35,0.35)' }}
          >
            {bioLen}/500
          </span>
        </div>
        <p className="text-xs font-medium" style={{ color: '#5BC492' }}>
          {t('onboarding.bioBoost')}
        </p>
      </div>

      {/* Interests */}
      <div className="flex flex-col gap-3">
        <div>
          <p
            className="text-sm font-semibold text-[#232323]"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '0.44px' }}
          >
            {t('onboarding.yourInterests')}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'rgba(35,35,35,0.6)' }}>
            {t('onboarding.pick3')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const isSelected = data.interests.includes(interest);
            return (
              <motion.button
                key={interest}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: easeSpring }}
                onClick={() => toggleInterest(interest)}
                className="px-3.5 py-2 rounded-full text-xs font-medium transition-colors"
                style={{
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  backgroundColor: isSelected ? '#BB83C9' : '#E8E2D8',
                  color: isSelected ? '#FFFFFF' : '#232323',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {t(interestKey(interest), { defaultValue: interest })}
              </motion.button>
            );
          })}

          {/* Custom interest */}
          {showCustomInput ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
                placeholder={t('onboarding.yourInterest')}
                autoFocus
                className="h-9 px-3 rounded-full text-xs font-medium outline-none"
                style={{
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  backgroundColor: 'rgba(232,226,216,0.4)',
                  border: '1.5px solid #BB83C9',
                  color: '#232323',
                  width: 140,
                }}
              />
              <button
                onClick={addCustomInterest}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#BB83C9' }}
              >
                <Plus size={16} className="text-white" strokeWidth={2.5} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCustomInput(true)}
              className="px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-1"
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                backgroundColor: 'rgba(187,131,201,0.15)',
                color: '#BB83C9',
                border: '1.5px dashed #BB83C9',
              }}
            >
              <Plus size={14} strokeWidth={2} />
              {t('onboarding.addYourOwn')}
            </motion.button>
          )}
        </div>

        {data.interests.length > 0 && data.interests.length < 3 && (
          <p className="text-xs font-medium" style={{ color: '#F0B84A' }}>
            {t('onboarding.selectMore', { count: 3 - data.interests.length })}
          </p>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 5 — Dating Goals                                            */
/* ================================================================== */

function StepGoals({
  data,
  update,
}: {
  data: ProfileData;
  update: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center justify-center flex-1 gap-6"
      style={{
        background:
          'radial-gradient(circle at 30% 30%, rgba(187,131,201,0.2), transparent 60%), radial-gradient(circle at 70% 70%, rgba(125,224,179,0.15), transparent 60%)',
        margin: '0 -20px',
        padding: '0 20px',
        minHeight: '50vh',
      }}
    >
      <div className="text-center mb-2">
        <p className="text-base" style={{ color: 'rgba(35,35,35,0.6)' }}>
          {t('onboarding.sub5')}
        </p>
      </div>

      {/* Goal cards grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {GOALS.map((goal, index) => {
          const Icon = goal.icon;
          const isSelected = data.goal === goal.id;
          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
                ease: easeOutExpo,
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => update('goal', goal.id)}
              className="flex flex-col items-center justify-center gap-3 rounded-[20px] p-6 transition-all"
              style={{
                backgroundColor: '#FFFFFF',
                border: isSelected ? `2px solid ${goal.color}` : '2px solid transparent',
                background: isSelected ? `rgba(${hexToRgb(goal.color)}, 0.06)` : '#FFFFFF',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isSelected ? goal.color : 'rgba(232,226,216,0.4)',
                }}
              >
                <Icon
                  size={20}
                  className={isSelected ? 'text-white' : ''}
                  style={{ color: isSelected ? '#FFFFFF' : goal.color }}
                  strokeWidth={2}
                />
              </div>
              <p
                className="text-lg font-semibold text-[#232323] text-center"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.54px' }}
              >
                {t(goal.label)}
              </p>
              <p
                className="text-xs text-center"
                style={{ color: 'rgba(35,35,35,0.5)' }}
              >
                {t(goal.desc)}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Utility: hex to rgb                                               */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '187, 131, 201';
}
