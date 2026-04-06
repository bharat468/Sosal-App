import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { AiFillHeart, AiOutlineComment } from "react-icons/ai";
import { BsGrid3X3, BsCameraVideo, BsLock, BsThreeDots } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import PageTransition from "../components/PageTransition";
import Avatar from "../components/Avatar";
import FollowersModal from "../components/FollowersModal";
import api from "../api/api";
import { showFollowErrorToast, showFollowToast } from "../utils/followFeedback";

export default function UserProfile() {
  const { username }    = useParams();
  const navigate        = useNavigate();
  const { currentUser } = useSelector((s) => s.user);

  const [profile, setProfile]         = useState(null);
  const [posts, setPosts]             = useState([]);
  const [followStatus, setFollowStatus] = useState("none");
  const [loading, setLoading]         = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [blocked, setBlocked]         = useState(false);
  const [showMenu, setShowMenu]       = useState(false);
  const [followModal, setFollowModal] = useState(null);

  const myId = (currentUser?._id || currentUser?.id)?.toString();

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: profileData } = await api.get(`/users/${username}`);
      setProfile(profileData);
      setFollowStatus(profileData.followStatus || "none");

      // Load posts only if not locked
      if (!profileData.isLocked) {
        const { data: postsData } = await api.get(`/posts/user/${profileData.id}?limit=24`);
        setPosts(postsData.posts || []);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, [username]);

  const handleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    try {
      const { data } = await api.post(`/users/${profile.id}/follow`);
      setFollowStatus(
        data.status === "followed"          ? "following"  :
        data.status === "unfollowed"        ? "none"       :
        data.status === "requested"         ? "requested"  :
        data.status === "request_cancelled" ? "none"       : followStatus
      );
      if (data.followerCount !== undefined) {
        setProfile((p) => ({ ...p, _count: { ...p._count, followers: data.followerCount } }));
      }
      showFollowToast(data.status);
    } catch (e) {
      showFollowErrorToast(e?.response?.data?.message);
    } finally { setFollowLoading(false); }
  };

  const canMessage = !profile?.isPrivate;
  const handleMessage = () => {
    if (!canMessage || !profile) return;
    navigate("/messages", {
      state: {
        user: {
          id: profile.id,
          _id: profile.id,
          username: profile.username,
          name: profile.name,
          avatar: profile.avatar,
        },
      },
    });
  };

  const handleBlock = async () => {
    if (!profile) return;
    try {
      const { data } = await api.post(`/users/${profile.id}/block`);
      setBlocked(data.blocked);
      setShowMenu(false);
      if (data.blocked) setFollowStatus("none");
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--accent2)", borderTopColor: "transparent" }} />
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-lg font-semibold" style={{ color: "var(--t1)" }}>User not found</p>
    </div>
  );

  const isOwn = profile.id?.toString() === myId;
  const isLocked = profile.isLocked && !isOwn;

  const followBtnLabel = followLoading ? "..." : {
    following: "Following",
    requested: "Requested",
    none:      "Follow",
  }[followStatus];

  const followBtnStyle = followStatus === "none"
    ? { background: "var(--accent)", color: "#fff" }
    : { background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" };

  const imagePosts = posts.filter((p) => p.mediaType !== "video");
  const videoPosts = posts.filter((p) => p.mediaType === "video");

  return (
    <PageTransition>
      <AnimatePresence>
        {followModal && profile && (
          <FollowersModal userId={profile.id} type={followModal} onClose={() => setFollowModal(null)} />
        )}
      </AnimatePresence>

      <div className="px-4 py-3 sticky top-0 z-10 app-header flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--t1)", fontFamily: "Syne, sans-serif" }}>
          {profile.username}
          {profile.isPrivate && <BsLock size={14} style={{ color: "var(--t3)" }} />}
        </h1>
        <div className="relative">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowMenu(!showMenu)} style={{ color: "var(--t3)" }}>
            <BsThreeDots size={20} />
          </motion.button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 top-8 rounded-xl overflow-hidden z-20 min-w-[160px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                <button onClick={handleBlock}
                  className="w-full px-4 py-3 text-sm text-left font-medium"
                  style={{ color: blocked ? "var(--t1)" : "#f87171" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  {blocked ? "Unblock user" : "Block user"}
                </button>
                <button onClick={() => setShowMenu(false)}
                  className="w-full px-4 py-3 text-sm text-left font-medium"
                  style={{ color: "var(--t1)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  Report
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-6 mb-4">
          <div className="p-[3px] rounded-full shrink-0"
            style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2),#a855f7)" }}>
            <div className="p-[2px] rounded-full" style={{ background: "var(--bg-body)" }}>
              <Avatar src={profile.avatar} name={profile.name} username={profile.username} size={80} />
            </div>
          </div>
          <div className="flex gap-5 flex-1 justify-around">
            {[
              { label: "posts",     value: profile._count?.posts ?? 0 },
              { label: "followers", value: profile._count?.followers ?? 0, onClick: () => setFollowModal("followers") },
              { label: "following", value: profile._count?.following ?? 0, onClick: () => setFollowModal("following") },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center cursor-pointer" onClick={s.onClick}>
                <span className="font-bold text-[17px] leading-tight" style={{ color: "var(--t1)" }}>
                  {isLocked ? "-" : Number(s.value).toLocaleString()}
                </span>
                <span className="text-xs" style={{ color: "var(--t3)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{profile.name}</p>
        {profile.bio && <p className="text-sm mt-0.5 leading-snug" style={{ color: "var(--t2)" }}>{profile.bio}</p>}
        {profile.website && !isLocked && (
          <a href={profile.website} target="_blank" rel="noreferrer"
            className="text-sm mt-0.5 block" style={{ color: "var(--accent)" }}>{profile.website}</a>
        )}

        {!isOwn && (
          <div className="flex gap-2 mt-3">
            <motion.button whileTap={{ scale: 0.94 }} onClick={handleFollow} disabled={followLoading}
              className="flex-1 text-sm font-semibold py-[7px] rounded-lg transition-all disabled:opacity-60"
              style={followBtnStyle}>
              {followBtnLabel}
            </motion.button>
            <motion.button whileTap={{ scale: 0.94 }} onClick={handleMessage} disabled={!canMessage}
              className="flex-1 text-sm font-semibold py-[7px] rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}>
              Message
            </motion.button>
          </div>
        )}
      </div>

      {/* Private / Locked state */}
      {isLocked ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center"
          style={{ borderTop: "1px solid var(--border-soft)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ border: "2px solid var(--border)" }}>
            <BsLock size={28} style={{ color: "var(--t3)" }} />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: "var(--t1)" }}>This account is private</p>
          <p className="text-sm" style={{ color: "var(--t3)" }}>
            {followStatus === "requested"
              ? "Your follow request is pending approval."
              : "Follow this account to see their photos and videos."}
          </p>
        </div>
      ) : (
        <>
          {/* Posts grid */}
          {imagePosts.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-4 py-2" style={{ borderTop: "1px solid var(--border-soft)" }}>
                <BsGrid3X3 size={14} style={{ color: "var(--t3)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--t3)" }}>Posts</span>
              </div>
              <div className="grid grid-cols-3 gap-[3px]">
                {imagePosts.map((post, i) => (
                  <motion.div key={post.id || post._id}
                    initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.025 }}
                    onClick={() => navigate(`/post/${post.id || post._id}`)}
                    className="relative group aspect-square overflow-hidden cursor-pointer"
                    style={{ background: "var(--bg-skeleton)" }}>
                    {post.mediaUrl
                      ? <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center p-2" style={{ background: "var(--bg-card)" }}>
                          <p className="text-xs text-center line-clamp-4" style={{ color: "var(--t2)" }}>{post.caption}</p>
                        </div>}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      <span className="flex items-center gap-1 text-white font-bold text-sm">
                        <AiFillHeart size={16} style={{ color: "#ec4899" }} /> {post._count?.likes ?? 0}
                      </span>
                      <span className="flex items-center gap-1 text-white font-bold text-sm">
                        <AiOutlineComment size={16} /> {post._count?.comments ?? 0}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Reels grid */}
          {videoPosts.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-4 py-2 mt-2" style={{ borderTop: "1px solid var(--border-soft)" }}>
                <BsCameraVideo size={14} style={{ color: "var(--t3)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--t3)" }}>Reels</span>
              </div>
              <div className="grid grid-cols-3 gap-[3px]">
                {videoPosts.map((post, i) => (
                  <motion.div key={post.id || post._id}
                    initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.025 }}
                    onClick={() => navigate("/reels")}
                    className="relative group aspect-square overflow-hidden cursor-pointer"
                    style={{ background: "var(--bg-skeleton)" }}>
                    <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    <div className="absolute top-2 right-2">
                      <BsCameraVideo size={16} className="text-white drop-shadow" />
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      <span className="flex items-center gap-1 text-white font-bold text-sm">
                        <AiFillHeart size={16} style={{ color: "#ec4899" }} /> {post._count?.likes ?? 0}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <p className="text-base font-semibold" style={{ color: "var(--t1)" }}>No posts yet</p>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
