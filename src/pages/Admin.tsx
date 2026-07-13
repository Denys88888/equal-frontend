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
} from 'lucide-react';
import Layout from '@/components/Layout';
import { getAdminStats, getAdminUsers, getPendingReports } from '@/api/admin';
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
  attendees: number;
  status: 'Upcoming' | 'Ongoing' | 'Past';
  location: string;
  featured: boolean;
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

const MOCK_REPORTS: Report[] = [
  { id: 'r1', reportedUser: { name: 'Jake M.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' }, reporter: { name: 'Sarah L.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' }, reason: 'harassment', status: 'Pending', timestamp: '2h ago', details: 'User sent multiple unsolicited inappropriate messages after being told to stop.' },
  { id: 'r2', reportedUser: { name: 'Anna K.', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face' }, reporter: { name: 'Mike R.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face' }, reason: 'fake profile', status: 'Pending', timestamp: '4h ago', details: 'Profile photos appear to be stock images. Reverse search shows they belong to a model.' },
  { id: 'r3', reportedUser: { name: 'David P.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' }, reporter: { name: 'Emma W.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face' }, reason: 'spam', status: 'Resolved', timestamp: '1d ago', details: 'Repeatedly sent promotional links to external cryptocurrency schemes.' },
  { id: 'r4', reportedUser: { name: 'Lisa T.', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face' }, reporter: { name: 'Noah B.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face' }, reason: 'inappropriate content', status: 'Pending', timestamp: '5h ago', details: 'Posted sexually explicit content in the Outdoor Enthusiasts club feed.' },
  { id: 'r5', reportedUser: { name: 'Ryan S.', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face' }, reporter: { name: 'Olivia G.', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face' }, reason: 'harassment', status: 'Auto-Resolved', timestamp: '2d ago', details: 'Automated detection flagged repeated offensive language in chat messages.' },
  { id: 'r6', reportedUser: { name: 'Nina H.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face' }, reporter: { name: 'Ethan C.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' }, reason: 'fake profile', status: 'Pending', timestamp: '8h ago', details: 'User claims to be a verified celebrity but identity cannot be confirmed.' },
  { id: 'r7', reportedUser: { name: 'Tom B.', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop&crop=face' }, reporter: { name: 'Sophia A.', avatar: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=100&h=100&fit=crop&crop=face' }, reason: 'spam', status: 'Resolved', timestamp: '3d ago', details: 'Mass messaging the same promotional text to over 50 users within an hour.' },
  { id: 'r8', reportedUser: { name: 'Chloe D.', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face' }, reporter: { name: 'Lucas F.', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face' }, reason: 'inappropriate content', status: 'Pending', timestamp: '12h ago', details: 'Uploaded photos containing nudity to profile gallery.' },
  { id: 'r9', reportedUser: { name: 'Marcus J.', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face' }, reporter: { name: 'Amelia V.', avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face' }, reason: 'harassment', status: 'Resolved', timestamp: '4d ago', details: 'Sent threatening messages after the reporter declined to meet in person.' },
  { id: 'r10', reportedUser: { name: 'Priya S.', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop&crop=face' }, reporter: { name: 'James H.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' }, reason: 'spam', status: 'Auto-Resolved', timestamp: '1d ago', details: 'Bot-like behavior detected: identical messages sent to 30+ users rapidly.' },
];

const MOCK_USERS: AppUser[] = [
  { id: 'u1', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', trustScore: 94, joinDate: 'Jan 15, 2025', status: 'Active', bio: 'Coffee lover • Hiking enthusiast', matches: 23, badges: ['Verified', 'Early Adopter', 'Top Matcher'] },
  { id: 'u2', name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face', trustScore: 87, joinDate: 'Feb 3, 2025', status: 'Active', bio: 'Artist and dreamer', matches: 18, badges: ['Verified', 'Creative'] },
  { id: 'u3', name: 'Liam Johnson', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face', trustScore: 42, joinDate: 'Mar 10, 2025', status: 'Reported', bio: 'Software engineer by day', matches: 5, badges: ['New'] },
  { id: 'u4', name: 'Olivia Davis', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face', trustScore: 96, joinDate: 'Jan 8, 2025', status: 'Active', bio: 'Yoga instructor • Dog mom', matches: 31, badges: ['Verified', 'Super Trusted', 'Event Host'] },
  { id: 'u5', name: 'Noah Martinez', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', trustScore: 23, joinDate: 'Apr 22, 2025', status: 'Banned', bio: 'Musician • Traveler', matches: 0, badges: [] },
  { id: 'u6', name: 'Ava Anderson', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face', trustScore: 78, joinDate: 'Feb 20, 2025', status: 'Active', bio: 'Bookworm • Tea enthusiast', matches: 12, badges: ['Verified'] },
  { id: 'u7', name: 'Ethan Taylor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', trustScore: 65, joinDate: 'Mar 5, 2025', status: 'Reported', bio: 'Fitness coach', matches: 8, badges: ['Fitness Pro'] },
  { id: 'u8', name: 'Sophia Thomas', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face', trustScore: 91, joinDate: 'Jan 22, 2025', status: 'Active', bio: 'Photography • Film', matches: 27, badges: ['Verified', 'Photographer'] },
  { id: 'u9', name: 'Mason Garcia', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop&crop=face', trustScore: 55, joinDate: 'Apr 1, 2025', status: 'Active', bio: 'Entrepreneur', matches: 6, badges: ['New'] },
  { id: 'u10', name: 'Isabella Lopez', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face', trustScore: 88, joinDate: 'Feb 14, 2025', status: 'Active', bio: 'Dancer • Cat lover', matches: 19, badges: ['Verified', 'Dancer'] },
  { id: 'u11', name: 'Lucas Lee', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face', trustScore: 12, joinDate: 'May 2, 2025', status: 'Banned', bio: 'Surfer', matches: 0, badges: [] },
  { id: 'u12', name: 'Mia Brown', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face', trustScore: 82, joinDate: 'Mar 18, 2025', status: 'Active', bio: 'Doctor • Marathon runner', matches: 15, badges: ['Verified', 'Marathoner'] },
];

const MOCK_CLUBS: Club[] = [
  { id: 'c1', name: 'Coffee Lovers', category: 'Lifestyle', memberCount: 342, postCount: 1280, status: 'Active', createdBy: 'Sarah Chen' },
  { id: 'c2', name: 'Hiking Adventures', category: 'Outdoor', memberCount: 567, postCount: 2340, status: 'Active', createdBy: 'Olivia Davis' },
  { id: 'c3', name: 'Tech Talk', category: 'Technology', memberCount: 189, postCount: 456, status: 'Pending Review', createdBy: 'Mason Garcia' },
  { id: 'c4', name: 'Yoga & Wellness', category: 'Health', memberCount: 423, postCount: 890, status: 'Active', createdBy: 'Emma Wilson' },
  { id: 'c5', name: 'Nightlife NYC', category: 'Social', memberCount: 78, postCount: 123, status: 'Pending Review', createdBy: 'Jake M.' },
  { id: 'c6', name: 'Book Club', category: 'Culture', memberCount: 256, postCount: 678, status: 'Active', createdBy: 'Ava Anderson' },
  { id: 'c7', name: 'Crypto Pi Traders', category: 'Finance', memberCount: 45, postCount: 89, status: 'Pending Review', createdBy: 'Unknown' },
  { id: 'c8', name: 'Dance Floor', category: 'Arts', memberCount: 198, postCount: 445, status: 'Active', createdBy: 'Isabella Lopez' },
];

const MOCK_EVENTS: AppEvent[] = [
  { id: 'e1', name: 'Spring Mixer 2025', date: 'May 15, 2025', attendees: 128, status: 'Upcoming', location: 'Central Park, NY', featured: true },
  { id: 'e2', name: 'Coffee & Connections', date: 'May 22, 2025', attendees: 45, status: 'Upcoming', location: 'Blue Bottle, Brooklyn', featured: false },
  { id: 'e3', name: 'Sunset Yoga Social', date: 'May 10, 2025', attendees: 67, status: 'Ongoing', location: 'Santa Monica Pier', featured: true },
  { id: 'e4', name: 'Pi Network Dating Gala', date: 'Apr 28, 2025', attendees: 234, status: 'Past', location: 'The Plaza Hotel, NY', featured: false },
  { id: 'e5', name: 'Hiking Singles Meetup', date: 'Jun 5, 2025', attendees: 34, status: 'Upcoming', location: 'Griffith Park, LA', featured: false },
];

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
            style={{ backgroundColor: '#232323', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
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

function StatsCards() {
  const { t } = useTranslation();
  const [apiStats, setApiStats] = useState<{ totalUsers?: number; activeToday?: number; totalMatches?: number; pendingReports?: number } | null>(null);
  useEffect(() => { getAdminStats().then(setApiStats).catch(() => {}); }, []);
  const stats = [
    { label: 'admin.totalUsers', value: apiStats?.totalUsers?.toLocaleString() ?? '…', icon: Users, color: '#BB83C9', bg: 'rgba(187,131,201,0.12)' },
    { label: 'admin.activeToday', value: apiStats?.activeToday?.toLocaleString() ?? '…', icon: Activity, color: '#7DE0B3', bg: 'rgba(125,224,179,0.15)' },
    { label: 'admin.totalMatches', value: apiStats?.totalMatches?.toLocaleString() ?? '…', icon: Heart, color: '#E86A6A', bg: 'rgba(232,106,106,0.12)' },
    { label: 'admin.pendingReports', value: apiStats?.pendingReports?.toLocaleString() ?? '…', icon: AlertTriangle, color: '#F0B84A', bg: 'rgba(240,184,74,0.15)' },
  ];

  return (
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
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: s.bg }}
            >
              <Icon size={18} style={{ color: s.color }} strokeWidth={2} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[#232323] tracking-tight" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.72px' }}>
                {s.value}
              </p>
              <p className="text-xs font-medium text-[#232323] opacity-50 mt-0.5" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {t(s.label)}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Reports Moderation ─────────────────────────────────

function ReportsModeration({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Resolved'>('All');
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  useEffect(() => {
    getPendingReports().then((data) => {
      if (data && data.length > 0) setReports(data as unknown as Report[]);
    }).catch(() => {});
  }, []);

  const filtered = reports.filter((r) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return r.status === 'Pending';
    if (filter === 'Resolved') return r.status === 'Resolved' || r.status === 'Auto-Resolved';
    return true;
  });

  const handleWarn = (id: string) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Resolved' as const } : r)));
    showToast('User warned successfully');
  };
  const handleBan = (id: string) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Resolved' as const } : r)));
    showToast('User banned successfully');
  };
  const handleDismiss = (id: string) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Resolved' as const } : r)));
    showToast('Report dismissed');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
          {t('admin.reportsModeration')}
        </h2>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(232,106,106,0.12)', color: '#E86A6A' }}>
          {reports.filter((r) => r.status === 'Pending').length} pending
        </span>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'All' | 'Pending' | 'Resolved')}>
        <TabsList className="w-full bg-[#E8E2D8] rounded-xl p-1">
          <TabsTrigger value="All" className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#232323] data-[state=active]:shadow-sm text-[#232323]/50">{t('admin.all')}</TabsTrigger>
          <TabsTrigger value="Pending" className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#232323] data-[state=active]:shadow-sm text-[#232323]/50">{t('admin.pending')}</TabsTrigger>
          <TabsTrigger value="Resolved" className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#232323] data-[state=active]:shadow-sm text-[#232323]/50">{t('admin.resolved')}</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-3 space-y-2">
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
                  style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                >
                  <AccordionTrigger className="hover:no-underline py-3 [&>svg]:text-[#232323]/30">
                    <div className="flex items-center gap-3 flex-1 pr-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={report.reportedUser.avatar} alt={report.reportedUser.name} />
                        <AvatarFallback>{report.reportedUser.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#232323]">{report.reportedUser.name}</span>
                          <span className="text-[10px] font-medium text-[#232323]/30">{report.timestamp}</span>
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
                        <p className="text-sm text-[#232323]/70">{report.details}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#232323]/40">
                        <span>{t('admin.reportedBy')}</span>
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={report.reporter.avatar} />
                          <AvatarFallback>{report.reporter.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-[#232323]/60">{report.reporter.name}</span>
                      </div>
                      {report.status === 'Pending' && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-full text-xs font-semibold bg-[#F0B84A] text-[#232323] hover:bg-[#F0B84A]/90"
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
                            className="flex-1 h-9 rounded-full text-xs font-semibold border-[#E8E2D8] text-[#232323]/60 hover:bg-[#F7F4EE]"
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
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
  useEffect(() => {
    getAdminUsers().then((data) => {
      if (data && data.length > 0) setUsers(data as unknown as AppUser[]);
    }).catch(() => {});
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBanUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'Banned' as const } : u)));
    showToast('User banned successfully');
    setSelectedUser(null);
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
        <h2 className="text-lg font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
          {t('admin.userManagement')}
        </h2>
        <span className="text-xs font-medium text-[#232323]/40">{users.length} users</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#232323]/30" />
        <Input
          placeholder={t('admin.searchUsers')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-xl border-0 bg-white text-sm text-[#232323] placeholder:text-[#232323]/30 focus-visible:ring-[#BB83C9]/20"
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
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <Avatar className="w-11 h-11">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#232323] truncate">{user.name}</span>
                {getStatusBadge(user.status)}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${getTrustColor(user.trustScore)}15`, color: getTrustColor(user.trustScore) }}
                >
                  TS {user.trustScore}
                </span>
                <span className="text-xs text-[#232323]/30">{user.joinDate}</span>
              </div>
            </div>
            <ChevronDown size={16} className="text-[#232323]/20 -rotate-90" />
          </motion.button>
        ))}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        {selectedUser && (
          <DialogContent className="max-w-[340px] rounded-2xl border-0 p-0 overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="p-6 space-y-5">
              <DialogHeader className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                    <AvatarFallback className="text-xl">{selectedUser.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                      {selectedUser.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#232323]/40 mt-1">
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

              <Separator className="bg-[#E8E2D8]" />

              <div>
                <h4 className="text-sm font-semibold text-[#232323] mb-2">{t('admin.bio')}</h4>
                <p className="text-sm text-[#232323]/60">{selectedUser.bio}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#232323] mb-2">{t('admin.trustHistory')}</h4>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E2D8' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedUser.trustScore}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: getTrustColor(selectedUser.trustScore) }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#232323]/30 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              {selectedUser.badges.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#232323] mb-2">{t('admin.badges')}</h4>
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
                <div className="rounded-xl p-3" style={{ backgroundColor: '#F7F4EE' }}>
                  <p className="text-lg font-semibold text-[#232323]">{selectedUser.matches}</p>
                  <p className="text-[10px] text-[#232323]/40">{t('admin.matches')}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: '#F7F4EE' }}>
                  <p className="text-lg font-semibold text-[#232323]">{selectedUser.badges.length}</p>
                  <p className="text-[10px] text-[#232323]/40">{t('admin.badges')}</p>
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full h-11 rounded-full font-semibold bg-[#BB83C9] text-white hover:bg-[#9A63A8]"
                  onClick={() => { showToast('Viewing profile...'); setSelectedUser(null); }}
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
  const [clubs, setClubs] = useState<Club[]>(MOCK_CLUBS);

  const handleApprove = (id: string) => {
    setClubs((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'Active' as const } : c)));
    showToast('Club approved');
  };
  const handleReject = (id: string) => {
    setClubs((prev) => prev.filter((c) => c.id !== id));
    showToast('Club rejected and removed');
  };
  const handleDelete = (id: string) => {
    setClubs((prev) => prev.filter((c) => c.id !== id));
    showToast('Club deleted');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
          {t('admin.clubManagement')}
        </h2>
        <span className="text-xs font-medium text-[#232323]/40">{clubs.length} clubs</span>
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
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-[#232323]">{club.name}</h3>
                <p className="text-xs text-[#232323]/40 mt-0.5">{club.category} &middot; by {club.createdBy}</p>
              </div>
              {club.status === 'Pending Review' ? (
                <Badge className="bg-[rgba(240,184,74,0.15)] text-[#F0B84A] hover:bg-[rgba(240,184,74,0.15)] text-[10px]">{t('admin.pending')}</Badge>
              ) : (
                <Badge className="bg-[rgba(125,224,179,0.15)] text-[#5BC492] hover:bg-[rgba(125,224,179,0.15)] text-[10px]">{t('admin.active')}</Badge>
              )}
            </div>

            <div className="flex gap-4 text-xs text-[#232323]/50 mb-3">
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
                  className="flex-1 h-8 rounded-full text-xs font-semibold bg-[#7DE0B3] text-[#232323] hover:bg-[#5BC492]"
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
                className="w-full h-8 rounded-full text-xs font-semibold border-[#E8E2D8] text-[#232323]/50 hover:bg-[#F7F4EE] hover:text-[#E86A6A] hover:border-[#E86A6A]"
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
  const [events, setEvents] = useState<AppEvent[]>(MOCK_EVENTS);

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast('Event deleted');
  };
  const handleFeature = (id: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, featured: !e.featured } : e)));
    showToast(events.find((e) => e.id === id)?.featured ? 'Event unfeatured' : 'Event featured');
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return { bg: 'rgba(187,131,201,0.12)', color: '#9A63A8' };
      case 'Ongoing': return { bg: 'rgba(125,224,179,0.15)', color: '#5BC492' };
      case 'Past': return { bg: 'rgba(232,226,216,0.5)', color: '#232323]/40' };
      default: return { bg: '#E8E2D8', color: '#232323' };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
          {t('admin.eventManagement')}
        </h2>
        <span className="text-xs font-medium text-[#232323]/40">{events.length} events</span>
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
              style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#232323] truncate">{evt.name}</h3>
                    {evt.featured && <Star size={14} className="text-[#F0B84A] flex-shrink-0" fill="#F0B84A" />}
                  </div>
                  <p className="text-xs text-[#232323]/40 mt-0.5">{evt.location}</p>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: st.bg, color: st.color }}
                >
                  {evt.status}
                </span>
              </div>

              <div className="flex gap-4 text-xs text-[#232323]/50 mb-3">
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
                  className="flex-1 h-8 rounded-full text-xs font-semibold border-[#E8E2D8] text-[#232323]/60 hover:bg-[#F7F4EE]"
                  onClick={() => showToast('Edit mode opened')}
                >
                  <Edit3 size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 rounded-full text-xs font-semibold border-[#E8E2D8] text-[#F0B84A] hover:bg-[#F0B84A]/10 hover:border-[#F0B84A]"
                  onClick={() => handleFeature(evt.id)}
                >
                  <Star size={14} className="mr-1" />
                  {evt.featured ? 'Unfeature' : 'Feature'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 rounded-full text-xs font-semibold border-[#E8E2D8] text-[#E86A6A] hover:bg-[#E86A6A]/10 hover:border-[#E86A6A]"
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
    </div>
  );
}

// ── Manual Actions ─────────────────────────────────────

function ManualActions({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const [awardUser, setAwardUser] = useState('');
  const [awardBadge, setAwardBadge] = useState('');
  const [trustUser, setTrustUser] = useState('');
  const [trustScoreValue, setTrustScoreValue] = useState(50);

  const handleAwardBadge = () => {
    if (!awardUser || !awardBadge) return;
    showToast(`Awarded "${awardBadge}" to ${awardUser}`);
    setAwardUser('');
    setAwardBadge('');
  };

  const handleAdjustTrust = () => {
    if (!trustUser) return;
    showToast(`Trust score adjusted to ${trustScoreValue} for ${trustUser}`);
    setTrustUser('');
  };

  const [adminUsers, setAdminUsers] = useState(MOCK_USERS);
  useEffect(() => { getAdminUsers().then((d) => { if (d?.length) setAdminUsers(d as unknown as AppUser[]); }).catch(() => {}); }, []);
  const userNames = adminUsers.map((u) => u.name);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
        {t('admin.manualActions')}
      </h2>

      <div className="p-5 rounded-2xl space-y-4" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h3 className="text-sm font-semibold text-[#232323] flex items-center gap-2">
          <Award size={16} className="text-[#BB83C9]" />
          {t('admin.awardBadge')}
        </h3>

        <div className="space-y-3">
          <Select value={awardUser} onValueChange={setAwardUser}>
            <SelectTrigger className="w-full h-11 rounded-xl border-[#E8E2D8] text-sm text-[#232323]">
              <SelectValue placeholder={t('admin.selectUser')} />
            </SelectTrigger>
            <SelectContent>
              {userNames.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={awardBadge} onValueChange={setAwardBadge}>
            <SelectTrigger className="w-full h-11 rounded-xl border-[#E8E2D8] text-sm text-[#232323]">
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
            disabled={!awardUser || !awardBadge}
          >
            {t('admin.awardBadge')}
          </Button>
        </div>
      </div>

      <div className="p-5 rounded-2xl space-y-4" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <h3 className="text-sm font-semibold text-[#232323] flex items-center gap-2">
          <Activity size={16} className="text-[#7DE0B3]" />
          {t('admin.adjustTrust')}
        </h3>

        <div className="space-y-3">
          <Select value={trustUser} onValueChange={setTrustUser}>
            <SelectTrigger className="w-full h-11 rounded-xl border-[#E8E2D8] text-sm text-[#232323]">
              <SelectValue placeholder={t('admin.selectUser')} />
            </SelectTrigger>
            <SelectContent>
              {userNames.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <div className="flex justify-between text-xs text-[#232323]/50 mb-2">
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
            <div className="flex justify-between text-[10px] text-[#232323]/30 mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <Button
            className="w-full h-11 rounded-full font-semibold bg-[#7DE0B3] text-[#232323] hover:bg-[#5BC492]"
            onClick={handleAdjustTrust}
            disabled={!trustUser}
          >
            {t('admin.adjustTrust')}
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
    if (!isLoading && (!user || (user as { role?: string }).role !== 'ADMIN')) {
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
    <Layout title="Admin Panel" showBack onBack={() => navigate('/profile')} rightAction={rightAction} hideFooter>
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
            className="text-2xl font-semibold text-[#232323]"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.72px' }}
          >
            {t('admin.panel')}
          </h1>
          <p className="text-sm text-[#232323]/40 mt-1">{t('admin.subtitle')}</p>
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

        {/* Manual Actions */}
        <ManualActions showToast={showToast} />

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </Layout>
  );
}
