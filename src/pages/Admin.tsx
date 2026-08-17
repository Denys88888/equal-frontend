import { useTranslation } from 'react-i18next';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Users,
  Activity,
  Heart,
  AlertTriangle,
  Search,
  AlertOctagon,
  Ban,
  X,
  CheckCircle,
  Calendar,
  UserX,
  Award,
  Eye,
  Trash2,
  Star,
  Edit3,
  Check,
  MessageSquare,
  Flag,
  ChevronDown,
  Coins,
  Gift,
  Ticket,
  Mail,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LoadErrorNotice from '@/components/LoadErrorNotice';
import {
  getAdminStats, getRevenueHistory, getAdminUsers, getPendingReports, resolveReport, banUser,
  getAdminClubs, approveClub, deleteClub, getAdminEvents, deleteEvent, updateEvent, toggleEventFeatured,
  setSupportEmail, adjustTrust, awardBadge, getPendingVerifications, reviewVerification,
} from '@/api/admin';
import type { RevenueTransaction, PendingVerification } from '@/api/admin';
import { getSupportEmail } from '@/api/settings';
import type { AdminStats, AwardBadgeRequest } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// ── Types ──────────────────────────────────────────────

interface Report {
  id: string;
  reportedUser: { name: string; avatar: string };
  reporter: { name: string; avatar: string };
  reason: 'spam' | 'harassment' | 'fake profile' | 'inappropriate content';
  status: 'Pending' | 'Resolved' | 'Auto-Resolved';
  timestamp: string;
  details: string;
}

interface AppUser {
  id: string;
  name: string;
  avatar: string;
  trustScore: number;
  joinDate: string;
  status: 'Active' | 'Banned' | 'Reported';
  bio: string;
  matches: number;
  badges: string[];
}

interface Club {
  id: string;
  name: string;
  category: string;
  memberCount: number;
  postCount: number;
  status: 'Active' | 'Pending Review';
  createdBy: string;
}

interface AppEvent {
  id: string;
  name: string;
  date: string;
  rawDate: string;
  attendees: number;
  status: 'Upcoming' | 'Ongoing' | 'Past';
  location: string;
  featured: boolean;
  description: string;
  city: string;
  category: string;
  price: number;
  maxAttendees: number | null;
}

// ── Mock Data ──────────────────────────────────────────

const REASON_CONFIG: Record<string, { label: string; color: string; icon: typeof Flag }> = {
  spam: { label: 'admin.reasonSpam', color: '#F0B84A', icon: MessageSquare },
  harassment: { label: 'admin.reasonHarassment', color: '#E86A6A', icon: AlertTriangle },
  'fake profile': { label: 'admin.reasonFake', color: '#BB83C9', icon: UserX },
  'inappropriate content': { label: 'admin.reasonInappropriate', color: '#E86A6A', icon: Flag },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  Pending: { color: '#F0B84A', bg: 'rgba(240,184,74,0.15)' },
  Resolved: { color: '#7DE0B3', bg: 'rgba(125,224,179,0.15)' },
  'Auto-Resolved': { color: '#7BC4E8', bg: 'rgba(123,196,232,0.15)' },
};


const BADGE_OPTIONS = ['Verified', 'Early Adopter', 'Top Matcher', 'Event Host', 'Super Trusted', 'Creative', 'Fitness Pro', 'Photographer', 'Marathoner', 'Dancer', 'New'];

// ── Animation variants ─────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

// ── Toast Component ────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean; }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
          className="fixed top-4 left-0 right-0 z-[60] flex justify-center pointer-events-none"
        >
          <div
            className="pointer-events-auto px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
            style={{ backgroundColor: 'var(--charcoal)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
          >
            <CheckCircle size={18} style={{ color: '#7DE0B3' }} />
            <span className="text-sm font-medium text-white">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Stats Cards ────────────────────────────────────────

function formatPi(n: number | undefined): string {
  if (n === undefined) return '…';
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} π`;
}

function StatsCards() {
  const { t } = useTranslation();
  const [apiStats, setApiStats] = useState<Partial<AdminStats> | null>(null);
  useEffect(() => { getAdminStats().then(setApiStats).catch(() => {}); }, []);
  const stats = [
    { label: 'admin.totalUsers', value: apiStats?.totalUsers?.toLocaleString() ?? '…', icon: Users, color: '#BB83C9', bg: 'rgba(187,131,201,0.12)' },
    { label: 'admin.activeToday', value: apiStats?.activeToday?.toLocaleString() ?? '…', icon: Activity, color: '#7DE0B3', bg: 'rgba(125,224,179,0.15)' },
    { label: 'admin.totalMatches', value: apiStats?.totalMatches?.toLocaleString() ?? '…', icon: Heart, color: '#E86A6A', bg: 'rgba(232,106,106,0.12)' },
    { label: 'admin.pendingReports', value: apiStats?.pendingReports?.toLocaleString() ?? '…', icon: AlertTriangle, color: '#F0B84A', bg: 'rgba(240,184,74,0.15)' },
    // Every payment in Equal (gifts, event tickets) goes straight to the app's
    // own Pi wallet — there is no A2U payout or platform-fee split, so this
    // total IS the app's revenue, not a slice of it.
    { label: 'admin.revenueTotal', value: formatPi(apiStats?.revenueTotalPi), icon: Coins, color: '#F0B84A', bg: 'rgba(240,184,74,0.15)' },
    { label: 'admin.revenueToday', value: formatPi(apiStats?.revenueTodayPi), icon: Coins, color: '#7DE0B3', bg: 'rgba(125,224,179,0.15)' },
  ];

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="flex-shrink-0 rounded-2xl p-4 w-[140px] flex flex-col gap-3"
              style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: s.bg }}
              >
                <Icon size={18} style={{ color: s.color }} strokeWidth={2} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--charcoal)] tracking-tight" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.72px' }}>
                  {s.value}
                </p>
                <p className="text-xs font-medium text-[var(--charcoal)] opacity-50 mt-0.5" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  {t(s.label)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue breakdown — gifts vs paid-event tickets, the only two payment
          flows in the app. No commission split exists, so this is the full
          picture of money collected. */}
      <div className="mt-3 rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(240,184,74,0.15)' }}>
            <Gift size={16} style={{ color: '#F0B84A' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {formatPi(apiStats?.giftRevenuePi)}
            </p>
            <p className="text-[11px] text-[var(--charcoal)] opacity-50">
              {t('admin.giftRevenue')} ({apiStats?.giftRevenueCount ?? 0})
            </p>
          </div>
        </div>
        <div className="w-px h-8" style={{ backgroundColor: 'var(--linen-dark)' }} />
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(123,196,232,0.15)' }}>
            <Ticket size={16} style={{ color: '#7BC4E8' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {formatPi(apiStats?.ticketRevenuePi)}
            </p>
            <p className="text-[11px] text-[var(--charcoal)] opacity-50">
              {t('admin.ticketRevenue')} ({apiStats?.ticketRevenueCount ?? 0})
            </p>
          </div>
        </div>
      </div>

      <RecentRevenue />
    </>
  );
}

/** Collapsed by default — the ledger behind the totals above, for spot-checking. */
function RecentRevenue() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [txns, setTxns] = useState<RevenueTransaction[] | null>(null);
  // Kept separate from `txns` on purpose: collapsing a failed fetch into [] made
  // this screen report "No completed payments yet" — i.e. zero revenue — on any
  // network blip, on the one screen whose job is confirming real Pi arrived.
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (open && txns === null && !loadFailed) {
      getRevenueHistory()
        .then(setTxns)
        .catch((e: unknown) => {
          console.error('[admin] revenue history load failed:', e);
          setLoadFailed(true);
        });
    }
  }, [open, txns, loadFailed]);

  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4"
      >
        <span className="text-sm font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {t('admin.recentRevenue', { defaultValue: 'Recent transactions' })}
        </span>
        <ChevronDown
          size={16}
          className="text-[var(--charcoal)]/40 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 max-h-[280px] overflow-y-auto">
          {loadFailed ? (
            <button
              onClick={() => { setLoadFailed(false); setTxns(null); }}
              className="text-xs py-2 font-medium"
              style={{ color: '#E86A6A' }}
            >
              {t('admin.loadFailedRetry', { defaultValue: "Couldn't load transactions — tap to retry" })}
            </button>
          ) : txns === null ? (
            <p className="text-xs text-[var(--charcoal)]/40 py-2">…</p>
          ) : txns.length === 0 ? (
            <p className="text-xs text-[var(--charcoal)]/40 py-2">
              {t('admin.noTransactions', { defaultValue: 'No completed payments yet' })}
            </p>
          ) : (
            txns.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-xs py-1.5 border-t first:border-t-0" style={{ borderColor: 'var(--linen-dark)' }}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--charcoal)] truncate">{tx.memo}</p>
                  <p className="text-[var(--charcoal)]/40">
                    {tx.user.name} · {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold text-[var(--charcoal)] flex-shrink-0 ml-2">
                  {formatPi(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Reports Moderation ─────────────────────────────────

function ReportsModeration({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Resolved'>('All');
  const [reports, setReports] = useState<Report[]>([]);
  // A moderation queue that looks empty because the fetch failed is worse than
  // an error: reports pile up unreviewed while the admin believes it's clear.
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    getPendingReports().then((data) => {
      if (data) setReports(data as unknown as Report[]);
      setLoadFailed(false);
    }).catch((e: unknown) => {
      console.error('[admin] pending reports load failed:', e);
      setLoadFailed(true);
    });
  }, [reloadKey]);

  const filtered = reports.filter((r) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return r.status === 'Pending';
    if (filter === 'Resolved') return r.status === 'Resolved' || r.status === 'Auto-Resolved';
    return true;
  });

  // These three only ever touched local state before — the "Ban" button
  // never actually banned anyone server-side, it just relabeled the report
  // in this admin's own browser. resolveReport() already applies the real
  // effect (isActive:false / trustScore -10) as part of resolving the report.
  const resolve = async (id: string, action: 'warn' | 'ban' | 'none', successMsg: string) => {
    const snapshot = reports;
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Resolved' as const } : r)));
    try {
      await resolveReport(id, action);
      showToast(successMsg);
    } catch {
      setReports(snapshot);
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    }
  };
  const handleWarn = (id: string) => resolve(id, 'warn', t('admin.warnedSuccess'));
  const handleBan = (id: string) => resolve(id, 'ban', t('admin.bannedSuccess'));
  const handleDismiss = (id: string) => resolve(id, 'none', t('admin.reportDismissed'));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
          {t('admin.reportsModeration')}
        </h2>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(232,106,106,0.12)', color: '#E86A6A' }}>
          {reports.filter((r) => r.status === 'Pending').length} {t('admin.pending').toLowerCase()}
        </span>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'All' | 'Pending' | 'Resolved')}>
        <TabsList className="w-full bg-[var(--linen-dark)] rounded-xl p-1">
          <TabsTrigger value="All" className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white dark:bg-[#22293B] data-[state=active]:text-[var(--charcoal)] data-[state=active]:shadow-sm text-[var(--charcoal)]/50">{t('admin.all')}</TabsTrigger>
          <TabsTrigger value="Pending" className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white dark:bg-[#22293B] data-[state=active]:text-[var(--charcoal)] data-[state=active]:shadow-sm text-[var(--charcoal)]/50">{t('admin.pending')}</TabsTrigger>
          <TabsTrigger value="Resolved" className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white dark:bg-[#22293B] data-[state=active]:text-[var(--charcoal)] data-[state=active]:shadow-sm text-[var(--charcoal)]/50">{t('admin.resolved')}</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-3 space-y-2">
          {loadFailed && <LoadErrorNotice onRetry={() => setReloadKey((k) => k + 1)} />}
          <Accordion type="multiple" className="space-y-2">
            {filtered.map((report) => {
              const reasonCfg = REASON_CONFIG[report.reason];
              const ReasonIcon = reasonCfg.icon;
              const statusCfg = STATUS_CONFIG[report.status];
              return (
                <AccordionItem
                  key={report.id}
                  value={report.id}
                  className="rounded-2xl border-0 px-4 py-1"
                  style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                >
                  <AccordionTrigger className="hover:no-underline py-3 [&>svg]:text-[var(--charcoal)]/30">
                    <div className="flex items-center gap-3 flex-1 pr-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={report.reportedUser.avatar} alt={report.reportedUser.name} />
                        <AvatarFallback>{report.reportedUser.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--charcoal)]">{report.reportedUser.name}</span>
                          <span className="text-[10px] font-medium text-[var(--charcoal)]/30">{report.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs" style={{ color: reasonCfg.color }}>
                            <ReasonIcon size={12} />
                            {t(reasonCfg.label)}
                          </span>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                          >
                            {report.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="flex items-start gap-2">
                        <Flag size={14} className="mt-0.5 text-[#E86A6A]" />
                        <p className="text-sm text-[var(--charcoal)]/70">{report.details}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--charcoal)]/40">
                        <span>{t('admin.reportedBy')}</span>
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={report.reporter.avatar} />
                          <AvatarFallback>{report.reporter.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-[var(--charcoal)]/60">{report.reporter.name}</span>
                      </div>
                      {report.status === 'Pending' && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-full text-xs font-semibold bg-[#F0B84A] text-[var(--charcoal)] hover:bg-[#F0B84A]/90"
                            onClick={(e) => { e.stopPropagation(); handleWarn(report.id); }}
                          >
                            <AlertOctagon size={14} className="mr-1" />
                            {t('admin.warn')}
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-full text-xs font-semibold bg-[#E86A6A] text-white hover:bg-[#E86A6A]/90"
                            onClick={(e) => { e.stopPropagation(); handleBan(report.id); }}
                          >
                            <Ban size={14} className="mr-1" />
                            {t('admin.ban')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 rounded-full text-xs font-semibold border-[var(--linen-dark)] text-[var(--charcoal)]/60 hover:bg-[var(--linen)]"
                            onClick={(e) => { e.stopPropagation(); handleDismiss(report.id); }}
                          >
                            <X size={14} className="mr-1" />
                            {t('admin.dismiss')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── User Management ────────────────────────────────────

function UserManagement({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  useEffect(() => {
    getAdminUsers().then((data) => {
      if (data) setUsers(data as unknown as AppUser[]);
    }).catch(() => {});
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBanUser = async (userId: string) => {
    const snapshot = users;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'Banned' as const } : u)));
    setSelectedUser(null);
    try {
      await banUser(userId);
      showToast(t('admin.bannedSuccess'));
    } catch {
      setUsers(snapshot);
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 75) return '#7DE0B3';
    if (score >= 40) return '#F0B84A';
    return '#E86A6A';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-[rgba(125,224,179,0.15)] text-[#5BC492] hover:bg-[rgba(125,224,179,0.15)] text-[10px]">{t('admin.active')}</Badge>;
      case 'Banned':
        return <Badge className="bg-[rgba(232,106,106,0.15)] text-[#E86A6A] hover:bg-[rgba(232,106,106,0.15)] text-[10px]">{t('admin.banned')}</Badge>;
      case 'Reported':
        return <Badge className="bg-[rgba(240,184,74,0.15)] text-[#F0B84A] hover:bg-[rgba(240,184,74,0.15)] text-[10px]">{t('admin.reported')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
          {t('admin.userManagement')}
        </h2>
        <span className="text-xs font-medium text-[var(--charcoal)]/40">{users.length} users</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--charcoal)]/30" />
        <Input
          placeholder={t('admin.searchUsers')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-xl border-0 bg-white dark:bg-[#22293B] text-sm text-[var(--charcoal)] placeholder:text-[var(--charcoal)]/30 focus-visible:ring-[#BB83C9]/20"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        />
      </div>

      <div className="space-y-2">
        {filtered.map((user, i) => (
          <motion.button
            key={user.id}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            onClick={() => setSelectedUser(user)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
            style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <Avatar className="w-11 h-11">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--charcoal)] truncate">{user.name}</span>
                {getStatusBadge(user.status)}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${getTrustColor(user.trustScore)}15`, color: getTrustColor(user.trustScore) }}
                >
                  TS {user.trustScore}
                </span>
                <span className="text-xs text-[var(--charcoal)]/30">{user.joinDate}</span>
              </div>
            </div>
            <ChevronDown size={16} className="text-[var(--charcoal)]/20 -rotate-90" />
          </motion.button>
        ))}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        {selectedUser && (
          <DialogContent className="max-w-[340px] rounded-2xl border-0 p-0 overflow-hidden" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="p-6 space-y-5">
              <DialogHeader className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                    <AvatarFallback className="text-xl">{selectedUser.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                      {selectedUser.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[var(--charcoal)]/40 mt-1">
                      Joined {selectedUser.joinDate}
                    </DialogDescription>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedUser.status)}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${getTrustColor(selectedUser.trustScore)}15`, color: getTrustColor(selectedUser.trustScore) }}
                      >
                        Trust Score: {selectedUser.trustScore}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Separator className="bg-[var(--linen-dark)]" />

              <div>
                <h4 className="text-sm font-semibold text-[var(--charcoal)] mb-2">{t('admin.bio')}</h4>
                <p className="text-sm text-[var(--charcoal)]/60">{selectedUser.bio}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[var(--charcoal)] mb-2">{t('admin.trustHistory')}</h4>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--linen-dark)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedUser.trustScore}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: getTrustColor(selectedUser.trustScore) }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--charcoal)]/30 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              {selectedUser.badges.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--charcoal)] mb-2">{t('admin.badges')}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.badges.map((badge) => (
                      <span
                        key={badge}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: 'rgba(187,131,201,0.12)', color: '#9A63A8' }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--linen)' }}>
                  <p className="text-lg font-semibold text-[var(--charcoal)]">{selectedUser.matches}</p>
                  <p className="text-[10px] text-[var(--charcoal)]/40">{t('admin.matches')}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--linen)' }}>
                  <p className="text-lg font-semibold text-[var(--charcoal)]">{selectedUser.badges.length}</p>
                  <p className="text-[10px] text-[var(--charcoal)]/40">{t('admin.badges')}</p>
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full h-11 rounded-full font-semibold bg-[#BB83C9] text-white hover:bg-[#9A63A8]"
                  onClick={() => navigate(`/profile/${selectedUser.id}`)}
                >
                  <Eye size={16} className="mr-2" />
                  {t('admin.viewProfile')}
                </Button>
                {selectedUser.status !== 'Banned' && (
                  <Button
                    className="w-full h-11 rounded-full font-semibold bg-[#E86A6A] text-white hover:bg-[#E86A6A]/90"
                    onClick={() => handleBanUser(selectedUser.id)}
                  >
                    <Ban size={16} className="mr-2" />
                    {t('admin.banUser')}
                  </Button>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

// ── Club Management ────────────────────────────────────

function ClubManagement({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    getAdminClubs()
      .then((data) => {
        if (!data) return;
        setClubs(data.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          memberCount: c.memberCount,
          postCount: c.postCount,
          status: c.status === 'PENDING' ? 'Pending Review' as const : 'Active' as const,
          createdBy: c.createdBy,
        })));
      })
      .catch(() => {});
  }, []);

  const handleApprove = async (id: string) => {
    const snapshot = clubs;
    setClubs((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'Active' as const } : c)));
    try {
      await approveClub(id);
      showToast(t('admin.clubApproved'));
    } catch {
      setClubs(snapshot);
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    }
  };
  // Reject and delete are the same server action — removing the club.
  const removeClub = async (id: string, toast: string) => {
    const snapshot = clubs;
    setClubs((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteClub(id);
      showToast(toast);
    } catch {
      setClubs(snapshot);
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    }
  };
  const handleReject = (id: string) => removeClub(id, t('admin.clubRejected'));
  const handleDelete = (id: string) => removeClub(id, t('admin.clubDeleted'));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
          {t('admin.clubManagement')}
        </h2>
        <span className="text-xs font-medium text-[var(--charcoal)]/40">{clubs.length} clubs</span>
      </div>

      <div className="space-y-2">
        {clubs.map((club, i) => (
          <motion.div
            key={club.id}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="p-4 rounded-2xl"
            style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--charcoal)]">{club.name}</h3>
                <p className="text-xs text-[var(--charcoal)]/40 mt-0.5">{club.category} &middot; by {club.createdBy}</p>
              </div>
              {club.status === 'Pending Review' ? (
                <Badge className="bg-[rgba(240,184,74,0.15)] text-[#F0B84A] hover:bg-[rgba(240,184,74,0.15)] text-[10px]">{t('admin.pending')}</Badge>
              ) : (
                <Badge className="bg-[rgba(125,224,179,0.15)] text-[#5BC492] hover:bg-[rgba(125,224,179,0.15)] text-[10px]">{t('admin.active')}</Badge>
              )}
            </div>

            <div className="flex gap-4 text-xs text-[var(--charcoal)]/50 mb-3">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {club.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={12} />
                {club.postCount} posts
              </span>
            </div>

            {club.status === 'Pending Review' ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 rounded-full text-xs font-semibold bg-[#7DE0B3] text-[var(--charcoal)] hover:bg-[#5BC492]"
                  onClick={() => handleApprove(club.id)}
                >
                  <Check size={14} className="mr-1" />
                  {t('admin.approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 rounded-full text-xs font-semibold border-[#E86A6A] text-[#E86A6A] hover:bg-[#E86A6A]/10"
                  onClick={() => handleReject(club.id)}
                >
                  <X size={14} className="mr-1" />
                  {t('admin.reject')}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 rounded-full text-xs font-semibold border-[var(--linen-dark)] text-[var(--charcoal)]/50 hover:bg-[var(--linen)] hover:text-[#E86A6A] hover:border-[#E86A6A]"
                onClick={() => handleDelete(club.id)}
              >
                <Trash2 size={14} className="mr-1" />
                {t('admin.deleteClub')}
              </Button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Event Management ───────────────────────────────────

function EventManagement({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', date: '', location: '', city: '', category: '', price: '', maxAttendees: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    getAdminEvents()
      .then((data) => {
        if (!data) return;
        setEvents(data.map((e) => ({
          id: e.id,
          name: e.name,
          date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
          rawDate: e.date,
          attendees: e.attendees,
          status: e.status,
          location: e.location,
          featured: e.featured,
          description: e.description,
          city: e.city,
          category: e.category,
          price: e.price,
          maxAttendees: e.maxAttendees,
        })));
      })
      .catch(() => {});
  }, []);

  const openEdit = (evt: AppEvent) => {
    setEditingEvent(evt);
    setEditForm({
      name: evt.name,
      description: evt.description,
      // <input type="date"> needs YYYY-MM-DD
      date: evt.rawDate ? new Date(evt.rawDate).toISOString().slice(0, 10) : '',
      location: evt.location,
      city: evt.city,
      category: evt.category,
      price: String(evt.price ?? 0),
      maxAttendees: evt.maxAttendees != null ? String(evt.maxAttendees) : '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    setSavingEdit(true);
    try {
      const price = parseFloat(editForm.price);
      const maxAttendees = editForm.maxAttendees.trim() ? parseInt(editForm.maxAttendees, 10) : undefined;
      await updateEvent(editingEvent.id, {
        title: editForm.name,
        description: editForm.description,
        date: editForm.date ? new Date(editForm.date).toISOString() : undefined,
        location: editForm.location,
        city: editForm.city,
        category: editForm.category,
        price: Number.isFinite(price) ? price : undefined,
        maxAttendees,
      });
      setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? {
        ...e,
        name: editForm.name,
        description: editForm.description,
        date: editForm.date ? new Date(editForm.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : e.date,
        rawDate: editForm.date ? new Date(editForm.date).toISOString() : e.rawDate,
        location: editForm.location,
        city: editForm.city,
        category: editForm.category,
        price: Number.isFinite(price) ? price : e.price,
        maxAttendees: maxAttendees ?? e.maxAttendees,
      } : e)));
      showToast(t('admin.eventUpdated', { defaultValue: 'Event updated' }));
      setEditingEvent(null);
    } catch {
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    const snapshot = events;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteEvent(id);
      showToast(t('admin.eventDeleted'));
    } catch {
      setEvents(snapshot);
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    }
  };
  const handleFeature = async (id: string) => {
    const wasFeatured = events.find((e) => e.id === id)?.featured;
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, featured: !e.featured } : e)));
    try {
      const featured = await toggleEventFeatured(id);
      // Trust the server's resulting state over the optimistic guess
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, featured } : e)));
      showToast(featured ? t('admin.eventFeatured') : t('admin.eventUnfeatured'));
    } catch {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, featured: !!wasFeatured } : e)));
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return { bg: 'rgba(187,131,201,0.12)', color: '#9A63A8' };
      case 'Ongoing': return { bg: 'rgba(125,224,179,0.15)', color: '#5BC492' };
      case 'Past': return { bg: 'rgba(var(--linen-rgb), 0.5)', color: '#232323]/40' };
      default: return { bg: 'var(--linen-dark)', color: 'var(--charcoal)' };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
          {t('admin.eventManagement')}
        </h2>
        <span className="text-xs font-medium text-[var(--charcoal)]/40">{events.length} events</span>
      </div>

      <div className="space-y-2">
        {events.map((evt, i) => {
          const st = getEventStatusColor(evt.status);
          return (
            <motion.div
              key={evt.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="p-4 rounded-2xl"
              style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--charcoal)] truncate">{evt.name}</h3>
                    {evt.featured && <Star size={14} className="text-[#F0B84A] flex-shrink-0" fill="#F0B84A" />}
                  </div>
                  <p className="text-xs text-[var(--charcoal)]/40 mt-0.5">{evt.location}</p>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: st.bg, color: st.color }}
                >
                  {evt.status}
                </span>
              </div>

              <div className="flex gap-4 text-xs text-[var(--charcoal)]/50 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {evt.date}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {evt.attendees} attending
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 rounded-full text-xs font-semibold border-[var(--linen-dark)] text-[var(--charcoal)]/60 hover:bg-[var(--linen)]"
                  onClick={() => openEdit(evt)}
                >
                  <Edit3 size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 rounded-full text-xs font-semibold border-[var(--linen-dark)] text-[#F0B84A] hover:bg-[#F0B84A]/10 hover:border-[#F0B84A]"
                  onClick={() => handleFeature(evt.id)}
                >
                  <Star size={14} className="mr-1" />
                  {evt.featured ? 'Unfeature' : 'Feature'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 rounded-full text-xs font-semibold border-[var(--linen-dark)] text-[#E86A6A] hover:bg-[#E86A6A]/10 hover:border-[#E86A6A]"
                  onClick={() => handleDelete(evt.id)}
                >
                  <Trash2 size={14} className="mr-1" />
                  {t('admin.delete')}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-[360px] rounded-2xl border-0" style={{ backgroundColor: 'var(--card-bg)' }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {t('admin.editEvent', { defaultValue: 'Edit event' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <Input
              placeholder={t('admin.eventName', { defaultValue: 'Event name' })}
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]"
            />
            <Textarea
              placeholder={t('admin.eventDescription', { defaultValue: 'Description' })}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)] min-h-[72px]"
            />
            <Input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
              className="h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]"
            />
            <Input
              placeholder={t('admin.eventLocation', { defaultValue: 'Location' })}
              value={editForm.location}
              onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
              className="h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]"
            />
            <Input
              placeholder={t('admin.eventCity', { defaultValue: 'City' })}
              value={editForm.city}
              onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
              className="h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]"
            />
            <Input
              placeholder={t('admin.eventCategory', { defaultValue: 'Category' })}
              value={editForm.category}
              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
              className="h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                step="0.1"
                placeholder={t('admin.eventPrice', { defaultValue: 'Price (Pi)' })}
                value={editForm.price}
                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                className="h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]"
              />
              <Input
                type="number"
                min={0}
                placeholder={t('admin.eventMaxAttendees', { defaultValue: 'Max attendees' })}
                value={editForm.maxAttendees}
                onChange={(e) => setEditForm((f) => ({ ...f, maxAttendees: e.target.value }))}
                className="h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-11 rounded-full font-semibold bg-[#BB83C9] text-white hover:bg-[#9A63A8]"
              onClick={handleSaveEdit}
              disabled={savingEdit || !editForm.name.trim()}
            >
              {savingEdit ? t('admin.saving', { defaultValue: 'Saving…' }) : t('admin.save', { defaultValue: 'Save' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Verification Requests ───────────────────────────────
// Users can submit a selfie video via VerificationDialog.tsx, and the real
// approve/reject endpoints already existed here — but nothing in the admin
// UI ever rendered getPendingVerifications()/reviewVerification(), so every
// submission queued forever with no way to actually review or approve it.

function VerificationRequests({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<PendingVerification[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Same reasoning as the reports queue: "no pending requests" must mean it,
  // not "the request failed".
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getPendingVerifications()
      .then((data) => { if (data) setRequests(data); setLoadFailed(false); })
      .catch((e: unknown) => {
        console.error('[admin] pending verifications load failed:', e);
        setLoadFailed(true);
      });
  }, [reloadKey]);

  const handleReview = async (id: string, approve: boolean) => {
    setBusyId(id);
    const snapshot = requests;
    setRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      await reviewVerification(id, approve);
      showToast(approve
        ? t('admin.verificationApproved', { defaultValue: 'Verification approved' })
        : t('admin.verificationRejected', { defaultValue: 'Verification rejected' }));
    } catch {
      setRequests(snapshot);
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--charcoal)] flex items-center gap-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
          <ShieldCheck size={18} className="text-[#7DE0B3]" />
          {t('admin.verificationRequests', { defaultValue: 'Verification requests' })}
        </h2>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(125,224,179,0.15)', color: '#5BC492' }}>
          {requests.length}
        </span>
      </div>

      {loadFailed ? (
        <LoadErrorNotice onRetry={() => setReloadKey((k) => k + 1)} />
      ) : requests.length === 0 ? (
        <p className="text-sm text-[var(--charcoal)]/40 px-1">
          {t('admin.noVerifications', { defaultValue: 'No pending verification requests' })}
        </p>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl flex items-center gap-3"
              style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <video
                src={req.mediaUrl}
                controls
                playsInline
                className="w-20 h-28 rounded-xl object-cover flex-shrink-0"
                style={{ backgroundColor: 'var(--linen)' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--charcoal)] truncate">{req.user.name}</p>
                <p className="text-xs text-[var(--charcoal)]/40 truncate">@{req.user.username}</p>
                <p className="text-xs text-[var(--charcoal)]/50 mt-1">{t(`verification.gesture_${req.gesture}`, { defaultValue: req.gesture })}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    disabled={busyId === req.id}
                    className="h-8 rounded-full text-xs font-semibold bg-[#7DE0B3] text-[var(--charcoal)] hover:bg-[#5BC492]"
                    onClick={() => handleReview(req.id, true)}
                  >
                    <Check size={14} className="mr-1" />
                    {t('admin.approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === req.id}
                    className="h-8 rounded-full text-xs font-semibold border-[#E86A6A] text-[#E86A6A] hover:bg-[#E86A6A]/10"
                    onClick={() => handleReview(req.id, false)}
                  >
                    <X size={14} className="mr-1" />
                    {t('admin.reject')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Manual Actions ─────────────────────────────────────

/**
 * Lets the admin set the support inbox that Settings' Help Center / Report a
 * Problem rows email — there was no support contact anywhere in the codebase
 * before, so those buttons had nothing to point to.
 */
function SupportEmailCard({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSupportEmail().then((e) => setEmail(e ?? '')).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    if (!email.trim()) return;
    setSaving(true);
    try {
      await setSupportEmail(email.trim());
      showToast(t('admin.supportEmailSaved', { defaultValue: 'Support email updated' }));
    } catch {
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl space-y-3" style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <h3 className="text-sm font-semibold text-[var(--charcoal)] flex items-center gap-2">
        <Mail size={16} className="text-[#7BC4E8]" />
        {t('admin.supportEmail', { defaultValue: 'Support email' })}
      </h3>
      <p className="text-xs text-[var(--charcoal)]/50">
        {t('admin.supportEmailHint', { defaultValue: "Where the app's Help Center and Report a Problem rows send users." })}
      </p>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="support@yourapp.com"
        disabled={!loaded}
        className="h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]"
      />
      <Button
        className="w-full h-11 rounded-full font-semibold bg-[#BB83C9] text-white hover:bg-[#9A63A8]"
        onClick={handleSave}
        disabled={saving || !email.trim()}
      >
        {saving ? t('admin.saving', { defaultValue: 'Saving…' }) : t('admin.save', { defaultValue: 'Save' })}
      </Button>
    </div>
  );
}

function ManualActions({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  // Selects store the user's real id now, not their display name — awardBadge()/
  // adjustTrust() need a real id to act on, and names aren't guaranteed unique.
  const [awardUserId, setAwardUserId] = useState('');
  const [awardBadgeValue, setAwardBadgeValue] = useState('');
  const [trustUserId, setTrustUserId] = useState('');
  const [trustScoreValue, setTrustScoreValue] = useState(50);
  const [awarding, setAwarding] = useState(false);
  const [adjustingTrust, setAdjustingTrust] = useState(false);

  const [adminUsers, setAdminUsers] = useState<AppUser[]>([]);
  useEffect(() => { getAdminUsers().then((d) => { if (d) setAdminUsers(d as unknown as AppUser[]); }).catch(() => {}); }, []);

  const handleAwardBadge = async () => {
    if (!awardUserId || !awardBadgeValue) return;
    const userName = adminUsers.find((u) => u.id === awardUserId)?.name ?? '';
    setAwarding(true);
    try {
      await awardBadge(awardUserId, awardBadgeValue as AwardBadgeRequest['badge']);
      showToast(t('admin.badgeAwarded', { badge: awardBadgeValue, user: userName }));
      setAwardUserId('');
      setAwardBadgeValue('');
    } catch {
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    } finally {
      setAwarding(false);
    }
  };

  const handleAdjustTrust = async () => {
    if (!trustUserId) return;
    const userName = adminUsers.find((u) => u.id === trustUserId)?.name ?? '';
    setAdjustingTrust(true);
    try {
      // 'reason' is required by the request shape but currently unused server-side
      // (see admin.controller.ts adjustTrust — only score is read).
      await adjustTrust(trustUserId, trustScoreValue, 'Manual admin adjustment');
      showToast(t('admin.trustAdjusted', { score: trustScoreValue, user: userName }));
      setTrustUserId('');
    } catch {
      showToast(t('admin.actionFailed', { defaultValue: 'Action failed' }));
    } finally {
      setAdjustingTrust(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
        {t('admin.manualActions')}
      </h2>

      <SupportEmailCard showToast={showToast} />

      <div className="p-5 rounded-2xl space-y-4" style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h3 className="text-sm font-semibold text-[var(--charcoal)] flex items-center gap-2">
          <Award size={16} className="text-[#BB83C9]" />
          {t('admin.awardBadge')}
        </h3>

        <div className="space-y-3">
          <Select value={awardUserId} onValueChange={setAwardUserId}>
            <SelectTrigger className="w-full h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]">
              <SelectValue placeholder={t('admin.selectUser')} />
            </SelectTrigger>
            <SelectContent>
              {adminUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={awardBadgeValue} onValueChange={setAwardBadgeValue}>
            <SelectTrigger className="w-full h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]">
              <SelectValue placeholder={t('admin.selectBadge')} />
            </SelectTrigger>
            <SelectContent>
              {BADGE_OPTIONS.map((badge) => (
                <SelectItem key={badge} value={badge}>{badge}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="w-full h-11 rounded-full font-semibold bg-[#BB83C9] text-white hover:bg-[#9A63A8]"
            onClick={handleAwardBadge}
            disabled={!awardUserId || !awardBadgeValue || awarding}
          >
            {awarding ? t('admin.saving', { defaultValue: 'Saving…' }) : t('admin.awardBadge')}
          </Button>
        </div>
      </div>

      <div className="p-5 rounded-2xl space-y-4" style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h3 className="text-sm font-semibold text-[var(--charcoal)] flex items-center gap-2">
          <Activity size={16} className="text-[#7DE0B3]" />
          {t('admin.adjustTrust')}
        </h3>

        <div className="space-y-3">
          <Select value={trustUserId} onValueChange={setTrustUserId}>
            <SelectTrigger className="w-full h-11 rounded-xl border-[var(--linen-dark)] text-sm text-[var(--charcoal)]">
              <SelectValue placeholder={t('admin.selectUser')} />
            </SelectTrigger>
            <SelectContent>
              {adminUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <div className="flex justify-between text-xs text-[var(--charcoal)]/50 mb-2">
              <span>{t('admin.trustScore')}</span>
              <span className="font-semibold text-[#BB83C9]">{trustScoreValue}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={trustScoreValue}
              onChange={(e) => setTrustScoreValue(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, #E86A6A 0%, #E86A6A 40%, #F0B84A 40%, #F0B84A 75%, #7DE0B3 75%, #7DE0B3 100%)`,
                accentColor: '#BB83C9',
              }}
            />
            <div className="flex justify-between text-[10px] text-[var(--charcoal)]/30 mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <Button
            className="w-full h-11 rounded-full font-semibold bg-[#7DE0B3] text-[var(--charcoal)] hover:bg-[#5BC492]"
            onClick={handleAdjustTrust}
            disabled={!trustUserId || adjustingTrust}
          >
            {adjustingTrust ? t('admin.saving', { defaultValue: 'Saving…' }) : t('admin.adjustTrust')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────

export default function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guard: only authenticated ADMINs may view this page
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const rightAction = (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(187,131,201,0.12)' }}>
      <ShieldCheck size={16} style={{ color: '#BB83C9' }} />
      <span className="text-xs font-semibold" style={{ color: '#BB83C9' }}>{t('admin.badge')}</span>
    </div>
  );

  return (
    <Layout title={t('admin.panel')} showBack onBack={() => navigate('/profile')} rightAction={rightAction} hideFooter>
      <Toast message={toastMessage} visible={toastVisible} />

      <div className="flex-1 px-5 pb-8 space-y-8" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="pt-2"
        >
          <h1
            className="text-2xl font-semibold text-[var(--charcoal)]"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.72px' }}
          >
            {t('admin.panel')}
          </h1>
          <p className="text-sm text-[var(--charcoal)]/40 mt-1">{t('admin.subtitle')}</p>
        </motion.div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Reports Moderation */}
        <ReportsModeration showToast={showToast} />

        {/* User Management */}
        <UserManagement showToast={showToast} />

        {/* Club Management */}
        <ClubManagement showToast={showToast} />

        {/* Event Management */}
        <EventManagement showToast={showToast} />

        {/* Verification Requests */}
        <VerificationRequests showToast={showToast} />

        {/* Manual Actions */}
        <ManualActions showToast={showToast} />

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </Layout>
  );
}
