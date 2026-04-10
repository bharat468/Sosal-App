import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { IoClose, IoShareSocialOutline } from "react-icons/io5";
import { AiOutlineSend } from "react-icons/ai";
import { BsLink45Deg, BsCheck } from "react-icons/bs";
import toast from "react-hot-toast";
import Avatar from "./Avatar";
import api from "../api/api";

export default function ProfileShareModal({ profile, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState({});
  const [copied, setCopied] = useState(false);
  const [sharingNative, setSharingNative] = useState(false);
  const [search, setSearch] = useState("");

  const profileId = profile?.id || profile?._id;
  const profileUrl = useMemo(
    () => `${window.location.origin}/profile/${profile?.username || ""}`,
    [profile?.username]
  );

  useEffect(() => {
    api.get("/messages/conversations")
      .then(({ data }) => {
        const byId = new Map();
        (data || []).forEach((conversation) => {
          const user = conversation.user;
          const uid = (user?._id || user?.id)?.toString();
          if (uid) byId.set(uid, user);
        });
        setUsers([...byId.values()]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const recordShare = async () => {
    if (!profileId) return;
    try {
      await api.post(`/users/${profileId}/share`);
    } catch {}
  };

  const buildShareMessage = () => {
    const name = profile?.name || profile?.username || "Someone";
    const bio = profile?.bio ? `\n${profile.bio.slice(0, 100)}` : "";
    return `Check out @${profile?.username}'s profile on Sosal\n${name}${bio}\n${profileUrl}`;
  };

  const handleSend = async (user) => {
    const uid = (user?._id || user?.id)?.toString();
    if (!uid || sent[uid]) return;

    try {
      await api.post(`/messages/${uid}`, { text: buildShareMessage() });
      await recordShare();
      setSent((prev) => ({ ...prev, [uid]: true }));
      toast.success(`Profile sent to @${user.username}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Unable to send profile.");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      await recordShare();
      setCopied(true);
      toast.success("Profile link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy profile link.");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;

    try {
      setSharingNative(true);
      await navigator.share({
        title: `${profile?.name || profile?.username} on Sosal`,
        text: `Check out @${profile?.username}'s profile on Sosal`,
        url: profileUrl,
      });
      await recordShare();
    } catch {
    } finally {
      setSharingNative(false);
    }
  };

  const filtered = users.filter((user) =>
    !search.trim() ||
    user.username?.toLowerCase().includes(search.toLowerCase()) ||
    user.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          maxHeight: "calc(85vh - 56px)",
          marginBottom: "56px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-sm font-bold" style={{ color: "var(--t1)", fontFamily: "Syne, sans-serif" }}>Share profile</h3>
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose} style={{ color: "var(--t3)" }}>
            <IoClose size={22} />
          </motion.button>
        </div>

        <div className="px-4 py-4 shrink-0 flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <Avatar src={profile?.avatar} name={profile?.name} username={profile?.username} size={54} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>
              {profile?.name || profile?.username}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--t3)" }}>
              @{profile?.username}
            </p>
            {profile?.bio && (
              <p className="text-xs truncate mt-1" style={{ color: "var(--t3)" }}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        <div className="px-4 py-3 shrink-0 grid gap-2" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: copied ? "var(--accent)" : "var(--bg-hover)" }}>
              {copied
                ? <BsCheck size={18} className="text-white" />
                : <BsLink45Deg size={18} style={{ color: "var(--accent)" }} />}
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--t1)" }}>
              {copied ? "Link copied!" : "Copy profile link"}
            </span>
          </motion.button>

          {navigator.share && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleNativeShare}
              disabled={sharingNative}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl disabled:opacity-60"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--bg-hover)" }}>
                <IoShareSocialOutline size={18} style={{ color: "var(--accent)" }} />
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--t1)" }}>
                {sharingNative ? "Opening share..." : "Share via device"}
              </span>
            </motion.button>
          )}
        </div>

        <div className="px-4 pt-3 pb-1 shrink-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Send profile in messages..."
            className="w-full text-sm px-3 py-2 rounded-xl outline-none"
            style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide">
          {loading ? (
            <div className="flex flex-col gap-3 py-2">
              {[1, 2, 3].map((i) => (
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
              const uid = (user._id || user.id)?.toString();
              const isSent = sent[uid];

              return (
                <div key={uid} className="flex items-center gap-3 py-2.5">
                  <Avatar src={user.avatar} name={user.name} username={user.username} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>{user.username}</p>
                    <p className="text-xs truncate" style={{ color: "var(--t3)" }}>{user.name}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => handleSend(user)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                    style={isSent
                      ? { background: "var(--bg-input)", color: "var(--t3)", border: "1px solid var(--border)" }
                      : { background: "var(--accent)", color: "#fff" }}
                  >
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
