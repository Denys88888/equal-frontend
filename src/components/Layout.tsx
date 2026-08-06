import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
  transparentNav?: boolean;
  hideFooter?: boolean;
  hideNavbar?: boolean;
  showNotifications?: boolean;
}

const footerHiddenPaths = ['/onboarding', '/chat'];

export default function Layout({
  children,
  title,
  showBack = false,
  onBack,
  rightAction,
  transparentNav = false,
  hideFooter = false,
  hideNavbar = false,
  showNotifications = false,
}: LayoutProps) {
  const location = useLocation();

  const shouldHideFooter = hideFooter || footerHiddenPaths.some((path) => location.pathname.startsWith(path));

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: 'var(--linen)' }}>
      <div className="w-full max-w-[430px] relative flex flex-col" style={{ backgroundColor: 'var(--linen)' }}>
        {!hideNavbar && (
          <Navbar
            title={title}
            showBack={showBack}
            onBack={onBack}
            rightAction={rightAction}
            transparent={transparentNav}
            showNotifications={showNotifications}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }}
            className="flex-1 flex flex-col"
            // Footer is position:fixed, so it takes no space in this flex
            // column — without this, the last ~80px of every page's content
            // (e.g. Profile's Settings row) renders underneath the tab bar
            // and its tap target is obscured/unreliable.
            style={!shouldHideFooter ? { paddingBottom: 'calc(72px + max(env(safe-area-inset-bottom), 10px))' } : undefined}
          >
            {children}
          </motion.main>
        </AnimatePresence>

        {!shouldHideFooter && <Footer />}
      </div>
    </div>
  );
}
