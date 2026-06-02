import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, X, Utensils, Puzzle, Wine } from 'lucide-react';

// ── Types ──────────────────────────────────────────────

interface Offer {
  id: string;
  category: 'restaurant' | 'activity' | 'event';
  title: string;
  description: string;
  url: string;
  gradient: string;
  icon: React.ReactNode;
}

// ── Mock Data ──────────────────────────────────────────

const OFFERS: Offer[] = [
  {
    id: 'offer-1',
    category: 'restaurant',
    title: '20% off at Le Petit Bistro',
    description: 'Perfect for your first date. Romantic atmosphere and candlelight dinner.',
    url: 'https://example.com/le-petit-bistro',
    gradient: 'linear-gradient(135deg, #BB83C9 0%, #D4A8DE 60%, #7DE0B3 100%)',
    icon: <Utensils size={20} strokeWidth={1.5} />,
  },
  {
    id: 'offer-2',
    category: 'activity',
    title: 'Escape Room for Two \u2014 15% off',
    description: 'Test your teamwork and have fun! Includes complimentary photos.',
    url: 'https://example.com/escape-room',
    gradient: 'linear-gradient(135deg, #7DE0B3 0%, #A8EBCC 50%, #BB83C9 100%)',
    icon: <Puzzle size={20} strokeWidth={1.5} />,
  },
  {
    id: 'offer-3',
    category: 'event',
    title: 'Wine Tasting Evening',
    description: 'Join other Equal couples for an evening of fine wines and conversation.',
    url: 'https://example.com/wine-tasting',
    gradient: 'linear-gradient(135deg, #BB83C9 0%, #7BC4E8 50%, #7DE0B3 100%)',
    icon: <Wine size={20} strokeWidth={1.5} />,
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
  const handleBookNow = () => {
    window.open(offer.url, '_blank', 'noopener,noreferrer');
  };

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
        boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)',
      }}
    >
      {/* Image Area — 16:10 gradient placeholder */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ aspectRatio: '16/10', background: offer.gradient }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Icon centered */}
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
        {/* Partner badge */}
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

        {/* CTA Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleBookNow}
          className="mt-2 w-full h-12 rounded-full flex items-center justify-center gap-2 text-base font-semibold text-[#232323]"
          style={{
            backgroundColor: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(35,35,35,0.1)',
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: 16,
          }}
        >
          Book Now
          <ExternalLink size={16} strokeWidth={2} />
        </motion.button>

        {/* Not interested — text button */}
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

  const handleCardDismiss = (id: string) => {
    setDismissedCardIds((prev) => [...prev, id]);
  };

  const visibleOffers = OFFERS.filter((o) => !dismissedCardIds.includes(o.id));

  if (visibleOffers.length === 0) return null;

  return (
    <div className="px-5 pt-4 pb-2">
      {/* Section Header */}
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

      {/* Horizontal Scroll Carousel */}
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
