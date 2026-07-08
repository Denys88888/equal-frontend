import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { ToastProvider } from '@/components/ToastProvider'
import { AuthProvider } from '@/context/AuthContext'
import '@/i18n/config';
import './index.css'
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

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </HashRouter>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
