import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe, logout, setUser } from "../redux/slices/userSlice";
import { BsGrid3X3, BsBookmark, BsPersonBoundingBox, BsCameraVideo } from "react-icons/bs";
import { HiDotsHorizontal } from "react-icons/hi";
import { AiFillHeart, AiOutlineComment } from "react-icons/ai";
import { IoSettingsOutline, IoClose, IoMoon, IoSunny } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import Avatar from "../components/Avatar";
import FollowersModal from "../components/FollowersModal";
import ProfileShareModal from "../components/ProfileShareModal";
import { useTheme } from "../context/ThemeContext";
import api from "../api/api";

const TABS = [
  { id: "posts",  icon: <BsGrid3X3 size={16} />,          label: "POSTS" },
  { id: "reels",  icon: <BsCameraVideo size={16} />,       label: "REELS" },
  { id: "saved",  icon: <BsBookmark size={16} />,          label: "SAVED" },
  { id: "tagged", icon: <BsPersonBoundingBox size={16} />, label: "TAGGED" },
];

function EditProfileModal({ user, onClose, onSave }) {
  const fileRef = useRef(null);
  const [form, setForm]       = useState({ name: user.name || "", username: user.username || "", bio: user.bio || "", website: user.website || "" });
  const [isPrivate, setIsPrivate] = useState(user.isPrivate || false);
  const [avatar, setAvatar]   = useState(null);
  const [preview, setPreview] = useState(user.avatar || "");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setAvatar(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("name",      form.name);
      fd.append("username",  form.username);
      fd.append("bio",       form.bio);
      fd.append("website",   form.website);
      fd.append("isPrivate", isPrivate);
      if (avatar) fd.append("avatar", avatar);

      const { data } = await api.put("/users/profile", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSave(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-[420px] rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-bold" style={{ color: "var(--t1)" }}>Edit Profile</h2>
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose} style={{ color: "var(--t3)" }}>
            <IoClose size={22} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className="p-[2px] rounded-full" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))" }}>
                <div className="p-[2px] rounded-full" style={{ background: "var(--bg-body)" }}>
                  <Avatar src={preview || undefined} name={form.name || user.name} username={user.username} size={64} />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.4)" }}>
                <span className="text-white text-xs font-semibold">Change</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{form.username}</p>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-sm font-semibold grad-text mt-0.5">
                Change photo
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Fields */}
          {[
            { label: "Name",     name: "name",     type: "text",  placeholder: "Your name" },
            { label: "Username", name: "username", type: "text",  placeholder: "username" },
            { label: "Bio",      name: "bio",      type: "textarea", placeholder: "Write a bio..." },
            { label: "Website",  name: "website",  type: "url",   placeholder: "https://yoursite.com" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--t3)" }}>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  name={field.name} value={form[field.name]} rows={3}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="app-input resize-none" style={{ borderRadius: 8 }}
                />
              ) : (
                <input
                  type={field.type} name={field.name} value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="app-input"
                />
              )}
            </div>
          ))}

          {error && <p className="text-sm text-center" style={{ color: "#f9a8d4" }}>{error}</p>}

          {/* Private account toggle */}
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>Private Account</p>
              <p className="text-xs" style={{ color: "var(--t3)" }}>Only followers can see your posts</p>
            </div>
            <motion.button type="button" whileTap={{ scale: 0.9 }}
              onClick={() => setIsPrivate(!isPrivate)}
              className="w-12 h-6 rounded-full relative transition-colors"
              style={{ background: isPrivate ? "var(--accent)" : "var(--bg-input)", border: "1px solid var(--border)" }}>
              <motion.div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ left: isPrivate ? "calc(100% - 22px)" : "2px" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            </motion.button>
          </div>

          <div className="flex gap-3 pt-1">
            <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}>
              Cancel
            </motion.button>
            <motion.button type="submit" whileTap={{ scale: 0.94 }} disabled={loading}
              className="flex-1 grad-btn py-2.5 rounded-xl text-sm disabled:opacity-50">
              {loading ? "Saving..." : "Save"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((s) => s.user);
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab]   = useState("posts");
  const [posts, setPosts]           = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [showShare, setShowShare]   = useState(false);
  const [followModal, setFollowModal] = useState(null); // "followers" | "following" | null

  const loadSavedPosts = () => {
    api.get("/posts/bookmarks?limit=60")
      .then(({ data }) => setSavedPosts(data.posts || []))
      .catch(() => {});
  };

  useEffect(() => { dispatch(fetchMe()); }, [dispatch]);

  useEffect(() => {
    if (!currentUser?.id && !currentUser?._id) return;
    const uid = currentUser._id || currentUser.id;
    setLoadingPosts(true);
    api.get(`/posts/user/${uid}?limit=24`)
      .then(({ data }) => setPosts(data.posts || []))
      .finally(() => setLoadingPosts(false));
    loadSavedPosts();
  }, [currentUser?.id, currentUser?._id]);

  useEffect(() => {
    if (activeTab === "saved") loadSavedPosts();
  }, [activeTab]);

  const handleLogout = () => { dispatch(logout()); navigate("/login"); };

  const handleSave = (updatedUser) => {
    dispatch(setUser({ ...currentUser, ...updatedUser }));
    localStorage.setItem("user", JSON.stringify({ ...currentUser, ...updatedUser }));
  };

  if (!currentUser) return null;

  const followerCount  = currentUser._count?.followers ?? 0;
  const followingCount = currentUser._count?.following ?? 0;
  const postCount      = currentUser._count?.posts ?? posts.length;
  const uid            = currentUser._id || currentUser.id;
  const avatar         = currentUser.avatar || `https://i.pravatar.cc/150?u=${uid}`;

  return (
    <PageTransition>
      {/* Edit modal */}
      <AnimatePresence>
        {showEdit && (
          <EditProfileModal
            user={currentUser}
            onClose={() => setShowEdit(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {followModal && (
          <FollowersModal
            userId={currentUser._id || currentUser.id}
            type={followModal}
            onClose={() => setFollowModal(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showShare && (
          <ProfileShareModal
            profile={currentUser}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 app-header">
        <h1 className="text-lg font-bold" style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>{currentUser.username}</h1>
        <div className="relative">
          <motion.button whileTap={{ scale: 0.82 }} onClick={() => setShowMenu(!showMenu)}>
            <IoSettingsOutline size={24} style={{ color: "var(--t1)" }} />
          </motion.button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 top-8 rounded-xl overflow-hidden z-20 min-w-[200px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                <button onClick={() => { setShowEdit(true); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-sm text-left font-medium flex items-center gap-3"
                  style={{ color: "var(--t1)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <IoSettingsOutline size={16} /> Edit Profile
                </button>
                {/* Admin panel link — only for admins */}
                {currentUser?.role === "admin" && (
                  <button onClick={() => { navigate("/admin"); setShowMenu(false); }}
                    className="w-full px-4 py-3 text-sm text-left font-medium flex items-center gap-3"
                    style={{ color: "var(--accent)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    🛡️ Admin Panel
                  </button>
                )}
                {/* Theme toggle */}
                <button onClick={() => { toggle(); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-sm text-left font-medium flex items-center gap-3"
                  style={{ color: "var(--t1)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  {isDark
                    ? <><IoSunny size={16} style={{ color: "#fbbf24" }} /> Light Mode</>
                    : <><IoMoon size={16} style={{ color: "var(--accent)" }} /> Dark Mode</>
                  }
                </button>
                <div style={{ height: 1, background: "var(--border)" }} />
                <button onClick={handleLogout}
                  className="w-full px-4 py-3 text-sm text-left font-medium flex items-center gap-3"
                  style={{ color: "#f87171" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <IoClose size={16} /> Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-6 mb-4">
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-[3px] rounded-full shrink-0"
            style={{ background: "linear-gradient(135deg,#22c55e,#ec4899,#a855f7)" }}>
            <div className="p-[2px] rounded-full" style={{ background: "var(--bg-body)" }}>
              <Avatar src={avatar || undefined} name={currentUser.name} username={currentUser.username} size={80} />
            </div>
          </motion.div>

          <div className="flex gap-5 flex-1 justify-around">
            {[
              { label: "posts",     value: postCount,      onClick: null },
              { label: "followers", value: followerCount,  onClick: () => setFollowModal("followers") },
              { label: "following", value: followingCount, onClick: () => setFollowModal("following") },
            ].map((s, i) => (
              <motion.button key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }} whileTap={{ scale: 0.9 }}
                onClick={s.onClick}
                className="flex flex-col items-center">
                <span className="font-bold text-[17px] leading-tight" style={{ color: "var(--t1)" }}>
                  {Number(s.value).toLocaleString()}
                </span>
                <span className="text-xs" style={{ color: "var(--t3)" }}>{s.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{currentUser.name}</p>
          {currentUser.bio && <p className="text-sm mt-0.5 leading-snug" style={{ color: "var(--t2)" }}>{currentUser.bio}</p>}
          {currentUser.website && (
            <a href={currentUser.website} target="_blank" rel="noreferrer"
              className="text-sm mt-0.5 block grad-text hover:underline">{currentUser.website}</a>
          )}
        </motion.div>

        <div className="flex gap-2 mt-3">
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => setShowEdit(true)}
            className="flex-1 text-sm font-semibold py-[7px] rounded-lg"
            style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}>
            Edit profile
          </motion.button>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => setShowShare(true)}
            className="flex-1 text-sm font-semibold py-[7px] rounded-lg"
            style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}>
            Share profile
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} className="px-3 py-[7px] rounded-lg"
            style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}>
            <HiDotsHorizontal size={18} />
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderTop: "1px solid var(--border-soft)", borderBottom: "1px solid var(--border-soft)" }}>
        {TABS.map((tab) => (
          <motion.button key={tab.id} whileTap={{ scale: 0.88 }} onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 relative"
            style={{ color: activeTab === tab.id ? "var(--t1)" : "var(--t4)" }}>
            {tab.icon}
            <span className="text-[11px] font-semibold tracking-wider hidden sm:inline">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="profileTab" className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: "linear-gradient(90deg,var(--accent),var(--accent2))" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
          </motion.button>
        ))}
      </div>

      {/* Posts grid */}
      {loadingPosts ? (
        <div className="grid grid-cols-3 gap-[3px]">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square animate-pulse" style={{ background: "var(--bg-skeleton)" }} />
          ))}
        </div>
      ) : (
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          className="grid grid-cols-3 gap-[3px]">
          {(() => {
            const filtered = posts.filter((p) => {
              if (activeTab === "reels")  return p.mediaType === "video";
              if (activeTab === "posts")  return p.mediaType !== "video";
              if (activeTab === "saved")  return false; // handled separately
              return true;
            });

            const displayPosts = activeTab === "saved" ? savedPosts : filtered;

            if (displayPosts.length === 0) return (
              <div className="col-span-3 flex flex-col items-center justify-center py-16">
                <p className="text-base font-semibold" style={{ color: "var(--t1)" }}>
                  {activeTab === "reels" ? "No videos yet" : activeTab === "saved" ? "No saved posts" : "No posts yet"}
                </p>
              </div>
            );

            return displayPosts.map((post, i) => (
              <motion.div key={post.id}
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                onClick={() => activeTab === "reels" ? navigate("/reels") : navigate(`/post/${post.id}`)}
                className="relative group aspect-square overflow-hidden cursor-pointer"
                style={{ background: "var(--bg-skeleton)" }}>

                {/* Thumbnail */}
                {post.mediaType === "video" ? (
                  // Video — show first frame via video element
                  <div className="w-full h-full relative">
                    <video src={post.mediaUrl} className="w-full h-full object-cover"
                      muted playsInline preload="metadata" />
                    {/* Video play icon overlay */}
                    <div className="absolute top-2 right-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" opacity="0.9">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                ) : post.mediaUrl ? (
                  <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2"
                    style={{ background: "var(--bg-card)" }}>
                    <p className="text-xs text-center line-clamp-4" style={{ color: "var(--t2)" }}>{post.caption}</p>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-150"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <span className="flex items-center gap-1 text-white font-bold text-sm">
                    <AiFillHeart size={16} style={{ color: "#ec4899" }} /> {post._count?.likes ?? 0}
                  </span>
                  <span className="flex items-center gap-1 text-white font-bold text-sm">
                    <AiOutlineComment size={16} /> {post._count?.comments ?? 0}
                  </span>
                </div>
              </motion.div>
            ));
          })()}
        </motion.div>
      )}
    </PageTransition>
  );
}
