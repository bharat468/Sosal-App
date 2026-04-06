import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { AiOutlineSend } from "react-icons/ai";
import { BsLink45Deg, BsCheck } from "react-icons/bs";
import Avatar from "./Avatar";
import api from "../api/api";

export default function ShareModal({ post, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sent, setSent]           = useState({});
  const [copied, setCopied]       = useState(false);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    api.get("/messages/conversations")
      .then(({ data }) => {
        const byId = new Map();
        (data || []).forEach((c) => {
          const u = c.user;
          if (!u) return;
          const uid = (u._id || u.id)?.toString();
          if (uid) byId.set(uid, u);
        });
        setUsers([...byId.values()]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Build a rich message with post preview — like Instagram DM share
  const buildShareMessage = (user) => {
    const postId  = post.id || post._id;
    const postUrl = `${window.location.origin}/post/${postId}`;
    const author  = post.author?.username || "someone";

    if (post.mediaUrl && post.mediaType === "image") {
      return `📸 ${author} posted: ${post.caption ? `"${post.caption.slice(0, 80)}"` : "a photo"}\n${postUrl}`;
    } else if (post.mediaType === "video") {
      return `🎬 ${author} posted a reel: ${post.caption ? `"${post.caption.slice(0, 80)}"` : ""}\n${postUrl}`;
    } else {
      return `${author}: ${post.caption ? `"${post.caption.slice(0, 100)}"` : "shared a post"}\n${postUrl}`;
    }
  };

  const handleSend = async (user) => {
    const uid = (user._id || user.id)?.toString();
    if (sent[uid]) return;
    try {
      await api.post(`/messages/${uid}`, { text: buildShareMessage(user) });
      setSent((p) => ({ ...p, [uid]: true }));
    } catch {}
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/post/${post.id || post._id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filtered = users.filter((u) =>
    !search.trim() ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    // z-[200] — above bottom nav (z-50)
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <motion.div
        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          // On mobile: leave space above bottom nav (56px) + safe area
          maxHeight: "calc(85vh - 56px)",
          marginBottom: "56px",
        }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-sm font-bold" style={{ color: "var(--t1)", fontFamily: "Syne, sans-serif" }}>Share</h3>
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose} style={{ color: "var(--t3)" }}>
            <IoClose size={22} />
          </motion.button>
        </div>

        {/* Post preview strip */}
        {post.mediaUrl && (
          <div className="px-4 py-3 shrink-0 flex items-center gap-3"
            style={{ borderBottom: "1px solid var(--border-soft)" }}>
            {post.mediaType === "video"
              ? <video src={post.mediaUrl} className="w-14 h-14 rounded-xl object-cover shrink-0" muted playsInline preload="metadata" />
              : <img src={post.mediaUrl} alt="post" className="w-14 h-14 rounded-xl object-cover shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--t1)" }}>
                {post.author?.username}
              </p>
              {post.caption && (
                <p className="text-xs truncate mt-0.5" style={{ color: "var(--t3)" }}>
                  {post.caption.slice(0, 60)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Copy link */}
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: copied ? "var(--accent)" : "var(--bg-hover)" }}>
              {copied
                ? <BsCheck size={18} className="text-white" />
                : <BsLink45Deg size={18} style={{ color: "var(--accent)" }} />}
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--t1)" }}>
              {copied ? "Link copied!" : "Copy link"}
            </span>
          </motion.button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-1 shrink-0">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full text-sm px-3 py-2 rounded-xl outline-none"
            style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }} />
        </div>

        {/* People list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide">
          {loading ? (
            <div className="flex flex-col gap-3 py-2">
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-11 h-11 rounded-full shrink-0" style={{ background: "var(--bg-skeleton)" }} />
                  <div className="flex-1 h-3 rounded" style={{ background: "var(--bg-skeleton)" }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--t3)" }}>No chats yet</p>
          ) : (
            filtered.map((user) => {
              const uid   = (user._id || user.id)?.toString();
              const isSent = sent[uid];
              return (
                <div key={uid} className="flex items-center gap-3 py-2.5">
                  <Avatar src={user.avatar} name={user.name} username={user.username} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>{user.username}</p>
                    <p className="text-xs truncate" style={{ color: "var(--t3)" }}>{user.name}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleSend(user)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                    style={isSent
                      ? { background: "var(--bg-input)", color: "var(--t3)", border: "1px solid var(--border)" }
                      : { background: "var(--accent)", color: "#fff" }}>
                    {isSent ? <><BsCheck size={13} /> Sent</> : <><AiOutlineSend size={13} /> Send</>}
                  </motion.button>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
