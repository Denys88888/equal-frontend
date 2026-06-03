import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface ThemeToggleProps {
  size?: number;
  className?: string;
}

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function ThemeToggle({ size = 20, className = '' }: ThemeToggleProps) {
  const { isDark, toggle } = useDarkMode();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${className}`}
      style={{
        backgroundColor: isDark ? 'rgba(187,131,201,0.15)' : 'rgba(35,35,35,0.05)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3, ease: easeOutExpo }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Moon size={size} className="text-[#BB83C9]" strokeWidth={2} />
        ) : (
          <Sun size={size} className="text-[#F0B84A]" strokeWidth={2} />
        )}
      </motion.div>
    </motion.button>
  );
}

export { useDarkMode };
