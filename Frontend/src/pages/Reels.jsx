import { useEffect, useState, useRef, useCallback } from "react";
import { AiFillHeart, AiOutlineHeart, AiOutlineComment, AiOutlineSend } from "react-icons/ai";
import { BsBookmark, BsBookmarkFill, BsMusicNote, BsX } from "react-icons/bs";
import { HiDotsHorizontal } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { AiOutlineHome, AiFillHome } from "react-icons/ai";
import { BiSearch } from "react-icons/bi";
import { BsCameraVideo, BsCameraVideoFill } from "react-icons/bs";
import { IoNotificationsOutline, IoNotifications, IoChatbubbleOutline, IoChatbubble } from "react-icons/io5";
import { useSelector } from "react-redux";
import Avatar from "../components/Avatar";
import ShareModal from "../components/ShareModal";
import api from "../api/api";
import { formatDistanceToNow } from "../utils/time";

// ── Reels Bottom Nav ───────────────────────────────────────
function ReelsBottomNav() {
  const { currentUser } = useSelector((s) => s.user);
  const tabs = [
    { to: "/",              end: true, A: <AiFillHome size={24} />,        I: <AiOutlineHome size={24} /> },
    { to: "/search",                   A: <BiSearch size={24} />,           I: <BiSearch size={24} /> },
    { to: "/reels",                    A: <BsCameraVideoFill size={22} />,  I: <BsCameraVideo size={22} /> },
    { to: "/messages",                 A: <IoChatbubble size={22} />,       I: <IoChatbubbleOutline size={22} /> },
    { to: "/notifications",            A: <IoNotifications size={24} />,    I: <IoNotificationsOutline size={24} /> },
  ];
  return (
    <div className="flex items-center h-[52px] w-full shrink-0"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className="flex-1 flex items-center justify-center h-full">
          {({ isActive }) => (
            <motion.span whileTap={{ scale: 0.7 }} className="flex items-center justify-center"
              style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.45)" }}>
              {isActive ? tab.A : tab.I}
            </motion.span>
          )}
        </NavLink>
      ))}
      <NavLink to="/profile" className="flex-1 flex items-center justify-center h-full">
        {({ isActive }) => (
          <motion.div whileTap={{ scale: 0.7 }}>
            <Avatar src={currentUser?.avatar} name={currentUser?.name} username={currentUser?.username} size={26}
              className={isActive ? "ring-2 ring-white" : "opacity-50"} />
          </motion.div>
        )}
      </NavLink>
    </div>
  );
}

// ── Comments Modal for Reels ───────────────────────────────
function ReelComments({ postId, onClose }) {
  const { currentUser } = useSelector((s) => s.user);
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/posts/${postId}/comments?limit=50`)
      .then(({ data }) => setComments(data.comments || []))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { text: text.trim() });
      setComments((prev) => [data, ...prev]);
      setText("");
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl overflow-hidden"
      style={{ height: "65%", background: "rgba(15,15,20,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-white font-semibold text-sm">Comments</p>
        <motion.button whileTap={{ scale: 0.85 }} onClick={onClose}>
          <BsX size={22} className="text-white/60" />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin border-white/40" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center py-8 text-sm text-white/40">No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id || c._id} className="flex items-start gap-3">
              <Avatar src={c.author?.avatar} name={c.author?.name} username={c.author?.username} size={32} />
              <div className="flex-1">
                <p className="text-sm text-white">
                  <span className="font-semibold mr-1">{c.author?.username}</span>
                  <span className="text-white/80">{c.text}</span>
                </p>
                <p className="text-xs text-white/40 mt-0.5">{formatDistanceToNow(c.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit}
        className="px-4 py-3 shrink-0 flex items-center gap-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Avatar src={currentUser?.avatar} name={currentUser?.name} username={currentUser?.username} size={30} />
        <input value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-transparent text-sm outline-none text-white placeholder-white/30" />
        {text.trim() && (
          <motion.button type="submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            disabled={submitting}
            className="text-sm font-semibold disabled:opacity-50"
            style={{ color: "var(--accent)" }}>
            Post
          </motion.button>
        )}
      </form>
    </motion.div>
  );
}

// ── Reel Item ──────────────────────────────────────────────
function ReelItem({ post, isActive }) {
  const { currentUser } = useSelector((s) => s.user);
  const [liked, setLiked]           = useState(post.liked);
  const [likes, setLikes]           = useState(post._count?.likes ?? 0);
  const [commentCount, setCommentCount] = useState(post._count?.comments ?? 0);
  const [saved, setSaved]           = useState(false);
  const [showHeart, setShowHeart]   = useState(false);
  const [followStatus, setFollowStatus] = useState("none");
  const [showShare, setShowShare]   = useState(false);
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef(null);

  const isOwn = (post.author?.id || post.author?._id)?.toString() === (currentUser?._id || currentUser?.id)?.toString();

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) videoRef.current.play().catch(() => {});
    else { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  }, [isActive]);

  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev); setLikes((l) => prev ? l - 1 : l + 1);
    try {
      const { data } = await api.post(`/posts/${post.id}/like`);
      setLiked(data.liked); setLikes(data.likes);
    } catch { setLiked(prev); setLikes((l) => prev ? l + 1 : l - 1); }
  };

  const handleDoubleTap = () => {
    if (!liked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 900);
  };

  const handleFollow = async () => {
    const authorId = post.author?.id || post.author?._id;
    if (!authorId) return;
    try {
      const { data } = await api.post(`/users/${authorId}/follow`);
      setFollowStatus(data.status === "followed" ? "following" : data.status === "requested" ? "requested" : "none");
    } catch {}
  };

  const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <>
      <AnimatePresence>
        {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
      </AnimatePresence>

      <div className="relative w-full snap-start overflow-hidden"
        style={{ height: "100%", background: "#000" }}
        onDoubleClick={handleDoubleTap}>

        <video ref={videoRef} src={post.mediaUrl}
          className="absolute inset-0 w-full h-full object-cover"
          loop muted playsInline preload="auto" />

        {/* Gradients */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 40%, transparent 65%)" }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 18%)" }} />

        {/* Double-tap heart */}
        <AnimatePresence>
          {showHeart && (
            <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0, scale: 1.5 }} transition={{ duration: 0.35 }}>
              <AiFillHeart size={110} style={{ color: "#fff", filter: "drop-shadow(0 0 30px rgba(255,255,255,0.6))" }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-white text-xl font-bold drop-shadow" style={{ fontFamily: "Sora, sans-serif" }}>Reels</span>
          <motion.button whileTap={{ scale: 0.85 }}>
            <HiDotsHorizontal size={24} className="text-white drop-shadow" />
          </motion.button>
        </div>

        {/* Right action buttons */}
        <div className="absolute right-3 z-20 flex flex-col items-center gap-5" style={{ bottom: 90 }}>
          {/* Like */}
          <motion.button whileTap={{ scale: 1.3 }} onClick={handleLike} className="flex flex-col items-center gap-1">
            <AnimatePresence mode="wait">
              {liked ? (
                <motion.span key="y" initial={{ scale: 0.4 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <AiFillHeart size={32} style={{ color: "#ed4956" }} />
                </motion.span>
              ) : (
                <motion.span key="n" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                  <AiOutlineHeart size={32} className="text-white" />
                </motion.span>
              )}
            </AnimatePresence>
            <span className="text-white text-xs font-semibold drop-shadow">{fmt(likes)}</span>
          </motion.button>

          {/* Comment */}
          <motion.button whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-1"
            onClick={() => setShowComments(true)}>
            <AiOutlineComment size={30} className="text-white" style={{ transform: "scaleX(-1)" }} />
            <span className="text-white text-xs font-semibold drop-shadow">{fmt(commentCount)}</span>
          </motion.button>

          {/* Share */}
          <motion.button whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-1"
            onClick={() => setShowShare(true)}>
            <AiOutlineSend size={28} className="text-white" />
            <span className="text-white text-xs font-semibold drop-shadow">Share</span>
          </motion.button>

          {/* Save */}
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setSaved(!saved)}>
            {saved
              ? <BsBookmarkFill size={26} style={{ color: "var(--accent)" }} />
              : <BsBookmark size={26} className="text-white" />}
          </motion.button>

          {/* Author avatar */}
          <div className="mt-1 rounded-full overflow-hidden border-2 border-white" style={{ width: 38, height: 38 }}>
            <Link to={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()}>
              <Avatar src={post.author?.avatar} name={post.author?.name} username={post.author?.username} size={38} />
            </Link>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute left-0 right-16 z-20 px-4" style={{ bottom: 20 }}>
          <div className="flex items-center gap-2 mb-2">
            <Link to={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()}>
              <Avatar src={post.author?.avatar} name={post.author?.name} username={post.author?.username} size={34} />
            </Link>
            <Link to={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()}>
              <span className="text-white font-semibold text-sm drop-shadow">{post.author?.username}</span>
            </Link>
            {!isOwn && followStatus === "none" && (
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleFollow(); }}
                className="text-white text-xs font-semibold px-3 py-[3px] rounded-full ml-1"
                style={{ border: "1.5px solid rgba(255,255,255,0.8)" }}>
                Follow
              </motion.button>
            )}
            {followStatus === "following" && (
              <span className="text-white/60 text-xs ml-1">Following</span>
            )}
            {followStatus === "requested" && (
              <span className="text-white/60 text-xs ml-1">Requested</span>
            )}
          </div>
          {post.caption && <p className="text-white text-sm leading-snug mb-1 drop-shadow line-clamp-2">{post.caption}</p>}
          <div className="flex items-center gap-2">
            <BsMusicNote size={11} className="text-white/60" />
            <span className="text-white/60 text-xs">Original audio · {post.author?.username}</span>
            <span className="text-white/40 text-xs">· {formatDistanceToNow(post.createdAt)}</span>
          </div>
        </div>

        {/* Comments panel */}
        <AnimatePresence>
          {showComments && (
            <ReelComments
              postId={post.id || post._id}
              onClose={() => setShowComments(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ── Main Reels Page ────────────────────────────────────────
export default function Reels() {
  const navigate = useNavigate();
  const [posts, setPosts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeIdx, setActiveIdx]     = useState(0);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const containerRef = useRef(null);

  const loadReels = useCallback(async (p = 1) => {
    try {
      const { data } = await api.get(`/posts/reels?page=${p}&limit=5`);
      if (p === 1) setPosts(data.posts || []);
      else setPosts((prev) => [...prev, ...(data.posts || [])]);
      setHasMore(data.hasMore ?? false);
      setPage(p);
    } catch {}
  }, []);

  useEffect(() => {
    loadReels(1).finally(() => setLoading(false));
  }, [loadReels]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const el  = containerRef.current;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setActiveIdx(idx);
    if (idx >= posts.length - 2 && hasMore && !loadingMore) {
      setLoadingMore(true);
      loadReels(page + 1).finally(() => setLoadingMore(false));
    }
  }, [posts.length, hasMore, loadingMore, page, loadReels]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#000" }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
    </div>
  );

  if (posts.length === 0) return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#000" }}>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <p className="text-white text-xl font-semibold mb-2">No videos yet</p>
        <p className="text-white/50 text-sm mb-6">Upload a video post to see it here.</p>
        <motion.button whileTap={{ scale: 0.94 }} onClick={() => navigate("/create")}
          className="px-6 py-2 rounded-full text-sm font-semibold text-white"
          style={{ border: "1.5px solid rgba(255,255,255,0.5)" }}>
          Create Post
        </motion.button>
      </div>
      <ReelsBottomNav />
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#000" }}>
      <div ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
        onScroll={handleScroll}>
        {posts.map((post, i) => (
          <div key={post.id || post._id} className="snap-start" style={{ height: "100%" }}>
            <ReelItem post={post} isActive={i === activeIdx} />
          </div>
        ))}
        {loadingMore && (
          <div className="snap-start flex items-center justify-center" style={{ height: "100%" }}>
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        )}
      </div>
      <ReelsBottomNav />
    </div>
  );
}
