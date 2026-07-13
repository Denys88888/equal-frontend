import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getEvents } from '@/api/events';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Check,
  Star,
  X,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface Attendee {
  id: string;
  name: string;
  initials: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  day: string;
  month: string;
  time: string;
  location: string;
  venue: string;
  category: string;
  price: number;
  image: string;
  attendees: Attendee[];
  maxAttendees: number;
  featured?: boolean;
}

/* ------------------------------------------------------------------ */
/*  CATEGORY CONFIG                                                    */
/* ------------------------------------------------------------------ */

const categoryColors: Record<string, string> = {
  'Speed Dating': '#BB83C9',
  'Social Mixers': '#7BC4E8',
  Outdoor: '#7DE0B3',
  Workshops: '#F0B84A',
  Parties: '#9A63A8',
  Wellness: '#5BC492',
};

const categories = ['All', 'Speed Dating', 'Social Mixers', 'Outdoor', 'Workshops', 'Parties'];

/* ------------------------------------------------------------------ */
/*  MOCK DATA                                                          */
/* ------------------------------------------------------------------ */

const MOCK_EVENTS: EventItem[] = [
  {
    id: 'e1',
    title: 'Summer Singles Mixer at The Gallery',
    description: 'Join us for an elegant evening of art, wine, and meaningful connections at The Gallery downtown. Mingle with like-minded singles in a sophisticated atmosphere featuring live jazz, curated wine pairings, and guided conversation prompts to break the ice. Dress code: smart casual.',
    date: 'Sat, Dec 14',
    day: '14',
    month: 'DEC',
    time: '7:00 PM - 10:00 PM',
    location: 'The Gallery, Downtown',
    venue: 'The Gallery',
    category: 'Social Mixers',
    price: 0,
    image: '/event-featured.jpg',
    attendees: [
      { id: 'a1', name: 'Sarah', initials: 'SC' },
      { id: 'a2', name: 'Jake', initials: 'JM' },
      { id: 'a3', name: 'Priya', initials: 'PP' },
      { id: 'a4', name: 'Lucas', initials: 'LK' },
    ],
    maxAttendees: 80,
    featured: true,
  },
  {
    id: 'e2',
    title: 'Speed Dating Night - Ages 25-35',
    description: 'A fun, fast-paced evening where you\'ll meet 10-15 potential matches in 5-minute rounds. At the end, mark your favorites on our app — mutual matches get connected! Includes one complimentary drink and light appetizers.',
    date: 'Thu, Dec 12',
    day: '12',
    month: 'DEC',
    time: '6:30 PM - 9:00 PM',
    location: 'Velvet Lounge, Midtown',
    venue: 'Velvet Lounge',
    category: 'Speed Dating',
    price: 5,
    image: '/event-speed-dating.jpg',
    attendees: [
      { id: 'a1', name: 'Sarah', initials: 'SC' },
      { id: 'a5', name: 'Emma', initials: 'EW' },
      { id: 'a6', name: 'Diego', initials: 'DL' },
    ],
    maxAttendees: 30,
  },
  {
    id: 'e3',
    title: 'Sunset Ridge Trail Hike',
    description: 'A moderate 4-mile group hike along the scenic Sunset Ridge with panoramic ocean views. Perfect for nature lovers and fitness enthusiasts. We\'ll stop at the summit for a picnic and group photos. Bring water, sunscreen, and comfortable shoes.',
    date: 'Sun, Dec 15',
    day: '15',
    month: 'DEC',
    time: '8:00 AM - 12:00 PM',
    location: 'Sunset Ridge Trailhead, Marin',
    venue: 'Sunset Ridge Trailhead',
    category: 'Outdoor',
    price: 0,
    image: '/event-hiking.jpg',
    attendees: [
      { id: 'a4', name: 'Lucas', initials: 'LK' },
      { id: 'a7', name: 'Ava', initials: 'AJ' },
      { id: 'a8', name: 'Noah', initials: 'NB' },
      { id: 'a2', name: 'Jake', initials: 'JM' },
      { id: 'a1', name: 'Sarah', initials: 'SC' },
    ],
    maxAttendees: 25,
  },
  {
    id: 'e4',
    title: 'Rooftop New Year Eve Party',
    description: 'Ring in the new year at the city\'s most stunning rooftop venue. Featuring a live DJ, champagne toast at midnight, and breathtaking skyline views. Early bird tickets include VIP access to the lounge area and a welcome cocktail.',
    date: 'Tue, Dec 31',
    day: '31',
    month: 'DEC',
    time: '9:00 PM - 2:00 AM',
    location: 'Skyline Rooftop, Downtown',
    venue: 'Skyline Rooftop',
    category: 'Parties',
    price: 10,
    image: '/event-party.jpg',
    attendees: [
      { id: 'a1', name: 'Sarah', initials: 'SC' },
      { id: 'a2', name: 'Jake', initials: 'JM' },
      { id: 'a3', name: 'Priya', initials: 'PP' },
      { id: 'a4', name: 'Lucas', initials: 'LK' },
      { id: 'a5', name: 'Emma', initials: 'EW' },
      { id: 'a6', name: 'Diego', initials: 'DL' },
    ],
    maxAttendees: 120,
  },
  {
    id: 'e5',
    title: 'Italian Cooking Workshop',
    description: 'Learn to make fresh pasta from scratch in this hands-on cooking class led by Chef Marco. You\'ll prepare a 3-course Italian meal and enjoy it together at the end with paired wines. No experience needed — just bring your appetite!',
    date: 'Wed, Dec 18',
    day: '18',
    month: 'DEC',
    time: '5:30 PM - 8:30 PM',
    location: 'Culinary Studio, SoMa',
    venue: 'Culinary Studio',
    category: 'Workshops',
    price: 8,
    image: '/event-workshop.jpg',
    attendees: [
      { id: 'a3', name: 'Priya', initials: 'PP' },
      { id: 'a7', name: 'Ava', initials: 'AJ' },
      { id: 'a5', name: 'Emma', initials: 'EW' },
    ],
    maxAttendees: 16,
  },
  {
    id: 'e6',
    title: 'Wine & Connect Tasting Evening',
    description: 'Sample six curated wines from local Napa Valley vineyards while meeting fellow wine enthusiasts. Our sommelier will guide you through each tasting with notes on flavor profiles and pairing suggestions. A relaxed, intimate setting perfect for conversation.',
    date: 'Fri, Dec 20',
    day: '20',
    month: 'DEC',
    time: '7:00 PM - 9:30 PM',
    location: 'The Cellar, North Beach',
    venue: 'The Cellar',
    category: 'Social Mixers',
    price: 6,
    image: '/event-mixer.jpg',
    attendees: [
      { id: 'a6', name: 'Diego', initials: 'DL' },
      { id: 'a8', name: 'Noah', initials: 'NB' },
      { id: 'a2', name: 'Jake', initials: 'JM' },
    ],
    maxAttendees: 24,
  },
  {
    id: 'e7',
    title: 'Beach Bonfire & Acoustic Night',
    description: 'An intimate beach gathering with live acoustic music, s\'mores, and stargazing. Bring a blanket and your favorite beach-friendly beverage. The bonfire starts at sunset — arrive early to catch the golden hour!',
    date: 'Sat, Dec 21',
    day: '21',
    month: 'DEC',
    time: '5:00 PM - 10:00 PM',
    location: 'Ocean Beach, Fire Pit 4',
    venue: 'Ocean Beach',
    category: 'Outdoor',
    price: 0,
    image: '/event-bonfire.jpg',
    attendees: [
      { id: 'a1', name: 'Sarah', initials: 'SC' },
      { id: 'a5', name: 'Emma', initials: 'EW' },
      { id: 'a7', name: 'Ava', initials: 'AJ' },
      { id: 'a8', name: 'Noah', initials: 'NB' },
    ],
    maxAttendees: 40,
  },
  {
    id: 'e8',
    title: 'Sunset Yoga & Mindfulness',
    description: 'Unwind with a guided yoga session on the beach as the sun sets over the ocean. Suitable for all levels — modifications provided. Followed by a 10-minute group meditation and optional smoothie social afterward.',
    date: 'Sun, Dec 22',
    day: '22',
    month: 'DEC',
    time: '4:30 PM - 6:00 PM',
    location: 'Santa Monica Beach',
    venue: 'Santa Monica Beach',
    category: 'Wellness',
    price: 0,
    image: '/event-yoga.jpg',
    attendees: [
      { id: 'a3', name: 'Priya', initials: 'PP' },
      { id: 'a4', name: 'Lucas', initials: 'LK' },
      { id: 'a6', name: 'Diego', initials: 'DL' },
    ],
    maxAttendees: 20,
  },
];

/* ------------------------------------------------------------------ */
/*  AVATAR HELPER                                                      */
/* ------------------------------------------------------------------ */

function AttendeeAvatar({ initials, size = 32 }: { initials: string; size?: number }) {
  const colors = ['#BB83C9', '#7DE0B3', '#7BC4E8', '#F0B84A', '#E86A6A', '#9A63A8'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold border-2 border-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EVENT LIST CARD                                                    */
/* ------------------------------------------------------------------ */

function EventListCard({
  event,
  onClick,
  isGoing,
}: {
  event: EventItem;
  onClick: () => void;
  isGoing: boolean;
}) {
  const { t } = useTranslation();
  const catColor = categoryColors[event.category] || '#BB83C9';

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className="w-full rounded-[20px] p-4 flex items-center gap-4 text-left"
      style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      {/* Date Block */}
      <div
        className="w-[60px] h-[60px] rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${catColor}25` }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: catColor }}>
          {event.month}
        </span>
        <span className="text-xl font-bold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {event.day}
        </span>
      </div>

      {/* Event Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-[#232323] truncate" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {event.title}
        </h3>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock size={13} style={{ color: 'rgba(35,35,35,0.4)' }} />
          <span className="text-xs" style={{ color: 'rgba(35,35,35,0.5)' }}>{event.time}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <MapPin size={13} style={{ color: 'rgba(35,35,35,0.4)' }} />
          <span className="text-xs truncate" style={{ color: 'rgba(35,35,35,0.5)' }}>{event.location}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: `${catColor}20`, color: catColor }}
          >
            {t(`events.cat_${event.category.toLowerCase()}`, { defaultValue: event.category })}
          </span>
          <span className="text-sm font-semibold" style={{ color: event.price === 0 ? '#5BC492' : '#BB83C9' }}>
            {event.price === 0 ? 'Free' : `${event.price} Pi`}
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="flex-shrink-0">
        {isGoing ? (
          <div className="w-9 h-9 rounded-full bg-[#7DE0B3] flex items-center justify-center">
            <Check size={18} className="text-[#232323]" strokeWidth={2.5} />
          </div>
        ) : (
          <ChevronRight size={20} style={{ color: 'rgba(35,35,35,0.3)' }} />
        )}
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  FEATURED EVENT CARD                                                */
/* ------------------------------------------------------------------ */

function FeaturedEventCard({
  event,
  isGoing,
  onToggleGoing,
  onClick,
}: {
  event: EventItem;
  isGoing: boolean;
  onToggleGoing: () => void;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className="w-full rounded-[24px] overflow-hidden relative text-left"
      style={{ aspectRatio: '16/10', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
    >
      <img src={event.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(35,35,35,0.4)' }} />

      {/* Featured Badge */}
      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#BB83C9] text-white text-xs font-semibold">
        {t('events.featured')}
      </div>

      {/* RSVP Button */}
      <div
        role="button"
        onClick={(e) => { e.stopPropagation(); onToggleGoing(); }}
        className="absolute bottom-4 right-4 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer z-10"
        style={{
          backgroundColor: isGoing ? '#7DE0B3' : '#BB83C9',
          color: isGoing ? '#232323' : '#fff',
        }}
      >
        {isGoing ? `${t('events.going')} ✓` : 'RSVP'}
      </div>

      {/* Event Info */}
      <div className="absolute bottom-4 left-4 right-20">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7DE0B3]">
          {event.date.toUpperCase()}
        </span>
        <h2 className="text-xl font-bold text-white leading-tight mt-1" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {event.title}
        </h2>
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={13} color="rgba(255,255,255,0.8)" />
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{event.venue}</span>
        </div>
        <div className="flex items-center mt-2">
          <div className="flex -space-x-2">
            {event.attendees.slice(0, 4).map((a) => (
              <AttendeeAvatar key={a.id} initials={a.initials} size={24} />
            ))}
          </div>
          <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
            +{t('events.peopleGoing', { count: event.attendees.length + 12 })}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  EVENT DETAIL SHEET                                                 */
/* ------------------------------------------------------------------ */

function EventDetailSheet({
  event,
  isOpen,
  onClose,
  isGoing,
  isInterested,
  onToggleGoing,
  onToggleInterested,
}: {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  isGoing: boolean;
  isInterested: boolean;
  onToggleGoing: () => void;
  onToggleInterested: () => void;
}) {
  const { t } = useTranslation();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'initial' | 'processing' | 'success'>('initial');
  const [feedback, setFeedback] = useState<'great' | 'okay' | 'missed' | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!event) return null;

  const catColor = categoryColors[event.category] || '#BB83C9';
  const hasTicket = isGoing && event.price > 0;

  const handleBuyTicket = () => {
    setShowPayment(true);
    setPaymentStep('initial');
  };

  const processPayment = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
      onToggleGoing();
    }, 2000);
  };

  const handleFeedbackSubmit = () => {
    if (!feedback) return;
    setFeedbackSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    setShowPayment(false);
    setPaymentStep('initial');
    setFeedback(null);
    setFeedbackSubmitted(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-[24px] p-0 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#fff' }}>
        {/* Hero Image */}
        <div className="relative w-full h-[200px] flex-shrink-0">
          <img src={event.image} alt="" className="w-full h-full object-cover rounded-t-[24px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-t-[24px]" />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)' }}
          >
            <X size={18} className="text-[#232323]" />
          </motion.button>
          <div className="absolute bottom-4 left-6">
            <span
              className="text-[11px] px-2.5 py-1 rounded-full font-semibold uppercase"
              style={{ backgroundColor: `${catColor}25`, color: catColor }}
            >
              {t(`events.cat_${event.category.toLowerCase()}`, { defaultValue: event.category })}
            </span>
          </div>
        </div>

        <div className="px-6 pb-8">
          {/* Title */}
          <h1 className="text-2xl font-bold text-[#232323] mt-4" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            {event.title}
          </h1>

          {/* Meta Row */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(232,226,216,0.4)', color: '#232323' }}>
              <Calendar size={13} /> {event.date}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(232,226,216,0.4)', color: '#232323' }}>
              <Clock size={13} /> {event.time}
            </span>
          </div>

          {/* Description */}
          <p className="text-base leading-relaxed mt-4 text-[#232323]" style={{ lineHeight: 1.6 }}>
            {event.description}
          </p>

          {/* Venue */}
          <div className="mt-4 rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(232,226,216,0.3)' }}>
            <div className="h-[120px] relative">
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(187,131,201,0.1)' }}>
                <div className="flex flex-col items-center gap-2">
                  <MapPin size={32} className="text-[#BB83C9]" />
                  <span className="text-sm font-medium text-[#232323]">{event.venue}</span>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#232323]">{event.venue}</p>
                <p className="text-xs" style={{ color: 'rgba(35,35,35,0.5)' }}>{event.location}</p>
              </div>
              <span className="text-sm font-semibold text-[#BB83C9]">{t('events.getDirections')}</span>
            </div>
          </div>

          {/* Attendees */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-[#232323]">
                {t('events.peopleGoing', { count: event.attendees.length + 12 })}
              </h4>
              <button className="text-sm font-semibold text-[#BB83C9]">{t('events.seeAll')}</button>
            </div>
            <div className="flex items-center mt-3">
              <div className="flex -space-x-2.5">
                {event.attendees.map((a) => (
                  <AttendeeAvatar key={a.id} initials={a.initials} size={36} />
                ))}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
                  style={{ backgroundColor: 'rgba(232,226,216,0.6)', color: '#232323' }}
                >
                  +12
                </div>
              </div>
            </div>
          </div>

          {/* Host */}
          <div className="mt-4 flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: 'rgba(232,226,216,0.3)' }}>
            <AttendeeAvatar initials="EQ" size={40} />
            <div>
              <p className="text-sm font-semibold text-[#232323]">{t('events.organizer')}</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(187,131,201,0.15)', color: '#9A63A8' }}>
                {t('events.host')}
              </span>
            </div>
          </div>

          {/* Ticket Section (paid events) */}
          {event.price > 0 && !isGoing && (
            <div className="mt-5 p-4 rounded-2xl border" style={{ borderColor: '#E8E2D8' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="./pi-logo.svg" alt="Pi" className="w-6 h-6" />
                  <span className="text-xl font-bold text-[#232323]">{event.price} Pi</span>
                </div>
                <button
                  onClick={handleBuyTicket}
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.3)' }}
                >
                  {t('events.buyTicket')}
                </button>
              </div>
            </div>
          )}

          {/* Ticket Success */}
          {hasTicket && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 rounded-2xl border-2 border-dashed"
              style={{ backgroundColor: 'rgba(125,224,179,0.15)', borderColor: '#7DE0B3' }}
            >
              <p className="text-sm font-semibold text-[#232323]">{t('events.youreGoing')}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(35,35,35,0.6)' }}>{t('events.showAtDoor')}</p>
              <div className="mt-3 p-3 bg-white rounded-xl flex items-center justify-center gap-2">
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-sm ${i % 3 === 0 ? 'bg-[#232323]' : 'bg-transparent'}`} />
                  ))}
                </div>
                <span className="text-xs font-mono" style={{ color: 'rgba(35,35,35,0.5)' }}>EVT-{event.id.toUpperCase()}</span>
              </div>
            </motion.div>
          )}

          {/* RSVP Actions */}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={onToggleGoing}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: isGoing ? '#7DE0B3' : '#BB83C9',
                color: isGoing ? '#232323' : '#fff',
                boxShadow: isGoing ? 'none' : '0 4px 16px rgba(187,131,201,0.3)',
              }}
            >
              {isGoing ? `${t('events.going')} ✓` : event.price > 0 ? t('events.buyTicket') : t('events.attend')}
            </button>
            <button
              onClick={onToggleInterested}
              className="flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: isInterested ? 'rgba(240,184,74,0.15)' : 'rgba(232,226,216,0.4)',
                color: isInterested ? '#D99E3A' : '#232323',
              }}
            >
              <Star size={16} fill={isInterested ? '#F0B84A' : 'none'} />
              {isInterested ? t('events.interested') : t('events.save')}
            </button>
          </div>

          {/* Post-Event Feedback */}
          {isGoing && (
            <div className="mt-5 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(232,226,216,0.3)' }}>
              <h4 className="text-base font-semibold text-[#232323]">{t('events.howWasEvent')}</h4>
              <p className="text-sm mt-1" style={{ color: 'rgba(35,35,35,0.6)' }}>{t('events.feedbackHelps')}</p>
              {!feedbackSubmitted ? (
                <>
                  <div className="flex flex-col gap-2 mt-3">
                    <button
                      onClick={() => setFeedback('great')}
                      className="p-3 rounded-xl text-sm text-left transition-all border-2"
                      style={{
                        backgroundColor: feedback === 'great' ? 'rgba(125,224,179,0.2)' : '#fff',
                        borderColor: feedback === 'great' ? '#7DE0B3' : 'transparent',
                      }}
                    >
                      {t('events.greatConnections')}
                    </button>
                    <button
                      onClick={() => setFeedback('okay')}
                      className="p-3 rounded-xl text-sm text-left transition-all border-2"
                      style={{
                        backgroundColor: feedback === 'okay' ? 'rgba(240,184,74,0.15)' : '#fff',
                        borderColor: feedback === 'okay' ? '#F0B84A' : 'transparent',
                      }}
                    >
                      {t('events.itWasOkay')}
                    </button>
                    <button
                      onClick={() => setFeedback('missed')}
                      className="p-3 rounded-xl text-sm text-left transition-all border-2"
                      style={{
                        backgroundColor: feedback === 'missed' ? 'rgba(232,106,106,0.1)' : '#fff',
                        borderColor: feedback === 'missed' ? '#E86A6A' : 'transparent',
                      }}
                    >
                      {t('events.missedIt')}
                    </button>
                  </div>
                  {feedback && (
                    <motion.button
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleFeedbackSubmit}
                      className="w-full mt-3 py-3 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: '#BB83C9' }}
                    >
                      {t('events.submitFeedback')}
                    </motion.button>
                  )}
                </>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm mt-2 font-medium"
                  style={{ color: '#5BC492' }}
                >
                  {t('events.thanksFeedback')}
                </motion.p>
              )}
            </div>
          )}
        </div>
      </SheetContent>

      {/* Payment Flow Sheet */}
      <Sheet open={showPayment} onOpenChange={(open) => !open && setShowPayment(false)}>
        <SheetContent side="bottom" className="rounded-t-[24px] p-6" style={{ backgroundColor: '#fff' }}>
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold text-[#232323]">{t('events.completePayment')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col items-center">
            {paymentStep === 'initial' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                <div className="flex items-center justify-center gap-3 mb-6">
                  <img src="./pi-logo.svg" alt="Pi" className="w-10 h-10" />
                  <span className="text-3xl font-bold text-[#232323]">{event.price} Pi</span>
                </div>
                <div className="p-4 rounded-2xl mb-4" style={{ backgroundColor: 'rgba(232,226,216,0.3)' }}>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: 'rgba(35,35,35,0.6)' }}>{t('events.ticket')}</span>
                    <span className="font-medium text-[#232323]">{event.title}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: 'rgba(35,35,35,0.6)' }}>{t('events.date')}</span>
                    <span className="font-medium text-[#232323]">{event.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'rgba(35,35,35,0.6)' }}>{t('events.total')}</span>
                    <span className="font-bold text-[#232323]">{event.price} Pi</span>
                  </div>
                </div>
                <button
                  onClick={processPayment}
                  className="w-full py-4 rounded-full text-base font-semibold text-white"
                  style={{ backgroundColor: '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.3)' }}
                >
                  {t('events.payWithPi')}
                </button>
              </motion.div>
            )}
            {paymentStep === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-8"
              >
                <div className="w-12 h-12 border-3 border-[#BB83C9] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-base font-medium text-[#232323]">{t('events.processingPayment')}</p>
              </motion.div>
            )}
            {paymentStep === 'success' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex flex-col items-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-[#7DE0B3] flex items-center justify-center mb-4">
                  <Check size={32} className="text-[#232323]" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-[#232323]">{t('events.paymentSuccess')}</h3>
                <p className="text-sm mt-2 text-center" style={{ color: 'rgba(35,35,35,0.6)' }}>
                  {t('events.ticketConfirmed')}
                </p>
              </motion.div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN EVENTS PAGE                                                   */
/* ------------------------------------------------------------------ */

export default function Events() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [goingEvents, setGoingEvents] = useState<Set<string>>(new Set());
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'upcoming' | 'interested' | 'past'>('upcoming');
  const [allEvents, setAllEvents] = useState<EventItem[]>(MOCK_EVENTS);

  useEffect(() => {
    getEvents().then((data) => {
      if (!data || data.length === 0) return;
      // Backend events lack UI-only fields (attendees, day/month, image…) — fill safe defaults
      setAllEvents((data as unknown as Partial<EventItem>[]).map((e, i) => {
        const parsed = e.date ? new Date(e.date) : null;
        const valid = parsed && !isNaN(parsed.getTime()) ? parsed : null;
        return {
          id: e.id ?? `srv-${i}`,
          title: e.title ?? '',
          description: e.description ?? '',
          date: valid ? valid.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : (e.date ?? ''),
          day: e.day ?? (valid ? String(valid.getDate()) : ''),
          month: e.month ?? (valid ? valid.toLocaleString(undefined, { month: 'short' }).toUpperCase() : ''),
          time: e.time ?? (valid ? valid.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''),
          location: e.location ?? '',
          venue: e.venue ?? e.location ?? '',
          category: e.category ?? 'Social Mixers',
          price: e.price ?? 0,
          image: e.image ?? '/event-featured.jpg',
          attendees: e.attendees ?? [],
          maxAttendees: e.maxAttendees ?? 50,
          featured: e.featured,
        } as EventItem;
      }));
    }).catch(() => {});
  }, []);

  const featuredEvent = allEvents.find((e) => e.featured) || allEvents[0];

  const filteredEvents = allEvents.filter((e) => {
    if (activeCategory === 'All') return true;
    return e.category === activeCategory;
  });

  const interestedEventsList = allEvents.filter((e) => interestedEvents.has(e.id));
  const pastEventsList = allEvents.filter((_, i) => i < 3);

  const toggleGoing = (eventId: string) => {
    setGoingEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const toggleInterested = (eventId: string) => {
    setInterestedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  return (
    <Layout title={t('events.title')}>
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Events Header with Tabs */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {activeTab === 'upcoming' ? t('events.upcomingEvents') : activeTab === 'interested' ? t('events.interestedEvents') : t('events.pastEvents')}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(35,35,35,0.6)' }}>
                {t('events.nearYou', { count: filteredEvents.length })}
              </p>
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="flex gap-1 mt-3 p-1 rounded-xl" style={{ backgroundColor: 'rgba(232,226,216,0.4)' }}>
            {(['upcoming', 'interested', 'past'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                  color: activeTab === tab ? '#232323' : 'rgba(35,35,35,0.5)',
                  boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {t(`events.${tab}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        {activeTab === 'upcoming' && (
          <div className="px-5 py-2 flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 1.05 }}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: activeCategory === cat ? '#BB83C9' : 'rgba(232,226,216,0.5)',
                  color: activeCategory === cat ? '#fff' : '#232323',
                }}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'upcoming' && (
              <motion.div
                key="upcoming"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 pb-6 flex flex-col gap-4"
              >
                {/* Featured Event */}
                <FeaturedEventCard
                  event={featuredEvent}
                  isGoing={goingEvents.has(featuredEvent.id)}
                  onToggleGoing={() => toggleGoing(featuredEvent.id)}
                  onClick={() => setSelectedEvent(featuredEvent)}
                />

                {/* Events List */}
                <div className="flex flex-col gap-3">
                  {filteredEvents.filter((e) => !e.featured).map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    >
                      <EventListCard
                        event={event}
                        onClick={() => setSelectedEvent(event)}
                        isGoing={goingEvents.has(event.id)}
                      />
                    </motion.div>
                  ))}
                </div>

                {filteredEvents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <img src="./empty-events.png" alt="" className="w-40 h-40 mb-4 object-contain" />
                    <h2 className="text-xl font-semibold text-[#232323]">{t('events.noEvents')}</h2>
                    <p className="text-sm mt-2 text-center" style={{ color: 'rgba(35,35,35,0.6)' }}>
                      {t('events.tryCategory')}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'interested' && (
              <motion.div
                key="interested"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 pb-6 flex flex-col gap-3"
              >
                {interestedEventsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Star size={48} style={{ color: 'rgba(35,35,35,0.15)' }} />
                    <h2 className="text-xl font-semibold text-[#232323] mt-4">{t('events.noSaved')}</h2>
                    <p className="text-sm mt-2 text-center max-w-[260px]" style={{ color: 'rgba(35,35,35,0.6)' }}>
                      Tap the star icon on events you&apos;re interested in to save them here.
                    </p>
                    <button
                      onClick={() => setActiveTab('upcoming')}
                      className="mt-4 px-6 py-3 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: '#BB83C9' }}
                    >
                      {t('events.browseEvents')}
                    </button>
                  </div>
                ) : (
                  interestedEventsList.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    >
                      <EventListCard
                        event={event}
                        onClick={() => setSelectedEvent(event)}
                        isGoing={goingEvents.has(event.id)}
                      />
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'past' && (
              <motion.div
                key="past"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 pb-6 flex flex-col gap-3"
              >
                {pastEventsList.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    style={{ opacity: 0.6 }}
                  >
                    <EventListCard
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                      isGoing={goingEvents.has(event.id)}
                    />
                  </motion.div>
                ))}
                {goingEvents.size > 0 && !feedbackSubmitted() && (
                  <div className="mt-2 p-4 rounded-2xl bg-[#F0B84A15] border border-[#F0B84A40]">
                    <p className="text-sm font-semibold text-[#232323]">{t('events.leaveFeedback')}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(35,35,35,0.6)' }}>Your feedback helps improve our community</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Event Detail Sheet */}
        <EventDetailSheet
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          isGoing={selectedEvent ? goingEvents.has(selectedEvent.id) : false}
          isInterested={selectedEvent ? interestedEvents.has(selectedEvent.id) : false}
          onToggleGoing={() => selectedEvent && toggleGoing(selectedEvent.id)}
          onToggleInterested={() => selectedEvent && toggleInterested(selectedEvent.id)}
        />
      </div>
    </Layout>
  );
}

function feedbackSubmitted() {
  return false;
}
