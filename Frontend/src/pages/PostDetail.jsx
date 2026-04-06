import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { likePost, deletePost } from "../redux/slices/postsSlice";
import { motion, AnimatePresence } from "framer-motion";
import { AiOutlineHeart, AiFillHeart, AiOutlineComment } from "react-icons/ai";
import { BsBookmark, BsBookmarkFill, BsSend, BsTrash, BsArrowLeft, BsEmojiSmile, BsThreeDots } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import ShareModal from "../components/ShareModal";
import Avatar from "../components/Avatar";
import PostImage from "../components/PostImage";
import api from "../api/api";
import { formatDistanceToNow } from "../utils/time";

export default function PostDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const dispatch     = useDispatch();
  const { currentUser } = useSelector((s) => s.user);

  const [post, setPost]           = useState(null);
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved]         = useState(false);
  const [showMenu, setShowMenu]   = useState(false);
  const [liked, setLiked]         = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const emojiRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/posts/${id}`)
      .then(({ data }) => {
        setPost(data);
        setComments(data.comments || []);
        setLiked(data.liked);
        setLikeCount(data._count?.likes ?? 0);
        api.get(`/posts/${id}/bookmark`).then(({ data: b }) => setSaved(b.saved)).catch(() => {});
      })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount((c) => liked ? c - 1 : c + 1);
    try {
      const { data } = await api.post(`/posts/${id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likes);
      dispatch(likePost(id));
    } catch { setLiked(liked); setLikeCount(likeCount); }
  };

  const handleBookmark = async () => {
    setSaved(!saved);
    try { await api.post(`/posts/${id}/bookmark`); } catch { setSaved(saved); }
  };

  const handleComment = async (e) => {
    e?.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${id}/comments`, { text: text.trim() });
      setComments((prev) => [...prev, data]);
      setText("");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try { await dispatch(deletePost(id)).unwrap(); navigate(-1); } catch {}
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => (c.id || c._id)?.toString() !== commentId?.toString()));
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
    </div>
  );

  if (!post) return null;

  const isOwn  = (currentUser?.id || currentUser?._id)?.toString() === (post.author?.id || post.author?._id)?.toString();
  const avatar = post.author?.avatar || `https://i.pravatar.cc/150?u=${post.author?.id}`;

  return (
    <>
      <AnimatePresence>
        {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10 app-header">
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => navigate(-1)} style={{ color: "var(--t1)" }}>
          <BsArrowLeft size={20} />
        </motion.button>
        <h1 className="text-base font-semibold flex-1"
          style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>Post</h1>
        <div className="relative">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowMenu(!showMenu)}
            style={{ color: "var(--t3)" }}>
            <BsThreeDots size={20} />
          </motion.button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 top-9 rounded-xl overflow-hidden z-20 min-w-[150px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                {isOwn && (
                  <button onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-left"
                    style={{ color: "var(--danger)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <BsTrash size={13} /> Delete
                  </button>
                )}
                <button onClick={() => setShowMenu(false)}
                  className="w-full px-4 py-3 text-sm text-left" style={{ color: "var(--t1)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  Report
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Post body — same as PostCard ── */}
      <article style={{ borderBottom: "1px solid var(--border-soft)" }}>

        {/* Author row */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={isOwn ? "/profile" : `/profile/${post.author?.username}`}
            className="flex items-center gap-3">
            {post.authorHasStory ? (
              <div className="p-[2px] rounded-full"
                style={{ background: "linear-gradient(135deg, var(--accent), #FF9A6C)" }}>
                <div className="p-[2px] rounded-full" style={{ background: "var(--bg-surface)" }}>
                  <Avatar src={avatar} name={post.author?.name} username={post.author?.username} size={32} />
                </div>
              </div>
            ) : (
              <Avatar src={avatar} name={post.author?.name} username={post.author?.username} size={32} />
            )}
            <div>
              <p className="text-sm font-semibold"
                style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>
                {post.author?.username}
              </p>
              <p className="text-xs" style={{ color: "var(--t3)" }}>
                {formatDistanceToNow(post.createdAt)}
              </p>
            </div>
          </Link>
        </div>

        {/* Media — full width, double tap zoom inside box */}
        {post.mediaUrl && (
          <div className="w-full" style={{ background: "var(--bg-body)" }}>
            {post.mediaType === "video" ? (
              <video src={post.mediaUrl} controls
                className="w-full block" style={{ maxHeight: 600 }} />
            ) : (
              <PostImage
                src={post.mediaUrl}
                alt={post.caption || "post"}
                onDoubleTap={handleLike}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button whileTap={{ scale: 1.35 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={handleLike}>
              <AnimatePresence mode="wait">
                {liked ? (
                  <motion.span key="y" initial={{ scale: 0.4 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <AiFillHeart size={26} style={{ color: "var(--accent)" }} />
                  </motion.span>
                ) : (
                  <motion.span key="n" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                    <AiOutlineHeart size={26} style={{ color: "var(--t1)" }} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button whileTap={{ scale: 0.82 }} onClick={() => setShowComments(!showComments)}>
              <AiOutlineComment size={26} style={{ color: "var(--t1)", transform: "scaleX(-1)" }} />
            </motion.button>

            <motion.button whileTap={{ scale: 0.82 }} whileHover={{ x: 3 }}
              onClick={() => setShowShare(true)}>
              <BsSend size={22} style={{ color: "var(--t1)" }} />
            </motion.button>
          </div>
          <motion.button whileTap={{ scale: 0.75 }} onClick={handleBookmark}>
            {saved
              ? <BsBookmarkFill size={22} style={{ color: "var(--accent)" }} />
              : <BsBookmark size={22} style={{ color: "var(--t1)" }} />}
          </motion.button>
        </div>

        {/* Like count */}
        <div className="px-4 pb-1">
          <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>
            {likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}
          </p>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 pb-2">
            <p className="text-sm" style={{ color: "var(--t1)" }}>
              <span className="font-semibold mr-1" style={{ fontFamily: "Sora, sans-serif" }}>
                {post.author?.username}
              </span>
              <span style={{ color: "var(--t2)" }}>{post.caption}</span>
            </p>
          </div>
        )}

        {/* Comments count toggle */}
        {comments.length > 0 && (
          <button onClick={() => setShowComments(!showComments)}
            className="px-4 pb-2 block text-sm" style={{ color: "var(--t4)" }}>
            {showComments ? "Hide" : `View all ${comments.length} comments`}
          </button>
        )}

        {/* Comments list */}
        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-4 pb-2 space-y-3">
              {comments.map((c) => {
                const cId = (c.id || c._id)?.toString();
                const isCommentOwn = (c.author?.id || c.author?._id)?.toString() ===
                  (currentUser?.id || currentUser?._id)?.toString();
                return (
                  <div key={cId} className="flex items-start gap-3 group">
                    <Link to={`/profile/${c.author?.username}`} className="shrink-0">
                      <Avatar src={c.author?.avatar} name={c.author?.name}
                        username={c.author?.username} size={28} />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: "var(--t1)" }}>
                        <Link to={`/profile/${c.author?.username}`}>
                          <span className="font-semibold mr-1" style={{ fontFamily: "Sora, sans-serif" }}>
                            {c.author?.username}
                          </span>
                        </Link>
                        <span style={{ color: "var(--t2)" }}>{c.text}</span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--t4)" }}>
                        {formatDistanceToNow(c.createdAt)}
                      </p>
                    </div>
                    {(isCommentOwn || isOwn) && (
                      <motion.button whileTap={{ scale: 0.85 }}
                        onClick={() => handleDeleteComment(cId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        style={{ color: "var(--t4)" }}>
                        <BsTrash size={11} />
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comment input */}
        <div className="px-4 pb-3 pt-2 flex items-center gap-3"
          style={{ borderTop: "1px solid var(--border-soft)" }}>
          <div ref={emojiRef} className="relative shrink-0">
            <motion.button type="button" whileTap={{ scale: 0.85 }}
              onClick={() => setShowEmoji(!showEmoji)}>
              <BsEmojiSmile size={20} style={{ color: showEmoji ? "var(--accent)" : "var(--t3)" }} />
            </motion.button>
            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-10 left-0 z-50">
                  <EmojiPicker
                    onEmojiClick={(e) => { setText((t) => t + e.emoji); setShowEmoji(false); }}
                    theme="auto" height={340} width={280}
                    previewConfig={{ showPreview: false }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleComment} className="flex-1 flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--t1)" }}
            />
            <AnimatePresence>
              {text.trim() && (
                <motion.button type="submit"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  disabled={submitting}
                  className="text-sm font-semibold shrink-0 disabled:opacity-50"
                  style={{ color: "var(--accent)" }}>
                  Post
                </motion.button>
              )}
            </AnimatePresence>
          </form>
        </div>
      </article>
    </>
  );
}
