import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/client';
import { api } from '@/api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  User,
  Camera,
  Shield,
  ShieldCheck,
  Ghost,
  Slash,
  Bell,
  MessageSquare,
  Calendar,
  Users,
  HelpCircle,
  Flag,
  Info,
  FileText,
  LogOut,
  Globe,
  Trash2,
  Heart,
  Code,
  AlertTriangle,
  Palette,
  Cookie,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSelector from '@/components/LanguageSelector';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';

/* ───────────────────── Easing Tokens ───────────────────── */

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];
const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];

/* ───────────────────── Pi Icon ───────────────────── */

function PiIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`rounded-full bg-[#BB83C9] flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <span className="text-white font-bold" style={{ fontSize: size * 0.5 }}>π</span>
    </div>
  );
}

/* ───────────────────── Mock Data ───────────────────── */

const blockedUsersData = [
  { id: 1, name: 'Alex M.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  { id: 2, name: 'Jordan K.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
];

/* ───────────────────── Setting Row Component ───────────────────── */

interface SettingRowProps {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  iconColor?: string;
  label: string;
  detail?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingRow({
  icon: Icon,
  iconColor,
  label,
  detail,
  onClick,
  rightElement,
  danger = false,
}: SettingRowProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-4 rounded-[16px] bg-white text-left"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon
          size={20}
          style={{ color: danger ? '#E86A6A' : (iconColor || 'rgba(35,35,35,0.6)') }}
          strokeWidth={2}
          className="flex-shrink-0"
        />
        <span
          className="text-base font-semibold truncate"
          style={{
            color: danger ? '#E86A6A' : '#232323',
            fontFamily: "'Outfit', system-ui, sans-serif",
          }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {detail && (
          <span className="text-xs text-[#232323] opacity-40 whitespace-nowrap" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            {detail}
          </span>
        )}
        {rightElement || <ChevronRight size={20} className="text-[#232323] opacity-30" strokeWidth={2} />}
      </div>
    </motion.button>
  );
}

/* ───────────────────── Toggle Row Component ───────────────────── */

interface ToggleRowProps {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  iconColor?: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

function ToggleRow({
  icon: Icon,
  iconColor,
  label,
  description,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div
      className="w-full flex items-start justify-between px-5 py-4 rounded-[16px] bg-white"
      style={{
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        backgroundColor: checked ? 'rgba(187,131,201,0.05)' : '#FFFFFF',
      }}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Icon
          size={20}
          style={{ color: iconColor || 'rgba(35,35,35,0.6)', marginTop: 2 }}
          strokeWidth={2}
          className="flex-shrink-0"
        />
        <div className="min-w-0">
          <span
            className="text-base font-semibold text-[#232323] block"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {label}
          </span>
          {description && (
            <span className="text-xs text-[#232323] opacity-45 block mt-0.5" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.5 }}>
              {description}
            </span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-3" style={{ marginTop: description ? 0 : 2 }}>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="data-[state=checked]:bg-[#BB83C9]"
        />
      </div>
    </div>
  );
}

/* ───────────────────── Section Label ───────────────────── */

function SectionLabel({ text, danger }: { text: string; danger?: boolean }) {
  return (
    <span
      className="block px-1 py-3 text-[11px] font-semibold uppercase tracking-wider"
      style={{
        color: danger ? 'rgba(232,106,106,0.6)' : 'rgba(35,35,35,0.35)',
        fontFamily: "'Outfit', system-ui, sans-serif",
        letterSpacing: '0.44px',
      }}
    >
      {text}
    </span>
  );
}

/* ═════════════════════════ MAIN SETTINGS PAGE ═════════════════════════ */

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* ── State ── */
  const [ghostMode, setGhostMode] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [notifMatches, setNotifMatches] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifEvents, setNotifEvents] = useState(true);
  const [notifClubs, setNotifClubs] = useState(true);
  const [walletConnected, setWalletConnected] = useState(true);

  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState(blockedUsersData);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDonation, setShowDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState<string>('0.5');
  const [showAbout, setShowAbout] = useState(false);

  /* ── Handlers ── */
  const handleUnblock = (id: number) => {
    setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDeleteNext = () => {
    if (deleteStep < 3) {
      setDeleteStep(deleteStep + 1);
    } else {
      // Final deletion — call backend then clear local state
      api.delete('/users/me').catch(() => {}).finally(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setShowDeleteFlow(false);
        setDeleteStep(1);
        setDeleteConfirmText('');
        navigate('/');
      });
    }
  };

  const handleCloseDelete = () => {
    setShowDeleteFlow(false);
    setDeleteStep(1);
    setDeleteConfirmText('');
  };

  const donationOptions = ['0.1', '0.5', '1', '5'];

  return (
    <Layout title={t('settings.title')} showBack hideFooter>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeSmooth }}
        className="flex flex-col px-5 pt-4 pb-10"
      >

        {/* ───────── Profile ───────── */}
        <SectionLabel text="Profile" />
        <div className="space-y-2">
          <SettingRow icon={User} iconColor="#BB83C9" label="Edit Profile" onClick={() => navigate('/profile')} />
          <SettingRow icon={Camera} iconColor="#7BC4E8" label="Photos" detail={`5/9`} onClick={() => {}} />
          <SettingRow icon={Shield} iconColor="#7DE0B3" label="Trust Score" detail="82/100" onClick={() => {}} />
        </div>

        {/* ───────── Privacy ───────── */}
        <SectionLabel text={t('settings.privacy')} />
        <div className="space-y-2">
          <ToggleRow
            icon={Ghost}
            label={t('settings.ghostMode')}
            description="Hide your profile from discovery. Your existing matches and chats remain active."
            checked={ghostMode}
            onCheckedChange={setGhostMode}
          />
          <ToggleRow
            icon={ShieldCheck}
            iconColor="#7DE0B3"
            label="Verified matches only"
            description="Only show profiles that have completed verification"
            checked={verifiedOnly}
            onCheckedChange={setVerifiedOnly}
          />
          <SettingRow
            icon={Slash}
            iconColor="rgba(232,106,106,0.6)"
            label={t('settings.blockedUsers')}
            detail={`${blockedUsers.length} blocked`}
            onClick={() => setShowBlockedUsers(true)}
          />
        </div>

        {/* ───────── Notifications ───────── */}
        <SectionLabel text={t('settings.notifications')} />
        <div className="space-y-2">
          <ToggleRow
            icon={Bell}
            label="New matches"
            description="When someone likes you back"
            checked={notifMatches}
            onCheckedChange={setNotifMatches}
          />
          <ToggleRow
            icon={MessageSquare}
            label="Messages"
            description="New chat messages"
            checked={notifMessages}
            onCheckedChange={setNotifMessages}
          />
          <ToggleRow
            icon={Calendar}
            label="Events"
            description="Upcoming events and reminders"
            checked={notifEvents}
            onCheckedChange={setNotifEvents}
          />
          <ToggleRow
            icon={Users}
            label="Clubs"
            description="New posts and activity in your clubs"
            checked={notifClubs}
            onCheckedChange={setNotifClubs}
          />
        </div>

        {/* ───────── Appearance ───────── */}
        <SectionLabel text={t('settings.appearance')} />
        <div className="space-y-2">
          <div
            className="w-full flex items-center justify-between px-5 py-4 rounded-[16px] bg-white"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Palette
                size={20}
                style={{ color: '#BB83C9' }}
                strokeWidth={2}
                className="flex-shrink-0"
              />
              <div className="min-w-0">
                <span
                  className="text-base font-semibold text-[#232323] block"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {t('settings.darkMode')}
                </span>
                <span
                  className="text-xs text-[#232323] opacity-45 block mt-0.5"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.5 }}
                >
                  Toggle between light and dark theme
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 ml-3">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* ───────── Language ───────── */}
        <SectionLabel text={t('settings.language')} />
        <div className="space-y-2">
          <div
            className="w-full flex items-center justify-between px-5 py-4 rounded-[16px] bg-white"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Globe
                size={20}
                style={{ color: '#7BC4E8' }}
                strokeWidth={2}
                className="flex-shrink-0"
              />
              <div className="min-w-0">
                <span
                  className="text-base font-semibold text-[#232323] block"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {t('settings.language')}
                </span>
                <span
                  className="text-xs text-[#232323] opacity-45 block mt-0.5"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.5 }}
                >
                  {t('settings.language')}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 ml-3">
              <LanguageSelector />
            </div>
          </div>
        </div>

        {/* ───────── Pi Wallet ───────── */}
        <SectionLabel text={t('settings.piWallet')} />
        <div className="space-y-2">
          <SettingRow
            icon={PiIcon}
            iconColor="#BB83C9"
            label="Pi Wallet"
            detail={walletConnected ? 'Connected ✓' : 'Connect'}
            rightElement={
              walletConnected ? (
                <span className="text-xs font-semibold text-[#7DE0B3]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Connected ✓</span>
              ) : (
                <span className="text-xs font-semibold text-[#BB83C9]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Connect</span>
              )
            }
            onClick={() => setWalletConnected(!walletConnected)}
          />
          {walletConnected && (
            <div
              className="w-full flex items-center justify-between px-5 py-4 rounded-[16px] bg-white"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center gap-3">
                <PiIcon size={20} />
                <span className="text-base font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  Balance
                </span>
              </div>
              <span className="text-xs text-[#232323] opacity-60" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                3.14 Pi
              </span>
            </div>
          )}
        </div>

        {/* ───────── Support ───────── */}
        <SectionLabel text="Support" />
        <div className="space-y-2">
          <SettingRow icon={HelpCircle} iconColor="#7BC4E8" label="Help Center" onClick={() => {}} />
          <SettingRow icon={Flag} iconColor="#F0B84A" label="Report a Problem" onClick={() => {}} />
          <SettingRow icon={Info} iconColor="rgba(35,35,35,0.4)" label="About Equal" detail="v1.0.0" onClick={() => setShowAbout(true)} />
          <SettingRow icon={FileText} iconColor="#BB83C9" label="Privacy Policy" onClick={() => navigate('/privacy')} />
          <SettingRow icon={FileText} iconColor="#BB83C9" label="Terms of Service" onClick={() => navigate('/terms')} />
          <SettingRow icon={Cookie} iconColor="#F0B84A" label="Cookie Preferences" onClick={() => { localStorage.removeItem('equal-cookie-consent'); window.location.reload(); }} />
        </div>

        {/* ───────── Developer Donation ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
          className="mt-6"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDonation(true)}
            className="w-full p-5 rounded-[20px] bg-white text-left"
            style={{
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(187,131,201,0.12), transparent 60%), radial-gradient(circle at 70% 70%, rgba(125,224,179,0.10), transparent 60%)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: 'rgba(187,131,201,0.15)' }}>
                <Heart size={20} className="text-[#BB83C9]" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  {t('settings.donate')}
                </h3>
                <p className="text-xs text-[#232323] opacity-45" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  Voluntary developer donation
                </p>
              </div>
            </div>
            <p className="text-sm text-[#232323] opacity-60" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.55 }}>
              Equal is free because we believe love has no price. If you'd like to support our team, you can make a voluntary donation.
            </p>
          </motion.button>
        </motion.div>

        {/* ───────── Danger Zone ───────── */}
        <SectionLabel text="Danger Zone" danger />
        <div className="space-y-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-[16px] bg-white border border-[rgba(232,106,106,0.3)]"
          >
            <div className="flex items-center gap-3">
              <LogOut size={20} className="text-[#E86A6A]" strokeWidth={2} />
              <span className="text-base font-semibold text-[#E86A6A]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {t('settings.logout')}
              </span>
            </div>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDeleteFlow(true)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-[16px] bg-white"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3">
              <Trash2 size={20} className="text-[#E86A6A]" strokeWidth={2} />
              <span className="text-base font-semibold text-[#E86A6A]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {t('settings.deleteAccount')}
              </span>
            </div>
          </motion.button>
        </div>

        {/* Bottom padding */}
        <div className="h-6" />
      </motion.div>

      {/* ═══════════════════ MODALS & DIALOGS ═══════════════════ */}

      {/* ── Blocked Users Bottom Sheet ── */}
      <Dialog open={showBlockedUsers} onOpenChange={setShowBlockedUsers}>
        <DialogContent className="rounded-t-[24px] rounded-b-none max-w-[430px] bg-white border-0 p-0 gap-0" style={{ top: 'auto', bottom: 0, position: 'fixed', maxHeight: '70vh' }}>
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-[#E8E2D8]" />
          </div>
          <DialogHeader className="px-6 pb-3">
            <DialogTitle className="text-xl font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Blocked Users
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto">
            {blockedUsers.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Shield size={48} className="text-[#E8E2D8] mb-3" strokeWidth={1.5} />
                <p className="text-base font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  No blocked users
                </p>
                <p className="mt-1 text-sm text-[#232323] opacity-50" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  When you block someone, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      <span className="text-sm font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                        {user.name}
                      </span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUnblock(user.id)}
                      className="px-4 py-2 rounded-full text-sm font-semibold text-[#BB83C9]"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      Unblock
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Logout Confirmation ── */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="rounded-[20px] max-w-[320px] bg-white border-0" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#232323] text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Log Out?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#232323] opacity-60 text-center mt-1" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            Are you sure you want to log out?
          </p>
          <div className="flex gap-3 mt-5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 h-12 rounded-full border border-[rgba(35,35,35,0.1)] bg-[rgba(255,255,255,0.72)] text-base font-semibold text-[#232323]"
              style={{ backdropFilter: 'blur(12px)', fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setShowLogoutConfirm(false); localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_TOKEN_KEY); navigate('/'); }}
              className="flex-1 h-12 rounded-full bg-[#E86A6A] text-white text-base font-semibold"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Log Out
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Account Multi-Step Flow ── */}
      <Dialog open={showDeleteFlow} onOpenChange={handleCloseDelete}>
        <DialogContent className="rounded-[20px] max-w-[340px] bg-white border-0" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <AnimatePresence mode="wait">
            {deleteStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: easeSmooth }}
              >
                <div className="flex flex-col items-center py-2">
                  <div className="w-14 h-14 rounded-full bg-[rgba(232,106,106,0.15)] flex items-center justify-center mb-4">
                    <AlertTriangle size={28} className="text-[#E86A6A]" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    Delete Account?
                  </h3>
                  <div className="mt-4 space-y-2 text-sm text-[#232323] opacity-60 text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
                    <p>This action is permanent and cannot be undone.</p>
                    <p>Your matches, messages, and all profile data will be permanently deleted.</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCloseDelete}
                    className="flex-1 h-12 rounded-full border border-[rgba(35,35,35,0.1)] bg-[rgba(255,255,255,0.72)] text-base font-semibold text-[#232323]"
                    style={{ backdropFilter: 'blur(12px)', fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDeleteNext}
                    className="flex-1 h-12 rounded-full bg-[#E86A6A] text-white text-base font-semibold"
                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            )}

            {deleteStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: easeSmooth }}
              >
                <h3 className="text-xl font-semibold text-[#232323] text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  Type to Confirm
                </h3>
                <p className="mt-3 text-sm text-[#232323] opacity-60 text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.55 }}>
                  Type <span className="font-bold text-[#E86A6A]">DELETE</span> to confirm you want to permanently delete your account.
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="mt-4 h-[52px] rounded-xl border-[1.5px] border-transparent bg-[rgba(232,226,216,0.4)] text-base text-center text-[#232323] placeholder:text-[#232323] placeholder:opacity-35 focus:border-[#E86A6A] focus:ring-[3px] focus:ring-[rgba(232,106,106,0.15)] uppercase font-semibold"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDeleteNext}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="w-full mt-4 h-14 rounded-full text-base font-semibold text-white disabled:opacity-30 disabled:shadow-none transition-opacity"
                  style={{
                    backgroundColor: '#E86A6A',
                    fontFamily: "'Outfit', system-ui, sans-serif",
                    boxShadow: deleteConfirmText === 'DELETE' ? '0 4px 16px rgba(232,106,106,0.3)' : 'none',
                  }}
                >
                  Continue
                </motion.button>
              </motion.div>
            )}

            {deleteStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: easeSmooth }}
              >
                <div className="flex flex-col items-center py-2">
                  <div className="w-14 h-14 rounded-full bg-[rgba(232,106,106,0.15)] flex items-center justify-center mb-4">
                    <Trash2 size={28} className="text-[#E86A6A]" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-semibold text-[#232323] text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    Final Confirmation
                  </h3>
                  <p className="mt-3 text-sm text-[#232323] opacity-60 text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.55 }}>
                    This is your last chance. Your account will be permanently deleted.
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDeleteNext}
                  className="w-full mt-5 h-14 rounded-full bg-[#E86A6A] text-white text-base font-semibold"
                  style={{ boxShadow: '0 4px 16px rgba(232,106,106,0.3)', fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  Delete My Account
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCloseDelete}
                  className="w-full mt-2 h-12 rounded-full text-base font-semibold text-[#232323] opacity-60"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  Cancel
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* ── Donation Dialog ── */}
      <Dialog open={showDonation} onOpenChange={setShowDonation}>
        <DialogContent className="rounded-[20px] max-w-[340px] bg-white border-0" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#232323] text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Support Equal
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(187,131,201,0.15)' }}>
              <Heart size={28} className="text-[#BB83C9]" strokeWidth={2} />
            </div>
            <p className="text-sm text-[#232323] opacity-60 text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.55 }}>
              Equal is free because we believe love has no price. If you'd like to support our team, you can make a voluntary Pi donation.
            </p>
          </div>
          {/* Amount Selector */}
          <div className="flex gap-2 mt-4 justify-center">
            {donationOptions.map((amount) => (
              <motion.button
                key={amount}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDonationAmount(amount)}
                className="px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors"
                style={{
                  borderColor: donationAmount === amount ? '#BB83C9' : '#E8E2D8',
                  backgroundColor: donationAmount === amount ? 'rgba(187,131,201,0.1)' : '#FFFFFF',
                  color: donationAmount === amount ? '#BB83C9' : '#232323',
                  fontFamily: "'Outfit', system-ui, sans-serif",
                }}
              >
                {amount} π
              </motion.button>
            ))}
          </div>
          {/* Custom amount */}
          <div className="mt-3">
            <Input
              type="number"
              step="0.01"
              placeholder="Custom amount"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className="h-[52px] rounded-xl border-[1.5px] border-[#E8E2D8] bg-[rgba(232,226,216,0.4)] text-base text-center text-[#232323] placeholder:text-[#232323] placeholder:opacity-35 focus:border-[#BB83C9] focus:ring-[3px] focus:ring-[rgba(187,131,201,0.15)]"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full mt-4 h-14 rounded-full bg-[#BB83C9] text-white text-base font-semibold flex items-center justify-center gap-2"
            style={{ boxShadow: '0 4px 16px rgba(187,131,201,0.3)', fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
              <span className="text-[#BB83C9] text-[10px] font-bold">π</span>
            </span>
            Donate {donationAmount} Pi
          </motion.button>
        </DialogContent>
      </Dialog>

      {/* ── About Dialog ── */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="rounded-[20px] max-w-[320px] bg-white border-0" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mb-3" style={{ background: 'linear-gradient(180deg, #BB83C9, #D4A8DE)' }}>
              <Heart size={28} className="text-white" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Equal
            </h3>
            <p className="text-sm text-[#232323] opacity-40 mt-1" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Version 1.0.0
            </p>
            <Separator className="w-full my-4 bg-[#E8E2D8]" />
            <p className="text-sm text-[#232323] opacity-60 text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              A decentralized dating dApp powered by the Pi Network. Built with love for the Pi community.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#232323] opacity-40" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              <Code size={12} strokeWidth={2} />
              <span>Built by the Equal team</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
