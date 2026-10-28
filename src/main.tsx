import { initSentry } from '@/lib/sentry';
initSentry();
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { ToastProvider } from '@/components/ToastProvider'
import { AuthProvider } from '@/context/AuthContext'
import { watchAndroidNavBar } from '@/lib/systemNav'
import { watchCrashes } from '@/lib/crashReport'
import ErrorBoundary from '@/components/ErrorBoundary'
import '@/i18n/config';
import './index.css'
import './styles/holo.css'
import App from './App.tsx'

// Initialize Pi SDK — call immediately if already loaded, otherwise wait for load
function initPiSdk() {
  if (window.Pi) {
    window.Pi.init({ version: '2.0', sandbox: import.meta.env.VITE_PI_SANDBOX === 'true' });
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPiSdk);
} else {
  initPiSdk();
}

// Android: a slimmer bottom tab bar (--tabbar-h in index.css), and room for
// the system navigation bar where Pi Browser draws the page beneath it.
if (/Android/i.test(navigator.userAgent)) {
  document.documentElement.classList.add('android');
  watchAndroidNavBar();
}

watchCrashes();

// The boundary inside App can't catch a crash in the providers around it;
// without this one such a crash left a blank white page and nothing else.
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  </ErrorBoundary>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
