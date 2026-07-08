import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getClubs } from '@/api/clubs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Heart,
  MessageCircle,
  Share2,
  Send,
  ChevronLeft,
  Users,
  Trophy,
  Music,
  BookOpen,
  Plane,
  UtensilsCrossed,
  Code2,
  Dumbbell,
  Camera,
  Palette,
  Gamepad2,
  Film,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'moderator' | 'member';
  online: boolean;
}

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  liked: boolean;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  gradient: string;
  memberCount: number;
  joined: boolean;
  unread?: number;
  lastActivity?: string;
  latestPostPreview?: string;
  members: Member[];
  posts: Post[];
  chat: ChatMessage[];
}

/* ------------------------------------------------------------------ */
/*  CATEGORY CONFIG                                                    */
/* ------------------------------------------------------------------ */

const categoryGradients: Record<string, string> = {
  Sports: 'linear-gradient(135deg, #7DE0B3, #5BC492)',
  Movies: 'linear-gradient(135deg, #BB83C9, #9A63A8)',
  Tech: 'linear-gradient(135deg, #7BC4E8, #5AA8D0)',
  Travel: 'linear-gradient(135deg, #F0B84A, #D99E3A)',
  Cooking: 'linear-gradient(135deg, #E86A6A, #D45555)',
  Music: 'linear-gradient(135deg, #BB83C9, #7BC4E8)',
  Reading: 'linear-gradient(135deg, #7DE0B3, #A8EBCC)',
  Gaming: 'linear-gradient(135deg, #9A63A8, #BB83C9)',
  Fitness: 'linear-gradient(135deg, #5BC492, #7DE0B3)',
  Art: 'linear-gradient(135deg, #F0B84A, #E8A0D0)',
};

const categoryIcons: Record<string, React.ReactNode> = {
  Sports: <Trophy size={24} color="#fff" />,
  Movies: <Film size={24} color="#fff" />,
  Tech: <Code2 size={24} color="#fff" />,
  Travel: <Plane size={24} color="#fff" />,
  Cooking: <UtensilsCrossed size={24} color="#fff" />,
  Music: <Music size={24} color="#fff" />,
  Reading: <BookOpen size={24} color="#fff" />,
  Gaming: <Gamepad2 size={24} color="#fff" />,
  Fitness: <Dumbbell size={24} color="#fff" />,
  Art: <Palette size={24} color="#fff" />,
  Photography: <Camera size={24} color="#fff" />,
  Other: <Users size={24} color="#fff" />,
};

/* ------------------------------------------------------------------ */
/*  MOCK DATA                                                          */
/* ------------------------------------------------------------------ */

const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: 'Sarah Chen', avatar: 'SC', role: 'admin', online: true },
  { id: 'm2', name: 'Jake Miller', avatar: 'JM', role: 'moderator', online: true },
  { id: 'm3', name: 'Priya Patel', avatar: 'PP', role: 'member', online: false },
  { id: 'm4', name: 'Lucas Kim', avatar: 'LK', role: 'member', online: true },
  { id: 'm5', name: 'Emma Wilson', avatar: 'EW', role: 'member', online: false },
  { id: 'm6', name: 'Diego Lopez', avatar: 'DL', role: 'member', online: true },
  { id: 'm7', name: 'Ava Johnson', avatar: 'AJ', role: 'member', online: false },
  { id: 'm8', name: 'Noah Brown', avatar: 'NB', role: 'member', online: true },
];

const initialClubs: Club[] = [
  {
    id: 'c1',
    name: 'Weekend Hikers',
    description: 'We explore local trails every weekend. All skill levels welcome!',
    category: 'Sports',
    icon: 'Sports',
    gradient: categoryGradients.Sports,
    memberCount: 248,
    joined: true,
    unread: 3,
    lastActivity: '10m ago',
    latestPostPreview: 'Just posted photos from today\'s sunrise hike at Mount Tam...',
    members: MOCK_MEMBERS.slice(0, 6),
    posts: [
      { id: 'p1', authorId: 'm1', authorName: 'Sarah Chen', authorAvatar: 'SC', content: 'Just posted photos from today\'s sunrise hike at Mount Tam! The fog was incredible. Who\'s joining next week?', likes: 14, comments: 5, liked: false, timestamp: '10m ago' },
      { id: 'p2', authorId: 'm4', authorName: 'Lucas Kim', authorAvatar: 'LK', content: 'Found a new trail near Baker Beach. Moderate difficulty, amazing ocean views. DM me for the GPS pin!', likes: 8, comments: 3, liked: true, timestamp: '2h ago' },
    ],
    chat: [
      { id: 'ch1', authorId: 'm1', authorName: 'Sarah Chen', authorAvatar: 'SC', content: 'Hey everyone! Planning next weekend\'s hike. Vote on the poll above!', timestamp: '10:30 AM' },
      { id: 'ch2', authorId: 'm2', authorName: 'Jake Miller', authorAvatar: 'JM', content: 'I\'m in for Sunday! Saturday is booked for me.', timestamp: '10:32 AM' },
      { id: 'ch3', authorId: 'm4', authorName: 'Lucas Kim', authorAvatar: 'LK', content: 'Sunday works. Should we carpool from downtown?', timestamp: '10:35 AM' },
      { id: 'ch4', authorId: 'm6', authorName: 'Diego Lopez', authorAvatar: 'DL', content: 'I can drive! Have room for 3 more.', timestamp: '10:40 AM' },
    ],
  },
  {
    id: 'c2',
    name: 'Cinephile Society',
    description: 'For movie lovers who enjoy everything from blockbusters to arthouse cinema.',
    category: 'Movies',
    icon: 'Movies',
    gradient: categoryGradients.Movies,
    memberCount: 512,
    joined: true,
    lastActivity: '1h ago',
    latestPostPreview: 'Dune: Part Two review — absolutely masterpiece cinematography...',
    members: MOCK_MEMBERS.slice(0, 5),
    posts: [
      { id: 'p3', authorId: 'm2', authorName: 'Jake Miller', authorAvatar: 'JM', content: 'Dune: Part Two review — absolutely masterpiece cinematography. Villeneuve is unmatched. 10/10', likes: 32, comments: 12, liked: false, timestamp: '1h ago' },
      { id: 'p4', authorId: 'm3', authorName: 'Priya Patel', authorAvatar: 'PP', content: 'Hosting a movie night this Friday! We\'re watching The Grand Budapest Hotel. Popcorn provided.', likes: 18, comments: 8, liked: false, timestamp: '3h ago' },
    ],
    chat: [
      { id: 'ch5', authorId: 'm2', authorName: 'Jake Miller', authorAvatar: 'JM', content: 'Anyone seen the new Wicked adaptation?', timestamp: '9:00 AM' },
      { id: 'ch6', authorId: 'm3', authorName: 'Priya Patel', authorAvatar: 'PP', content: 'Yes! Absolutely magical. The songs gave me chills.', timestamp: '9:15 AM' },
    ],
  },
  {
    id: 'c3',
    name: 'Tech & Code',
    description: 'Developers, designers, and tech enthusiasts sharing knowledge and building together.',
    category: 'Tech',
    icon: 'Tech',
    gradient: categoryGradients.Tech,
    memberCount: 189,
    joined: true,
    unread: 1,
    lastActivity: '30m ago',
    latestPostPreview: 'Just launched my new React Native app built on Pi SDK...',
    members: MOCK_MEMBERS.slice(0, 7),
    posts: [
      { id: 'p5', authorId: 'm4', authorName: 'Lucas Kim', authorAvatar: 'LK', content: 'Just launched my new React Native app built on Pi SDK! Check it out and let me know what you think.', likes: 24, comments: 9, liked: false, timestamp: '30m ago' },
    ],
    chat: [
      { id: 'ch7', authorId: 'm4', authorName: 'Lucas Kim', authorAvatar: 'LK', content: 'Has anyone experimented with Pi payments in a webapp?', timestamp: '11:00 AM' },
      { id: 'ch8', authorId: 'm6', authorName: 'Diego Lopez', authorAvatar: 'DL', content: 'Yes! The SDK is pretty straightforward. Happy to help if you need.', timestamp: '11:05 AM' },
    ],
  },
  {
    id: 'c4',
    name: 'Wanderlust Travel',
    description: 'Share travel stories, tips, and plan group adventures around the world.',
    category: 'Travel',
    icon: 'Travel',
    gradient: categoryGradients.Travel,
    memberCount: 743,
    joined: false,
    members: MOCK_MEMBERS.slice(0, 5),
    posts: [
      { id: 'p6', authorId: 'm5', authorName: 'Emma Wilson', authorAvatar: 'EW', content: 'Back from Bali! Here are my top 5 hidden gems that most tourists miss. ', likes: 45, comments: 15, liked: false, timestamp: '5h ago' },
    ],
    chat: [
      { id: 'ch9', authorId: 'm5', authorName: 'Emma Wilson', authorAvatar: 'EW', content: 'Planning a group trip to Japan next spring!', timestamp: 'Yesterday' },
    ],
  },
  {
    id: 'c5',
    name: 'Home Cooks',
    description: 'Share recipes, cooking tips, and food photos. Weekly cook-along events!',
    category: 'Cooking',
    icon: 'Cooking',
    gradient: categoryGradients.Cooking,
    memberCount: 325,
    joined: false,
    members: MOCK_MEMBERS.slice(0, 4),
    posts: [
      { id: 'p7', authorId: 'm7', authorName: 'Ava Johnson', authorAvatar: 'AJ', content: 'My grandmother\'s pasta sauce recipe — passed down 3 generations. The secret is a pinch of sugar!', likes: 67, comments: 22, liked: false, timestamp: '6h ago' },
    ],
    chat: [],
  },
  {
    id: 'c6',
    name: 'Indie Vibes',
    description: 'Discover and discuss independent music across all genres.',
    category: 'Music',
    icon: 'Music',
    gradient: categoryGradients.Music,
    memberCount: 198,
    joined: false,
    members: MOCK_MEMBERS.slice(0, 4),
    posts: [
      { id: 'p8', authorId: 'm8', authorName: 'Noah Brown', authorAvatar: 'NB', content: 'Just discovered this amazing band from Iceland — Kaleo. Blues rock meets Nordic atmosphere.', likes: 12, comments: 4, liked: false, timestamp: '8h ago' },
    ],
    chat: [],
  },
  {
    id: 'c7',
    name: 'Book Club',
    description: 'Monthly book picks and thoughtful discussions over wine.',
    category: 'Reading',
    icon: 'Reading',
    gradient: categoryGradients.Reading,
    memberCount: 156,
    joined: false,
    members: MOCK_MEMBERS.slice(0, 5),
    posts: [
      { id: 'p9', authorId: 'm3', authorName: 'Priya Patel', authorAvatar: 'PP', content: 'This month\'s pick: "Tomorrow, and Tomorrow, and Tomorrow" by Gabrielle Zevin. Thoughts so far?', likes: 19, comments: 11, liked: false, timestamp: '4h ago' },
    ],
    chat: [],
  },
  {
    id: 'c8',
    name: 'Fitness Crew',
    description: 'Workout buddies, motivation, and fitness challenges.',
    category: 'Fitness',
    icon: 'Fitness',
    gradient: categoryGradients.Fitness,
    memberCount: 289,
    joined: false,
    members: MOCK_MEMBERS.slice(0, 6),
    posts: [
      { id: 'p10', authorId: 'm6', authorName: 'Diego Lopez', authorAvatar: 'DL', content: '30-day plank challenge starting Monday! Who\'s in? We share daily progress.', likes: 31, comments: 14, liked: false, timestamp: '2h ago' },
    ],
    chat: [],
  },
  {
    id: 'c9',
    name: 'Pixel Artists',
    description: 'Digital art, photography, and creative expression.',
    category: 'Art',
    icon: 'Art',
    gradient: categoryGradients.Art,
    memberCount: 134,
    joined: false,
    members: MOCK_MEMBERS.slice(0, 4),
    posts: [
      { id: 'p11', authorId: 'm1', authorName: 'Sarah Chen', authorAvatar: 'SC', content: 'Just finished this digital landscape. Procreate + 6 hours of patience.', likes: 28, comments: 7, liked: false, timestamp: '12h ago', image: '/event-featured.jpg' },
    ],
    chat: [],
  },
  {
    id: 'c10',
    name: 'Game Night',
    description: 'Board games, video games, and everything fun. Weekly meetups!',
    category: 'Gaming',
    icon: 'Gaming',
    gradient: categoryGradients.Gaming,
    memberCount: 267,
    joined: false,
    members: MOCK_MEMBERS.slice(0, 5),
    posts: [
      { id: 'p12', authorId: 'm2', authorName: 'Jake Miller', authorAvatar: 'JM', content: 'Catan tournament this Saturday! Winner gets bragging rights + pizza.', likes: 22, comments: 10, liked: false, timestamp: '1d ago' },
    ],
    chat: [],
  },
];

const categories = ['Sports', 'Movies', 'Tech', 'Travel', 'Cooking', 'Music', 'Reading', 'Gaming', 'Fitness', 'Art'];

/* ------------------------------------------------------------------ */
/*  AVATAR COMPONENT                                                   */
/* ------------------------------------------------------------------ */

function AvatarCircle({ initials, size = 36, online }: { initials: string; size?: number; online?: boolean }) {
  const colors = ['#BB83C9', '#7DE0B3', '#7BC4E8', '#F0B84A', '#E86A6A'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className="relative flex-shrink-0">
      <div
        className="rounded-full flex items-center justify-center text-white font-semibold"
        style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
      {online !== undefined && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            backgroundColor: online ? '#5BC492' : '#E8E2D8',
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CLUB CARD (MY CLUBS)                                               */
/* ------------------------------------------------------------------ */

function MyClubCard({ club, onClick }: { club: Club; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className="w-full rounded-[20px] p-4 flex items-center gap-3 text-left"
      style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: club.gradient }}
      >
        {categoryIcons[club.icon] || <Users size={24} color="#fff" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-[#232323] truncate" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {club.name}
        </h3>
        <p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(35,35,35,0.4)' }}>
          {club.category}
        </p>
        <p className="text-sm truncate" style={{ color: 'rgba(35,35,35,0.6)' }}>
          {club.latestPostPreview}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {club.unread && (
          <span className="w-5 h-5 rounded-full bg-[#E86A6A] text-white text-[10px] font-semibold flex items-center justify-center">
            {club.unread}
          </span>
        )}
        <span className="text-[11px]" style={{ color: 'rgba(35,35,35,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
          {club.lastActivity}
        </span>
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  DISCOVER CLUB CARD                                                 */
/* ------------------------------------------------------------------ */

function DiscoverClubCard({ club, onClick, onJoin }: { club: Club; onClick: () => void; onJoin: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className="flex-shrink-0 rounded-[20px] p-4 flex flex-col items-center text-center gap-2"
      style={{ width: 140, height: 170, backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: club.gradient }}
      >
        {categoryIcons[club.icon] || <Users size={20} color="#fff" />}
      </div>
      <p className="text-sm font-semibold text-[#232323] line-clamp-2 leading-tight" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
        {club.name}
      </p>
      <p className="text-[11px]" style={{ color: 'rgba(35,35,35,0.4)' }}>
        {club.memberCount} members
      </p>
      <div
        role="button"
        onClick={(e) => { e.stopPropagation(); onJoin(); }}
        className="mt-auto px-4 py-1 rounded-full text-xs font-semibold text-white cursor-pointer"
        style={{ backgroundColor: '#BB83C9' }}
      >
        Join
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  POST CARD                                                          */
/* ------------------------------------------------------------------ */

function PostCard({ post, onLike, onMeet }: { post: Post; onLike: () => void; onMeet: () => void }) {
  const [animating, setAnimating] = useState(false);

  const handleLike = () => {
    setAnimating(true);
    onLike();
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div
      className="rounded-[20px] p-4"
      style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 8px rgba(0,0,0,0.03)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <AvatarCircle initials={post.authorAvatar} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#232323]">{post.authorName}</span>
            <button
              onClick={onMeet}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
              style={{ backgroundColor: '#BB83C9' }}
            >
              Meet
            </button>
          </div>
          <span className="text-xs" style={{ color: 'rgba(35,35,35,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
            {post.timestamp}
          </span>
        </div>
      </div>

      <p className="text-base text-[#232323] leading-relaxed mb-3">{post.content}</p>

      {post.image && (
        <img src={post.image} alt="" className="w-full rounded-xl mb-3 object-cover max-h-[300px]" />
      )}

      <div className="flex items-center gap-5">
        <button onClick={handleLike} className="flex items-center gap-1.5 relative">
          <motion.div
            animate={animating ? { scale: [0.6, 1.3, 1] } : {}}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
          >
            <Heart
              size={20}
              strokeWidth={2}
              className={post.liked ? 'text-[#E86A6A]' : 'text-[#232323]'}
              fill={post.liked ? '#E86A6A' : 'none'}
              style={{ opacity: post.liked ? 1 : 0.4 }}
            />
          </motion.div>
          <span className="text-sm" style={{ color: 'rgba(35,35,35,0.5)' }}>{post.likes}</span>
        </button>
        <button className="flex items-center gap-1.5">
          <MessageCircle size={20} strokeWidth={2} style={{ color: 'rgba(35,35,35,0.4)' }} />
          <span className="text-sm" style={{ color: 'rgba(35,35,35,0.5)' }}>{post.comments}</span>
        </button>
        <button className="flex items-center gap-1.5">
          <Share2 size={20} strokeWidth={2} style={{ color: 'rgba(35,35,35,0.4)' }} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CLUB DETAIL VIEW                                                   */
/* ------------------------------------------------------------------ */

function ClubDetail({
  club,
  onBack,
  onUpdateClub,
}: {
  club: Club;
  onBack: () => void;
  onUpdateClub: (updated: Club) => void;
}) {
  const [detailTab, setDetailTab] = useState<'feed' | 'chat' | 'members'>('feed');
  const [newPostText, setNewPostText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState(club.posts);
  const [chatMessages, setChatMessages] = useState(club.chat);
  const [joined, setJoined] = useState(club.joined);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `ch-${Date.now()}`,
      authorId: 'me',
      authorName: 'You',
      authorAvatar: 'YO',
      content: chatInput.trim(),
      timestamp: 'Just now',
    };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput('');
  };

  const handleCreatePost = () => {
    if (!newPostText.trim()) return;
    const post: Post = {
      id: `p-${Date.now()}`,
      authorId: 'me',
      authorName: 'You',
      authorAvatar: 'YO',
      content: newPostText.trim(),
      likes: 0,
      comments: 0,
      liked: false,
      timestamp: 'Just now',
    };
    setPosts((prev) => [post, ...prev]);
    setNewPostText('');
    setShowCreatePost(false);
  };

  const toggleJoin = () => {
    setJoined(!joined);
    onUpdateClub({ ...club, joined: !joined, memberCount: joined ? club.memberCount - 1 : club.memberCount + 1 });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="absolute inset-0 z-10 flex flex-col"
      style={{ backgroundColor: '#F7F4EE' }}
    >
      {/* Club Header */}
      <div className="relative" style={{ background: club.gradient, height: 120 }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="absolute top-3 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)' }}
        >
          <ChevronLeft size={24} className="text-[#232323]" strokeWidth={2} />
        </motion.button>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center border-4"
            style={{ background: club.gradient, borderColor: '#F7F4EE' }}
          >
            {categoryIcons[club.icon] || <Users size={28} color="#fff" />}
          </div>
        </div>
      </div>

      <div className="pt-10 pb-3 px-5 text-center">
        <h1 className="text-2xl font-bold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {club.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(35,35,35,0.5)' }}>
          {club.memberCount} members &bull; {posts.length} posts
        </p>
        <button
          onClick={toggleJoin}
          className="mt-3 px-6 py-2 rounded-full text-sm font-semibold transition-all"
          style={{
            backgroundColor: joined ? 'transparent' : '#BB83C9',
            color: joined ? '#BB83C9' : '#fff',
            border: joined ? '1.5px solid #BB83C9' : 'none',
          }}
        >
          {joined ? 'Leave' : 'Join Club'}
        </button>
      </div>

      {/* Detail Tabs */}
      <div className="px-5 flex gap-6 border-b" style={{ borderColor: '#E8E2D8' }}>
        {(['feed', 'chat', 'members'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setDetailTab(tab)}
            className="pb-2.5 text-sm font-semibold capitalize relative"
            style={{
              color: detailTab === tab ? '#232323' : 'rgba(35,35,35,0.4)',
            }}
          >
            {tab}
            {detailTab === tab && (
              <motion.div
                layoutId="club-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: '#BB83C9' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {detailTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 flex flex-col gap-3"
            >
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post.id)}
                  onMeet={() => {}}
                />
              ))}
              {posts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-sm" style={{ color: 'rgba(35,35,35,0.5)' }}>No posts yet. Be the first!</p>
                </div>
              )}
            </motion.div>
          )}

          {detailTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* Online members */}
              {club.members.filter((m) => m.online).length > 0 && (
                <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b" style={{ borderColor: '#E8E2D8' }}>
                  {club.members.filter((m) => m.online).map((m) => (
                    <div key={m.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                      <AvatarCircle initials={m.avatar} size={40} online />
                      <span className="text-[10px] font-medium" style={{ color: 'rgba(35,35,35,0.5)' }}>{m.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.authorId === 'me' ? 'flex-row-reverse' : ''}`}>
                    {msg.authorId !== 'me' && <AvatarCircle initials={msg.authorAvatar} size={28} />}
                    <div className={`max-w-[75%] ${msg.authorId === 'me' ? 'items-end' : ''}`}>
                      {msg.authorId !== 'me' && (
                        <span className="text-[11px] font-medium ml-1" style={{ color: 'rgba(35,35,35,0.5)' }}>{msg.authorName}</span>
                      )}
                      <div
                        className="rounded-[18px] px-4 py-2.5 text-sm leading-relaxed"
                        style={{
                          backgroundColor: msg.authorId === 'me' ? '#BB83C9' : 'rgba(232,226,216,0.6)',
                          color: msg.authorId === 'me' ? '#fff' : '#232323',
                          borderRadius: msg.authorId === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        }}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] mt-1 block" style={{ color: 'rgba(35,35,35,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 flex items-center gap-2 border-t" style={{ borderColor: '#E8E2D8' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: 'rgba(232,226,216,0.4)', color: '#232323' }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSendMessage}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#BB83C9' }}
                >
                  <Send size={18} color="#fff" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {detailTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 flex flex-col gap-2"
            >
              {club.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ backgroundColor: '#FFFFFF' }}
                >
                  <AvatarCircle initials={member.avatar} size={40} online={member.online} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#232323]">{member.name}</p>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{
                        backgroundColor: member.role === 'admin' ? 'rgba(187,131,201,0.15)' : member.role === 'moderator' ? 'rgba(123,196,232,0.15)' : 'rgba(232,226,216,0.4)',
                        color: member.role === 'admin' ? '#9A63A8' : member.role === 'moderator' ? '#5AA8D0' : 'rgba(35,35,35,0.4)',
                      }}
                    >
                      {member.role}
                    </span>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: '#BB83C9' }}
                  >
                    Meet
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Post FAB */}
      {detailTab === 'feed' && joined && (
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreatePost(true)}
          className="absolute bottom-20 right-5 w-14 h-14 rounded-full flex items-center justify-center z-20"
          style={{ backgroundColor: '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.4)' }}
        >
          <Plus size={24} color="#fff" />
        </motion.button>
      )}

      {/* Create Post Bottom Sheet */}
      <Sheet open={showCreatePost} onOpenChange={setShowCreatePost}>
        <SheetContent side="bottom" className="rounded-t-[24px] p-6 max-h-[80vh]" style={{ backgroundColor: '#fff' }}>
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              New Post
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Share something with the club..."
              className="w-full rounded-xl p-4 text-base outline-none resize-none"
              style={{ backgroundColor: 'rgba(232,226,216,0.3)', minHeight: 100, color: '#232323' }}
            />
            <div className="flex items-center justify-between mt-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(232,226,216,0.4)' }}>
                <Camera size={18} style={{ color: 'rgba(35,35,35,0.4)' }} />
                <span className="text-xs font-medium" style={{ color: 'rgba(35,35,35,0.4)' }}>Photo</span>
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPostText.trim()}
                className="px-6 py-3 rounded-full text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: '#BB83C9' }}
              >
                Post
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN CLUBS PAGE                                                    */
/* ------------------------------------------------------------------ */

export default function Clubs() {
  const { t } = useTranslation();
  const [mainTab, setMainTab] = useState<'myclubs' | 'discover'>('myclubs');
  const [clubs, setClubs] = useState(initialClubs);

  const mergeApiClubs = useCallback((apiClubs: Awaited<ReturnType<typeof getClubs>>) => {
    if (!apiClubs || apiClubs.length === 0) return;
    setClubs((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const newClubs = apiClubs
        .filter((c) => !existingIds.has(c.id))
        .map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? '',
          category: c.category ?? 'Other',
          icon: c.icon ?? '🌟',
          gradient: 'from-purple-400 to-pink-400',
          memberCount: (c as unknown as { memberCount?: number }).memberCount ?? 0,
          joined: (c as unknown as { isJoined?: boolean }).isJoined ?? false,
          members: [],
          posts: [],
          chat: [],
        } as Club));
      return newClubs.length > 0 ? [...prev, ...newClubs] : prev;
    });
  }, []);

  useEffect(() => {
    getClubs().then(mergeApiClubs).catch(() => {});
  }, [mergeApiClubs]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCategory, setCreateCategory] = useState('Sports');

  const myClubs = clubs.filter((c) => c.joined);

  const handleJoin = (clubId: string) => {
    setClubs((prev) =>
      prev.map((c) => (c.id === clubId ? { ...c, joined: true, memberCount: c.memberCount + 1 } : c))
    );
  };

  const handleUpdateClub = (updated: Club) => {
    setClubs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleCreateClub = () => {
    if (!createName.trim() || createName.length < 3) return;
    const newClub: Club = {
      id: `c-${Date.now()}`,
      name: createName.trim(),
      description: createDesc.trim() || `A community for ${createCategory.toLowerCase()} enthusiasts.`,
      category: createCategory,
      icon: createCategory,
      gradient: categoryGradients[createCategory] || categoryGradients.Other,
      memberCount: 1,
      joined: true,
      members: [{ id: 'me', name: 'You', avatar: 'YO', role: 'admin', online: true }],
      posts: [],
      chat: [],
    };
    setClubs((prev) => [newClub, ...prev]);
    setCreateName('');
    setCreateDesc('');
    setShowCreateModal(false);
  };

  return (
    <Layout
      title="Clubs"
      rightAction={
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreateModal(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
        >
          <Plus size={24} className="text-[#BB83C9]" strokeWidth={2} />
        </motion.button>
      }
    >
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Main Tabs */}
        <div className="px-5 flex gap-6 border-b" style={{ borderColor: '#E8E2D8' }}>
          <button
            onClick={() => setMainTab('myclubs')}
            className="pb-2.5 text-sm font-semibold relative"
            style={{ color: mainTab === 'myclubs' ? '#232323' : 'rgba(35,35,35,0.4)' }}
          >
            {t('clubs.myClubs')}
            {mainTab === 'myclubs' && (
              <motion.div layoutId="main-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#BB83C9]" />
            )}
          </button>
          <button
            onClick={() => setMainTab('discover')}
            className="pb-2.5 text-sm font-semibold relative"
            style={{ color: mainTab === 'discover' ? '#232323' : 'rgba(35,35,35,0.4)' }}
          >
            {t('clubs.discover')}
            {mainTab === 'discover' && (
              <motion.div layoutId="main-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#BB83C9]" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {mainTab === 'myclubs' && (
              <motion.div
                key="myclubs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="p-4 flex flex-col gap-3"
              >
                {myClubs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <img src="./empty-clubs.png" alt="" className="w-40 h-40 mb-4 object-contain" />
                    <h2 className="text-xl font-semibold text-[#232323]">{t('clubs.noClubs')}</h2>
                    <p className="text-sm mt-2 text-center max-w-[280px]" style={{ color: 'rgba(35,35,35,0.6)' }}>
                      {t('clubs.noClubsDesc')}
                    </p>
                    <button
                      onClick={() => setMainTab('discover')}
                      className="mt-4 px-6 py-3 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: '#BB83C9' }}
                    >
                      Explore Clubs
                    </button>
                  </div>
                ) : (
                  myClubs.map((club, index) => (
                    <motion.div
                      key={club.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    >
                      <MyClubCard club={club} onClick={() => setSelectedClub(club)} />
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {mainTab === 'discover' && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="pb-6"
              >
                {categories.map((category) => {
                  const catClubs = clubs.filter((c) => c.category === category);
                  if (catClubs.length === 0) return null;
                  return (
                    <div key={category} className="mb-4">
                      <div className="flex items-center justify-between px-5 py-3">
                        <h4 className="text-base font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                          {category}
                        </h4>
                        <button className="text-sm font-semibold text-[#BB83C9]">See all</button>
                      </div>
                      <div className="flex gap-3 px-5 overflow-x-auto pb-2">
                        {catClubs.map((club) => (
                          <DiscoverClubCard
                            key={club.id}
                            club={club}
                            onClick={() => setSelectedClub(club)}
                            onJoin={() => handleJoin(club.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Create Club CTA */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(true)}
                  className="mx-5 mt-2 w-[calc(100%-40px)] rounded-[20px] p-6 flex flex-col items-center gap-2 border-2 border-dashed"
                  style={{ borderColor: '#BB83C9', backgroundColor: '#FFFFFF' }}
                >
                  <Plus size={32} className="text-[#BB83C9]" />
                  <span className="text-base font-semibold text-[#232323]">Create your own club</span>
                  <span className="text-xs" style={{ color: 'rgba(35,35,35,0.4)' }}>It&apos;s free!</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Club Detail Overlay */}
        <AnimatePresence>
          {selectedClub && (
            <ClubDetail
              club={selectedClub}
              onBack={() => setSelectedClub(null)}
              onUpdateClub={handleUpdateClub}
            />
          )}
        </AnimatePresence>

        {/* Create Club Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="rounded-[20px] max-w-[340px] p-6 border-0" style={{ backgroundColor: '#FFFFFF' }}>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                Create a Club
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t('clubs.clubName')}
                className="w-full rounded-xl px-4 py-3 text-base outline-none border-2 border-transparent focus:border-[#BB83C9] transition-colors"
                style={{ backgroundColor: 'rgba(232,226,216,0.3)', color: '#232323' }}
              />
              <textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder={t('clubs.clubDesc')}
                className="w-full rounded-xl px-4 py-3 text-base outline-none border-2 border-transparent focus:border-[#BB83C9] transition-colors resize-none"
                style={{ backgroundColor: 'rgba(232,226,216,0.3)', minHeight: 80, color: '#232323' }}
                maxLength={200}
              />
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(35,35,35,0.5)' }}>Category</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {categories.slice(0, 6).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCreateCategory(cat)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        backgroundColor: createCategory === cat ? '#BB83C9' : 'rgba(232,226,216,0.4)',
                        color: createCategory === cat ? '#fff' : '#232323',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreateClub}
                disabled={!createName.trim() || createName.length < 3}
                className="w-full py-3.5 rounded-full text-base font-semibold text-white disabled:opacity-40 mt-2"
                style={{ backgroundColor: '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.3)' }}
              >
                {t('clubs.create')}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
