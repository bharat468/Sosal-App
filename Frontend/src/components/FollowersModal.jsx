import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import api from "../api/api";
import { showFollowErrorToast, showFollowToast } from "../utils/followFeedback";

export default function FollowersModal({ userId, type, onClose }) {
  const { currentUser } = useSelector((s) => s.user);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState({});
  const [followLoading, setFollowLoading] = useState({});

  useEffect(() => {
    const endpoint = type === "followers" ? `/users/${userId}/followers` : `/users/${userId}/following`;
    api.get(endpoint)
      .then(({ data }) => {
        setUsers(data);
        setFollowStatus(
          Object.fromEntries(
            data.map((user) => [((user._id || user.id)?.toString()), user.followStatus || "none"])
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, type]);

  const handleFollow = async (uid) => {
    if (!uid || followLoading[uid]) return;
    setFollowLoading((p) => ({ ...p, [uid]: true }));
    try {
      const { data } = await api.post(`/users/${uid}/follow`);
      setFollowStatus((p) => ({
        ...p,
        [uid]:
          data.status === "followed" ? "following" :
          data.status === "unfollowed" ? "none" :
          data.status === "requested" ? "requested" :
          data.status === "request_cancelled" ? "none" :
          p[uid] || "none",
      }));
      showFollowToast(data.status);
    } catch (e) {
      showFollowErrorToast(e?.response?.data?.message);
    } finally {
      setFollowLoading((p) => ({ ...p, [uid]: false }));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full sm:max-w-[420px] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", maxHeight: "75vh" }}>

        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-sm font-bold capitalize" style={{ color: "var(--t1)", fontFamily: "Syne, sans-serif" }}>
            {type}
          </h3>
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose} style={{ color: "var(--t3)" }}>
            <IoClose size={22} />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="flex flex-col gap-3 p-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-11 h-11 rounded-full shrink-0" style={{ background: "var(--bg-skeleton)" }} />
                  <div className="flex-1 h-3 rounded" style={{ background: "var(--bg-skeleton)" }} />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-12 text-sm" style={{ color: "var(--t3)" }}>No {type} yet</p>
          ) : (
            users.map((user) => {
              const uid = (user._id || user.id)?.toString();
              const myId = (currentUser?._id || currentUser?.id)?.toString();
              const isMe = uid === myId;
              const status = followStatus[uid] || "none";
              const isRequested = status === "requested";
              const isFollowing = status === "following";
              return (
                <div key={uid} className="flex items-center gap-3 px-4 py-3"
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <Link to={`/profile/${user.username}`} onClick={onClose}>
                    <Avatar src={user.avatar} name={user.name} username={user.username} size={44} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${user.username}`} onClick={onClose}>
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>{user.username}</p>
                      <p className="text-xs truncate" style={{ color: "var(--t3)" }}>{user.name}</p>
                    </Link>
                  </div>
                  <motion.button whileTap={{ scale: 0.88 }} onClick={() => !isMe && handleFollow(uid)} disabled={isMe || !!followLoading[uid]}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={isMe
                      ? { background: "var(--bg-input)", color: "var(--t3)", border: "1px solid var(--border)" }
                      : isRequested || isFollowing
                        ? { background: "var(--bg-input)", color: "var(--t3)", border: "1px solid var(--border)" }
                        : { background: "var(--accent)", color: "#fff" }}>
                    {isMe ? "You" : followLoading[uid] ? "..." : isRequested ? "Requested" : isFollowing ? "Unfollow" : "Follow"}
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
