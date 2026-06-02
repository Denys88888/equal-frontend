import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
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
}: LayoutProps) {
  const location = useLocation();

  const shouldHideFooter = hideFooter || footerHiddenPaths.some((path) => location.pathname.startsWith(path));

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: '#F7F4EE' }}>
      <div className="w-full max-w-[430px] relative flex flex-col" style={{ backgroundColor: '#F7F4EE' }}>
        {!hideNavbar && (
          <Navbar
            title={title}
            showBack={showBack}
            onBack={onBack}
            rightAction={rightAction}
            transparent={transparentNav}
          />
        )}

        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {!shouldHideFooter && <Footer />}
      </div>
    </div>
  );
}
