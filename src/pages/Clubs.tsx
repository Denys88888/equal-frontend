import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getClubs, joinClub, leaveClub, createPost, getPosts, togglePostLike, getClubMessages, sendClubMessage } from '@/api/clubs';
import { useClubSocket, type IncomingClubMessage } from '@/hooks/useSocket';
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
            backgroundColor: online ? '#5BC492' : 'var(--linen-dark)',
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
  const { t } = useTranslation();
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className="w-full rounded-[20px] p-4 flex items-center gap-3 text-left"
      style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: club.gradient }}
      >
        {categoryIcons[club.icon] || <Users size={24} color="#fff" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-[var(--charcoal)] truncate" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {club.name}
        </h3>
        <p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(var(--charcoal-rgb), 0.4)' }}>
          {t(`clubs.club_cat_${club.category.toLowerCase()}`, { defaultValue: club.category })}
        </p>
        <p className="text-sm truncate" style={{ color: 'rgba(var(--charcoal-rgb), 0.6)' }}>
          {club.latestPostPreview}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {club.unread && (
          <span className="w-5 h-5 rounded-full bg-[#E86A6A] text-white text-[10px] font-semibold flex items-center justify-center">
            {club.unread}
          </span>
        )}
        <span className="text-[11px]" style={{ color: 'rgba(var(--charcoal-rgb), 0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
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
      style={{ width: 140, height: 170, backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: club.gradient }}
      >
        {categoryIcons[club.icon] || <Users size={20} color="#fff" />}
      </div>
      <p className="text-sm font-semibold text-[var(--charcoal)] line-clamp-2 leading-tight" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
        {club.name}
      </p>
      <p className="text-[11px]" style={{ color: 'rgba(var(--charcoal-rgb), 0.4)' }}>
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
  const { t } = useTranslation();
  const [animating, setAnimating] = useState(false);

  const handleLike = () => {
    setAnimating(true);
    onLike();
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div
      className="rounded-[20px] p-4"
      style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 1px 8px rgba(0,0,0,0.03)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <AvatarCircle initials={post.authorAvatar} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--charcoal)]">{post.authorName}</span>
            <button
              onClick={onMeet}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
              style={{ backgroundColor: '#BB83C9' }}
            >
              {t('clubs.meet')}
            </button>
          </div>
          <span className="text-xs" style={{ color: 'rgba(var(--charcoal-rgb), 0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
            {post.timestamp}
          </span>
        </div>
      </div>

      <p className="text-base text-[var(--charcoal)] leading-relaxed mb-3">{post.content}</p>

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
              className={post.liked ? 'text-[#E86A6A]' : 'text-[var(--charcoal)]'}
              fill={post.liked ? '#E86A6A' : 'none'}
              style={{ opacity: post.liked ? 1 : 0.4 }}
            />
          </motion.div>
          <span className="text-sm" style={{ color: 'rgba(var(--charcoal-rgb), 0.5)' }}>{post.likes}</span>
        </button>
        <button className="flex items-center gap-1.5">
          <MessageCircle size={20} strokeWidth={2} style={{ color: 'rgba(var(--charcoal-rgb), 0.4)' }} />
          <span className="text-sm" style={{ color: 'rgba(var(--charcoal-rgb), 0.5)' }}>{post.comments}</span>
        </button>
        <button
          onClick={async () => {
            const text = `${post.authorName}: ${post.content}`;
            if (navigator.share) {
              try { await navigator.share({ text }); } catch { /* user cancelled the share sheet */ }
            } else {
              await navigator.clipboard.writeText(text).catch(() => {});
            }
          }}
          className="flex items-center gap-1.5"
        >
          <Share2 size={20} strokeWidth={2} style={{ color: 'rgba(var(--charcoal-rgb), 0.4)' }} />
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
  const { t } = useTranslation();
  const [detailTab, setDetailTab] = useState<'feed' | 'chat' | 'members'>('feed');
  const [newPostText, setNewPostText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState(club.posts);
  const [chatMessages, setChatMessages] = useState(club.chat);
  const [joined, setJoined] = useState(club.joined);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleLike = (postId: string) => {
    // Optimistic, then reconciled with the server's count
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
    togglePostLike(postId)
      .then(({ likes, likedByMe }) => {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes, liked: likedByMe } : p)));
      })
      .catch(() => {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
          )
        );
      });
  };

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    const optimistic: ChatMessage = {
      id: `ch-${Date.now()}`,
      authorId: 'me',
      authorName: 'You',
      authorAvatar: 'YO',
      content: text,
      timestamp: 'Just now',
    };
    setChatMessages((prev) => [...prev, optimistic]);
    try {
      // Club chat used to live only in this component's state — messages were
      // lost on reload and no other member ever saw them.
      const saved = await sendClubMessage(club.id, text);
      setChatMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, id: saved.id } : m))
      );
    } catch {
      setChatMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setChatInput(text);
    }
  };

  const handleCreatePost = () => {
    const text = newPostText.trim();
    if (!text) return;
    const post: Post = {
      id: `p-${Date.now()}`,
      authorId: 'me',
      authorName: 'You',
      authorAvatar: 'YO',
      content: text,
      likes: 0,
      comments: 0,
      liked: false,
      timestamp: 'Just now',
    };
    setPosts((prev) => [post, ...prev]);
    setNewPostText('');
    setShowCreatePost(false);
    createPost(club.id, { content: text }).catch(() => {});
  };

  const toggleJoin = () => {
    const newJoined = !joined;
    setJoined(newJoined);
    onUpdateClub({ ...club, joined: newJoined, memberCount: newJoined ? club.memberCount + 1 : club.memberCount - 1 });
    (newJoined ? joinClub(club.id) : leaveClub(club.id)).catch(() => {
      // revert on error
      setJoined(!newJoined);
      onUpdateClub({ ...club, joined: !newJoined, memberCount: !newJoined ? club.memberCount + 1 : club.memberCount - 1 });
    });
  };

  // Load the real feed and chat history for this club
  useEffect(() => {
    getPosts(club.id)
      .then((apiPosts) => {
        if (!apiPosts) return;
        setPosts(apiPosts.map((p) => ({
          id: p.id,
          authorId: p.authorId,
          authorName: p.authorName,
          authorAvatar: (p.authorName || '?').slice(0, 2).toUpperCase(),
          content: p.content,
          likes: p.likes ?? 0,
          comments: 0,
          liked: (p as unknown as { likedByMe?: boolean }).likedByMe ?? false,
          timestamp: new Date(p.createdAt).toLocaleDateString(),
        } as Post)));
      })
      .catch(() => {});
  }, [club.id]);

  useEffect(() => {
    if (!joined) return;
    getClubMessages(club.id)
      .then((msgs) => {
        if (!msgs) return;
        setChatMessages(msgs.map((m) => ({
          id: m.id,
          authorId: m.authorId,
          authorName: m.authorName,
          authorAvatar: (m.authorName || '?').slice(0, 2).toUpperCase(),
          content: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        } as ChatMessage)));
      })
      .catch(() => {});
  }, [club.id, joined]);

  // Live messages from other members
  useClubSocket(joined ? club.id : undefined, useCallback((msg: IncomingClubMessage) => {
    setChatMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, {
        id: msg.id,
        authorId: msg.authorId,
        authorName: msg.authorName,
        authorAvatar: (msg.authorName || '?').slice(0, 2).toUpperCase(),
        content: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      } as ChatMessage];
    });
  }, []));

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
      style={{ backgroundColor: 'var(--linen)' }}
    >
      {/* Club Header */}
      <div className="relative" style={{ background: club.gradient, height: 120 }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="absolute top-3 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(var(--card-rgb), 0.72)', backdropFilter: 'blur(12px)' }}
        >
          <ChevronLeft size={24} className="text-[var(--charcoal)]" strokeWidth={2} />
        </motion.button>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center border-4"
            style={{ background: club.gradient, borderColor: 'var(--linen)' }}
          >
            {categoryIcons[club.icon] || <Users size={28} color="#fff" />}
          </div>
        </div>
      </div>

      <div className="pt-10 pb-3 px-5 text-center">
        <h1 className="text-2xl font-bold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {club.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(var(--charcoal-rgb), 0.5)' }}>
          {t('clubs.membersPosts', { members: club.memberCount, posts: posts.length })}
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
          {joined ? t('clubs.leave') : t('clubs.joinClub')}
        </button>
      </div>

      {/* Detail Tabs */}
      <div className="px-5 flex gap-6 border-b" style={{ borderColor: 'var(--linen-dark)' }}>
        {(['feed', 'chat', 'members'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setDetailTab(tab)}
            className="pb-2.5 text-sm font-semibold capitalize relative"
            style={{
              color: detailTab === tab ? 'var(--charcoal)' : 'rgba(var(--charcoal-rgb), 0.4)',
            }}
          >
            {t(`clubs.tab_${tab}`)}
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
                  <p className="text-sm" style={{ color: 'rgba(var(--charcoal-rgb), 0.5)' }}>{t('clubs.noPosts')}</p>
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
                <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b" style={{ borderColor: 'var(--linen-dark)' }}>
                  {club.members.filter((m) => m.online).map((m) => (
                    <div key={m.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                      <AvatarCircle initials={m.avatar} size={40} online />
                      <span className="text-[10px] font-medium" style={{ color: 'rgba(var(--charcoal-rgb), 0.5)' }}>{m.name.split(' ')[0]}</span>
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
                        <span className="text-[11px] font-medium ml-1" style={{ color: 'rgba(var(--charcoal-rgb), 0.5)' }}>{msg.authorName}</span>
                      )}
                      <div
                        className="rounded-[18px] px-4 py-2.5 text-sm leading-relaxed"
                        style={{
                          backgroundColor: msg.authorId === 'me' ? '#BB83C9' : 'rgba(var(--linen-rgb), 0.6)',
                          color: msg.authorId === 'me' ? '#fff' : 'var(--charcoal)',
                          borderRadius: msg.authorId === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        }}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] mt-1 block" style={{ color: 'rgba(var(--charcoal-rgb), 0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 flex items-center gap-2 border-t" style={{ borderColor: 'var(--linen-dark)' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t('clubs.typeMessage')}
                  className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: 'rgba(var(--linen-rgb), 0.4)', color: 'var(--charcoal)' }}
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
                  style={{ backgroundColor: 'var(--card-bg)' }}
                >
                  <AvatarCircle initials={member.avatar} size={40} online={member.online} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--charcoal)]">{member.name}</p>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{
                        backgroundColor: member.role === 'admin' ? 'rgba(187,131,201,0.15)' : member.role === 'moderator' ? 'rgba(123,196,232,0.15)' : 'rgba(var(--linen-rgb), 0.4)',
                        color: member.role === 'admin' ? '#9A63A8' : member.role === 'moderator' ? '#5AA8D0' : 'rgba(var(--charcoal-rgb), 0.4)',
                      }}
                    >
                      {t(`clubs.role_${member.role}`, { defaultValue: member.role })}
                    </span>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: '#BB83C9' }}
                  >
                    {t('clubs.meet')}
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
        <SheetContent side="bottom" className="rounded-t-[24px] p-6 max-h-[80vh]" style={{ backgroundColor: 'var(--card-bg)' }}>
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {t('clubs.newPost')}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder={t('clubs.sharePost')}
              className="w-full rounded-xl p-4 text-base outline-none resize-none"
              style={{ backgroundColor: 'rgba(var(--linen-rgb), 0.3)', minHeight: 100, color: 'var(--charcoal)' }}
            />
            <div className="flex items-center justify-between mt-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(var(--linen-rgb), 0.4)' }}>
                <Camera size={18} style={{ color: 'rgba(var(--charcoal-rgb), 0.4)' }} />
                <span className="text-xs font-medium" style={{ color: 'rgba(var(--charcoal-rgb), 0.4)' }}>{t('clubs.photo')}</span>
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPostText.trim()}
                className="px-6 py-3 rounded-full text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: '#BB83C9' }}
              >
                {t('clubs.post')}
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
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);

  useEffect(() => {
    getClubs()
      .then((apiClubs) => {
        if (!apiClubs || apiClubs.length === 0) return;
        setClubs(apiClubs.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? '',
          category: c.category ?? 'Other',
          icon: c.icon ?? '🌟',
          gradient: categoryGradients[c.category as keyof typeof categoryGradients] ?? 'from-purple-400 to-pink-400',
          memberCount: (c as unknown as { memberCount?: number }).memberCount ?? 0,
          joined: (c as unknown as { isJoined?: boolean }).isJoined ?? false,
          members: [],
          posts: [],
          chat: [],
        } as Club)));
      })
      .catch(() => {})
      .finally(() => setClubsLoading(false));
  }, []);
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
    joinClub(clubId).catch(() => {
      setClubs((prev) =>
        prev.map((c) => (c.id === clubId ? { ...c, joined: false, memberCount: c.memberCount - 1 } : c))
      );
    });
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
      title={t('nav.clubs')}
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
        <div className="px-5 flex gap-6 border-b" style={{ borderColor: 'var(--linen-dark)' }}>
          <button
            onClick={() => setMainTab('myclubs')}
            className="pb-2.5 text-sm font-semibold relative"
            style={{ color: mainTab === 'myclubs' ? 'var(--charcoal)' : 'rgba(var(--charcoal-rgb), 0.4)' }}
          >
            {t('clubs.myClubs')}
            {mainTab === 'myclubs' && (
              <motion.div layoutId="main-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#BB83C9]" />
            )}
          </button>
          <button
            onClick={() => setMainTab('discover')}
            className="pb-2.5 text-sm font-semibold relative"
            style={{ color: mainTab === 'discover' ? 'var(--charcoal)' : 'rgba(var(--charcoal-rgb), 0.4)' }}
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
                {clubsLoading ? (
                  <div className="flex flex-col gap-3">
                    {[0,1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-[rgba(var(--charcoal-rgb),0.06)] animate-pulse" />)}
                  </div>
                ) : myClubs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <img src="./empty-clubs.png" alt="" className="w-40 h-40 mb-4 object-contain" />
                    <h2 className="text-xl font-semibold text-[var(--charcoal)]">{t('clubs.noClubs')}</h2>
                    <p className="text-sm mt-2 text-center max-w-[280px]" style={{ color: 'rgba(var(--charcoal-rgb), 0.6)' }}>
                      {t('clubs.noClubsDesc')}
                    </p>
                    <button
                      onClick={() => setMainTab('discover')}
                      className="mt-4 px-6 py-3 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: '#BB83C9' }}
                    >
                      {t('clubs.exploreClubs')}
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
                {clubsLoading ? (
                  <div className="flex flex-col gap-3 px-5 pt-4">
                    {[0,1,2].map(i => <div key={i} className="h-28 rounded-2xl bg-[rgba(var(--charcoal-rgb),0.06)] animate-pulse" />)}
                  </div>
                ) : null}
                {!clubsLoading && categories.map((category) => {
                  const catClubs = clubs.filter((c) => c.category === category);
                  if (catClubs.length === 0) return null;
                  return (
                    <div key={category} className="mb-4">
                      {/* "See All" removed: catClubs already renders every club in
                          this category with no pagination, so there was nothing
                          left for the button to reveal — it never did anything. */}
                      <div className="px-5 py-3">
                        <h4 className="text-base font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                          {category}
                        </h4>
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
                  style={{ borderColor: '#BB83C9', backgroundColor: 'var(--card-bg)' }}
                >
                  <Plus size={32} className="text-[#BB83C9]" />
                  <span className="text-base font-semibold text-[var(--charcoal)]">{t('clubs.createYourOwn')}</span>
                  <span className="text-xs" style={{ color: 'rgba(var(--charcoal-rgb), 0.4)' }}>{t('clubs.itsFree')}</span>
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
          <DialogContent className="rounded-[20px] max-w-[340px] p-6 border-0" style={{ backgroundColor: 'var(--card-bg)' }}>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {t('clubs.createClub')}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t('clubs.clubName')}
                className="w-full rounded-xl px-4 py-3 text-base outline-none border-2 border-transparent focus:border-[#BB83C9] transition-colors"
                style={{ backgroundColor: 'rgba(var(--linen-rgb), 0.3)', color: 'var(--charcoal)' }}
              />
              <textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder={t('clubs.clubDesc')}
                className="w-full rounded-xl px-4 py-3 text-base outline-none border-2 border-transparent focus:border-[#BB83C9] transition-colors resize-none"
                style={{ backgroundColor: 'rgba(var(--linen-rgb), 0.3)', minHeight: 80, color: 'var(--charcoal)' }}
                maxLength={200}
              />
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(var(--charcoal-rgb), 0.5)' }}>Category</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {categories.slice(0, 6).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCreateCategory(cat)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        backgroundColor: createCategory === cat ? '#BB83C9' : 'rgba(var(--linen-rgb), 0.4)',
                        color: createCategory === cat ? '#fff' : 'var(--charcoal)',
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
