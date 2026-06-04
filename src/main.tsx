import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { ToastProvider } from '@/components/ToastProvider'
import { AuthProvider } from '@/context/AuthContext'
import '@/i18n/config';
import './index.css'
import App from './App.tsx'

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
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
