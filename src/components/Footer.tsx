import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Compass, Heart, Users, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface NavItem {
  label: string;
  icon: typeof Compass;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'nav.discover', icon: Compass, path: '/discover' },
  { label: 'nav.matches', icon: Heart, path: '/matches' },
  { label: 'nav.clubs', icon: Users, path: '/clubs' },
  { label: 'nav.events', icon: Calendar, path: '/events' },
  { label: 'nav.profile', icon: User, path: '/profile' },
];

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [tapIndex, setTapIndex] = useState<number | null>(null);

  const handleTap = (index: number, path: string) => {
    setTapIndex(index);
    setTimeout(() => setTapIndex(null), 120);
    navigate(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 10px)',
        height: 'calc(72px + max(env(safe-area-inset-bottom), 10px))',
      }}
    >
      <div className="max-w-[430px] mx-auto h-[72px] flex items-center justify-around px-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;
          const isTapped = tapIndex === index;

          return (
            <motion.button
              key={item.path}
              onClick={() => handleTap(index, item.path)}
              animate={{ scale: isTapped ? 0.88 : 1 }}
              transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center justify-center gap-1 relative"
              style={{ width: 56, height: 56 }}
            >
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={2}
                  style={{
                    color: isActive ? '#BB83C9' : 'rgba(35, 35, 35, 0.4)',
                    transition: 'color 0.2s ease',
                  }}
                />
                {item.badge && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] rounded-full bg-[#E86A6A] text-white text-[10px] font-semibold flex items-center justify-center px-1"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </div>
              <span
                className="text-[10px] font-medium leading-tight"
                style={{
                  color: isActive ? '#BB83C9' : 'rgba(35, 35, 35, 0.4)',
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  transition: 'color 0.2s ease',
                }}
              >
                {t(item.label)}
              </span>
              {isActive && (
                <motion.div
                  layoutId="footer-active-dot"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#BB83C9]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
