import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { likePost, deletePost } from "../redux/slices/postsSlice";
import { motion, AnimatePresence } from "framer-motion";
import { AiOutlineHeart, AiFillHeart, AiOutlineComment } from "react-icons/ai";
import { BsBookmark, BsBookmarkFill, BsSend, BsEmojiSmile, BsTrash, BsX } from "react-icons/bs";
import { HiDotsHorizontal } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import ShareModal from "./ShareModal";
import PostImage from "./PostImage";
import api from "../api/api";
import Avatar from "./Avatar";
import { formatDistanceToNow } from "../utils/time";

// ── Comments panel ──────────────────────────────────────────
function CommentsPanel({ post, onClose }) {
  const { currentUser } = useSelector((s) => s.user);
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEmoji, setShowEmoji]   = useState(false);
  const emojiRef = useRef(null);

  useEffect(() => {
    api.get(`/posts/${post.id}/comments?limit=50`)
      .then(({ data }) => setComments(data.comments || []))
      .finally(() => setLoading(false));
  }, [post.id]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${post.id}/comments`, { text: text.trim() });
      setComments((prev) => [data, ...prev]);
      setText("");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", maxHeight: "80vh", marginBottom: "0" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-sm font-bold" style={{ color: "var(--t1)" }}>Comments</h3>
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose} style={{ color: "var(--t3)" }}>
            <BsX size={22} />
          </motion.button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-hide">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full shrink-0" style={{ background: "var(--bg-skeleton)" }} />
                  <div className="flex-1">
                    <div className="h-3 rounded w-24 mb-1" style={{ background: "var(--bg-skeleton)" }} />
                    <div className="h-2 rounded w-40" style={{ background: "var(--bg-skeleton)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--t3)" }}>No comments yet. Be the first!</p>
          ) : (
            comments.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 group">
                <Link to={`/profile/${c.author?.username}`}>
                  <img src={c.author?.avatar || `https://i.pravatar.cc/150?u=${c.author?.id}`}
                    alt={c.author?.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--t1)" }}>
                    <Link to={`/profile/${c.author?.username}`}>
                      <span className="font-semibold mr-1">{c.author?.username}</span>
                    </Link>
                    <span style={{ color: "var(--t2)" }}>{c.text}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--t4)" }}>
                    {formatDistanceToNow(c.createdAt)}
                  </p>
                </div>
                {(c.author?.id === currentUser?.id || post.author?.id === currentUser?.id) && (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    style={{ color: "var(--t4)" }}>
                    <BsTrash size={13} />
                  </motion.button>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 shrink-0 flex items-center gap-3 relative"
          style={{ borderTop: "1px solid var(--border)" }}>
          {/* Emoji picker */}
          <div ref={emojiRef} className="relative">
            <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => setShowEmoji(!showEmoji)}>
              <BsEmojiSmile size={20} style={{ color: showEmoji ? "var(--accent)" : "var(--t3)" }} />
            </motion.button>
            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-10 left-0 z-50">
                  <EmojiPicker
                    onEmojiClick={(e) => { setText((t) => t + e.emoji); setShowEmoji(false); }}
                    theme="auto" height={380} width={300} searchDisabled={false}
                    previewConfig={{ showPreview: false }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <img src={currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUser?.id}`}
            alt="me" className="w-8 h-8 rounded-full object-cover shrink-0" />
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 rounded-full px-4 py-2"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
            <input
              value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--t1)" }}
            />
            <AnimatePresence>
              {text.trim() && (
                <motion.button type="submit" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }} disabled={submitting}
                  className="text-sm font-semibold grad-text disabled:opacity-50 shrink-0">
                  Post
                </motion.button>
              )}
            </AnimatePresence>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── PostCard ─────────────────────────────────────────────────
export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((s) => s.user);
  const [saved, setSaved]           = useState(post.saved || false);
  const [showHeart, setShowHeart]   = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare]   = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || "");
  const [editLoading, setEditLoading] = useState(false);

  const isOwn        = currentUser?.id === post.author?.id || currentUser?._id?.toString() === post.author?._id?.toString();
  const liked        = post.liked;
  const likeCount    = post._count?.likes ?? 0;
  const commentCount = post._count?.comments ?? 0;
  const avatar       = post.author?.avatar || `https://i.pravatar.cc/150?u=${post.author?.id}`;

  const handleDouble = () => {
    if (!liked) dispatch(likePost(post.id));
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 900);
  };

  const handleBookmark = async () => {
    setSaved(!saved);
    try { await api.post(`/posts/${post.id}/bookmark`); } catch { setSaved(saved); }
  };

  // Render caption with clickable hashtags and mentions
  const renderCaption = (text) => {
    if (!text) return null;
    const parts = text.split(/(#\w+|@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#")) return (
        <span key={i} className="cursor-pointer font-medium"
          style={{ color: "var(--accent)" }}
          onClick={() => navigate(`/hashtag/${part.slice(1)}`)}>
          {part}
        </span>
      );
      if (part.startsWith("@")) return (
        <Link key={i} to={`/profile/${part.slice(1)}`}
          className="font-medium" style={{ color: "var(--accent2)" }}>
          {part}
        </Link>
      );
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      <AnimatePresence>
        {showComments && <CommentsPanel post={post} onClose={() => setShowComments(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showEdit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-[400px] rounded-2xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="font-semibold text-sm" style={{ color: "var(--t1)", fontFamily: "Syne, sans-serif" }}>Edit Post</p>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowEdit(false)} style={{ color: "var(--t3)" }}>
                  <BsX size={22} />
                </motion.button>
              </div>
              <div className="p-4 space-y-3">
                <textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)}
                  rows={4} placeholder="Edit caption..."
                  className="app-input resize-none" style={{ borderRadius: 10 }} />
                <div className="flex gap-3">
                  <motion.button whileTap={{ scale: 0.94 }} onClick={() => setShowEdit(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}>
                    Cancel
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.94 }} disabled={editLoading}
                    onClick={async () => {
                      setEditLoading(true);
                      try {
                        await api.put(`/posts/${post.id}`, { caption: editCaption });
                        setShowEdit(false);
                        // Refresh feed
                        dispatch({ type: "posts/updateCaption", payload: { id: post.id, caption: editCaption } });
                      } catch {} finally { setEditLoading(false); }
                    }}
                    className="flex-1 grad-btn py-2.5 rounded-xl text-sm disabled:opacity-50">
                    {editLoading ? "Saving..." : "Save"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.article
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="post-card"
        style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--bg-surface)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={isOwn ? "/profile" : `/profile/${post.author?.username}`} className="flex items-center gap-3">
            <div className="p-[2px] rounded-full" style={{ background: "linear-gradient(135deg, var(--accent), #FF9A6C)" }}>
              <div className="p-[2px] rounded-full" style={{ background: "var(--bg-surface)" }}>
                <Avatar src={avatar} name={post.author?.name} username={post.author?.username} size={32} />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>{post.author?.username}</p>
              <p className="text-xs" style={{ color: "var(--t3)" }}>{formatDistanceToNow(post.createdAt)}</p>
            </div>
          </Link>

          <div className="relative">
            <motion.button whileTap={{ scale: 0.8 }} style={{ color: "var(--t3)" }}
              onClick={() => setShowMenu(!showMenu)}>
              <HiDotsHorizontal size={20} />
            </motion.button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-7 rounded-xl overflow-hidden z-20 min-w-[140px]"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  {isOwn && (
                    <>
                      <button onClick={() => { setShowEdit(true); setShowMenu(false); }}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-left"
                        style={{ color: "var(--t1)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                        Edit
                      </button>
                      <button onClick={() => { dispatch(deletePost(post.id)); setShowMenu(false); }}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-left"
                        style={{ color: "#f87171" }}>
                        <BsTrash size={14} /> Delete
                      </button>
                    </>
                  )}
                  <button onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-left"
                    style={{ color: "var(--t1)" }}>
                    Report
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Media */}
        {post.mediaUrl && (
          <div className="relative">
            {post.mediaType === "video" ? (
              <div className="relative select-none" onDoubleClick={handleDouble}>
                <video src={post.mediaUrl} controls className="w-full block" style={{ maxHeight: 580 }} />
                <AnimatePresence>
                  {showHeart && (
                    <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1.1 }}
                      exit={{ opacity: 0, scale: 1.5 }} transition={{ duration: 0.4 }}>
                      <AiFillHeart size={96} style={{ color: "#fff", filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))" }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <PostImage
                src={post.mediaUrl}
                alt={post.caption || "post"}
                onDoubleTap={() => { if (!liked) dispatch(likePost(post.id)); }}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button whileTap={{ scale: 1.35 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={() => dispatch(likePost(post.id))}>
              <AnimatePresence mode="wait">
                {liked ? (
                  <motion.span key="y" initial={{ scale: 0.4 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500 }}>
                    <AiFillHeart size={26} style={{ color: "var(--accent)" }} />
                  </motion.span>
                ) : (
                  <motion.span key="n" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                    <AiOutlineHeart size={26} style={{ color: "var(--t1)" }} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button whileTap={{ scale: 0.82 }} onClick={() => setShowComments(true)}>
              <AiOutlineComment size={26} style={{ color: "var(--t1)", transform: "scaleX(-1)" }} />
            </motion.button>

            <motion.button whileTap={{ scale: 0.82 }} whileHover={{ x: 3 }} onClick={() => setShowShare(true)}>
              <BsSend size={22} style={{ color: "var(--t1)" }} />
            </motion.button>
          </div>
          <motion.button whileTap={{ scale: 0.75 }} onClick={handleBookmark}>
            {saved
              ? <BsBookmarkFill size={22} style={{ color: "var(--accent)" }} />
              : <BsBookmark size={22} style={{ color: "var(--t1)" }} />}
          </motion.button>
        </div>

        {/* Likes */}
        <div className="px-4 pb-1">
          <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{likeCount.toLocaleString()} likes</p>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 pb-2">
            <p className="text-sm" style={{ color: "var(--t1)" }}>
              <span className="font-semibold mr-1">{post.author?.username}</span>
              <span style={{ color: "var(--t2)" }}>{renderCaption(post.caption)}</span>
            </p>
          </div>
        )}

        {/* View comments */}
        {commentCount > 0 && (
          <button onClick={() => setShowComments(true)} className="px-4 pb-2 block text-sm"
            style={{ color: "var(--t4)" }}>
            View all {commentCount} comments
          </button>
        )}

        {/* Quick comment input */}
        <div className="px-4 pb-3 pt-2 flex items-center gap-3"
          style={{ borderTop: "1px solid var(--border-soft)" }}>
          <BsEmojiSmile size={20} style={{ color: "var(--t3)" }} className="shrink-0" />
          <input type="text" placeholder="Add a comment..."
            onFocus={() => setShowComments(true)}
            className="flex-1 bg-transparent text-sm outline-none cursor-pointer"
            style={{ color: "var(--t1)" }} readOnly />
        </div>
      </motion.article>
    </>
  );
}
