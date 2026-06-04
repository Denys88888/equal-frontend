import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Utensils,
  Puzzle,
  Wine,
  MapPin,
  Clock,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────

interface Offer {
  id: string;
  category: 'restaurant' | 'activity' | 'event';
  title: string;
  description: string;
  gradient: string;
  icon: React.ReactNode;
  // Inline details instead of external URL
  details: {
    address: string;
    hours: string;
    phone: string;
    discountCode: string;
    description: string;
  };
}

// ── Mock Data — Inline content, NO external URLs ───────

const OFFERS: Offer[] = [
  {
    id: 'offer-1',
    category: 'restaurant',
    title: '20% off at Le Petit Bistro',
    description:
      'Perfect for your first date. Romantic atmosphere and candlelight dinner.',
    gradient: 'linear-gradient(135deg, #BB83C9 0%, #D4A8DE 60%, #7DE0B3 100%)',
    icon: <Utensils size={20} strokeWidth={1.5} />,
    details: {
      address: '42 Rue des Amoureux, Paris 75001',
      hours: 'Mon\u2013Sat: 18:00\u201323:00',
      phone: '+33 1 42 00 00 00',
      discountCode: 'EQUAL20',
      description:
        'Show this code to your waiter to get 20% off your total bill. Valid for couples on their first visit. Includes a complimentary dessert!',
    },
  },
  {
    id: 'offer-2',
    category: 'activity',
    title: 'Escape Room for Two \u2014 15% off',
    description:
      'Test your teamwork and have fun! Includes complimentary photos.',
    gradient: 'linear-gradient(135deg, #7DE0B3 0%, #A8EBCC 50%, #BB83C9 100%)',
    icon: <Puzzle size={20} strokeWidth={1.5} />,
    details: {
      address: '15 Mystery Lane, Downtown',
      hours: 'Daily: 10:00\u201322:00',
      phone: '+1 555 0123',
      discountCode: 'EQUALESCAPE',
      description:
        'Book any "Couples Challenge" room and use code EQUALESCAPE at checkout for 15% off. Includes free polaroid photo of your team!',
    },
  },
  {
    id: 'offer-3',
    category: 'event',
    title: 'Wine Tasting Evening',
    description:
      'Join other Equal couples for an evening of fine wines and conversation.',
    gradient: 'linear-gradient(135deg, #BB83C9 0%, #7BC4E8 50%, #7DE0B3 100%)',
    icon: <Wine size={20} strokeWidth={1.5} />,
    details: {
      address: 'Vineyard Hall, 88 Grape Street',
      hours: 'Every Friday: 19:00\u201322:00',
      phone: '+1 555 0456',
      discountCode: 'EQUALWINE',
      description:
        'Reserve your spot with code EQUALWINE for buy-one-get-one-free tickets. Meet 5+ wine varieties matched with artisan cheeses. Dress code: smart casual.',
    },
  },
];

// ── Individual Offer Card ──────────────────────────────

function OfferCard({
  offer,
  index,
  onDismiss,
}: {
  offer: Offer;
  index: number;
  onDismiss?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="flex-shrink-0 rounded-2xl overflow-hidden bg-white"
      style={{
        width: 280,
        boxShadow:
          '0 2px 12px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)',
      }}
    >
      {/* Image Area — gradient placeholder */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ aspectRatio: '16/10', background: offer.gradient }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
          }}
        >
          {offer.icon}
        </div>
        <div
          className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: '#BB83C9' }}
        >
          <span
            className="text-[10px] font-semibold text-white uppercase tracking-wide"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            Partner
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <h3
          className="text-lg font-semibold text-[#232323] leading-tight"
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: 18,
            lineHeight: 1.35,
            letterSpacing: '-0.54px',
          }}
        >
          {offer.title}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: 14,
            lineHeight: 1.55,
            letterSpacing: '-0.28px',
            color: 'rgba(35,35,35,0.65)',
          }}
        >
          {offer.description}
        </p>

        {/* Expandable Details (INLINE — no external redirect) */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpanded(!expanded)}
          className="mt-1 w-full h-10 rounded-full flex items-center justify-center gap-1.5 text-sm font-semibold text-[#232323]"
          style={{
            backgroundColor: 'rgba(187,131,201,0.12)',
            fontFamily: "'Outfit', system-ui, sans-serif",
          }}
        >
          {expanded ? 'Hide Details' : 'View Details'}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-1 flex flex-col gap-2.5">
                {/* Discount Code */}
                <div className="bg-[#BB83C9]/10 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#BB83C9]">
                    Discount Code
                  </span>
                  <p
                    className="text-xl font-bold text-[#232323] mt-1 tracking-[2px]"
                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    {offer.details.discountCode}
                  </p>
                </div>
                {/* Details */}
                <p
                  className="text-sm"
                  style={{
                    color: 'rgba(35,35,35,0.75)',
                    fontFamily: "'Outfit', system-ui, sans-serif",
                    lineHeight: 1.5,
                  }}
                >
                  {offer.details.description}
                </p>
                {/* Address */}
                <div className="flex items-start gap-2">
                  <MapPin
                    size={14}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: '#BB83C9' }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      color: 'rgba(35,35,35,0.6)',
                      fontFamily: "'Outfit', system-ui, sans-serif",
                    }}
                  >
                    {offer.details.address}
                  </span>
                </div>
                {/* Hours */}
                <div className="flex items-center gap-2">
                  <Clock
                    size={14}
                    className="flex-shrink-0"
                    style={{ color: '#BB83C9' }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      color: 'rgba(35,35,35,0.6)',
                      fontFamily: "'Outfit', system-ui, sans-serif",
                    }}
                  >
                    {offer.details.hours}
                  </span>
                </div>
                {/* Phone */}
                <div className="flex items-center gap-2">
                  <Phone
                    size={14}
                    className="flex-shrink-0"
                    style={{ color: '#BB83C9' }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      color: 'rgba(35,35,35,0.6)',
                      fontFamily: "'Outfit', system-ui, sans-serif",
                    }}
                  >
                    {offer.details.phone}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not interested */}
        {onDismiss && (
          <motion.button
            whileTap={{ opacity: 0.6 }}
            onClick={onDismiss}
            className="w-full py-1 text-sm font-semibold text-center"
            style={{
              color: '#BB83C9',
              fontFamily: "'Outfit', system-ui, sans-serif",
              fontSize: 14,
              background: 'none',
              border: 'none',
            }}
          >
            Not interested
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Partner Offers Component ──────────────────────

interface PartnerOffersProps {
  onDismiss?: () => void;
}

export default function PartnerOffers({ onDismiss }: PartnerOffersProps) {
  const [dismissedCardIds, setDismissedCardIds] = useState<string[]>([]);
  const handleCardDismiss = (id: string) =>
    setDismissedCardIds((prev) => [...prev, id]);
  const visibleOffers = OFFERS.filter((o) => !dismissedCardIds.includes(o.id));
  if (visibleOffers.length === 0) return null;

  return (
    <div className="px-5 pt-4 pb-2">
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{
            color: 'rgba(35,35,35,0.4)',
            fontFamily: "'Outfit', system-ui, sans-serif",
            letterSpacing: '0.44px',
          }}
        >
          Partner Offers
        </span>
        {onDismiss && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onDismiss}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(232,226,216,0.5)' }}
          >
            <X size={14} className="text-[#232323]" strokeWidth={2} />
          </motion.button>
        )}
      </div>
      <div
        className="flex gap-4 overflow-x-auto pb-3 -mx-5 px-5"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {visibleOffers.map((offer, index) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            index={index}
            onDismiss={() => handleCardDismiss(offer.id)}
          />
        ))}
      </div>
    </div>
  );
}
