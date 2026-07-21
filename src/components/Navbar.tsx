import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
  transparent?: boolean;
}

export default function Navbar({ title, showBack = false, onBack, rightAction, transparent = false }: NavbarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 z-40 flex items-center justify-between px-4 h-14"
      style={{
        backgroundColor: transparent ? 'transparent' : 'rgba(var(--linen-rgb-main), 0.85)',
        backdropFilter: transparent ? 'none' : 'blur(12px)',
        paddingTop: 'env(safe-area-inset-top)',
        height: 'calc(56px + env(safe-area-inset-top))',
        borderBottom: transparent ? 'none' : '1px solid rgba(var(--linen-rgb), 0.6)',
      }}
    >
      <div className="flex-1 flex items-center">
        {showBack && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onClick={handleBack}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(var(--card-rgb), 0.72)', backdropFilter: 'blur(12px)' }}
          >
            <ChevronLeft size={24} className="text-[var(--charcoal)]" strokeWidth={2} />
          </motion.button>
        )}
      </div>

      {title && (
        <h2 className="flex-shrink-0 text-xl font-semibold text-[var(--charcoal)] tracking-tight" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {title}
        </h2>
      )}

      <div className="flex-1 flex items-center justify-end">
        {rightAction && rightAction}
      </div>
    </motion.nav>
  );
}
