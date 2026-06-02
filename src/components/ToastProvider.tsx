import { createContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'match';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  dismissToast: () => {},
});

const TOAST_STYLES: Record<ToastType, { bg: string; icon: ReactNode }> = {
  success: {
    bg: '#5BC492',
    icon: <CheckCircle size={18} className="shrink-0" />,
  },
  error: {
    bg: '#E86A6A',
    icon: <XCircle size={18} className="shrink-0" />,
  },
  info: {
    bg: '#7BC4E8',
    icon: <Info size={18} className="shrink-0" />,
  },
  match: {
    bg: '#BB83C9',
    icon: <Sparkles size={18} className="shrink-0" />,
  },
};

function ToastItemComponent({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const style = TOAST_STYLES[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
      }}
      className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white shadow-xl pointer-events-auto"
      style={{
        backgroundColor: style.bg,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      {style.icon}
      <span>{toast.message}</span>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${++idRef.current}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast container — fixed top-center */}
      <div
        className="fixed top-4 left-0 right-0 z-[300] flex flex-col items-center gap-2 pointer-events-none px-4"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItemComponent
              key={toast.id}
              toast={toast}
              onDismiss={dismissToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
