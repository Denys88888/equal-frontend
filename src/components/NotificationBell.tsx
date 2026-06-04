import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(232,226,216,0.5)' }}
      >
        <Bell size={20} className="text-[#232323]" strokeWidth={2} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: '#BB83C9' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 z-50 w-80 rounded-2xl overflow-hidden shadow-lg"
              style={{ backgroundColor: '#FFFFFF', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <span className="text-sm font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <motion.button whileTap={{ scale: 0.9 }} onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs font-medium" style={{ color: '#BB83C9', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    <Check size={14} /> Mark all read
                  </motion.button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {recentNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm" style={{ color: 'rgba(35,35,35,0.4)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  recentNotifications.map((n) => (
                    <motion.button
                      key={n.id}
                      whileTap={{ backgroundColor: 'rgba(187,131,201,0.05)' }}
                      onClick={() => markAsRead(n.id)}
                      className="w-full text-left px-4 py-3 border-b flex items-start gap-3"
                      style={{
                        borderColor: 'rgba(0,0,0,0.04)',
                        backgroundColor: n.read ? '#FFFFFF' : 'rgba(187,131,201,0.06)',
                      }}
                    >
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: n.read ? 'transparent' : '#BB83C9' }} />
                      <div>
                        <p className="text-sm font-medium text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                          {n.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(35,35,35,0.6)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                          {n.body}
                        </p>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
