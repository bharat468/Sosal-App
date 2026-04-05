import { useState, useEffect, useCallback } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AiOutlineDashboard, AiOutlineUser, AiOutlineFileImage,
  AiOutlineFlag, AiOutlineBarChart, AiOutlineLogout,
  AiOutlineMenu, AiOutlineClose,
} from "react-icons/ai";
import { BsShieldCheck } from "react-icons/bs";
import api from "../../api/api";
import Avatar from "../../components/Avatar";
import { formatDistanceToNow } from "../../utils/time";

// ── Styles ─────────────────────────────────────────────────
const S = {
  sidebar: {
    background: "#0D0D0D",
    borderRight: "1px solid #1A1A1A",
    width: 240,
  },
  card: {
    background: "#111111",
    border: "1px solid #1E1E1E",
    borderRadius: 12,
  },
  accent: "#E8440A",
};

// ── Stat Card ───────────────────────────────────────────────
function StatCard({ label, value, icon, color = S.accent, delta }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl flex items-center gap-4"
      style={S.card}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <span style={{ color, fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "#F5F5F5", fontFamily: "Sora, sans-serif" }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#666" }}>{label}</p>
        {delta !== undefined && (
          <p className="text-xs mt-0.5" style={{ color: delta >= 0 ? "#5DCAA5" : "#F07070" }}>
            {delta >= 0 ? "+" : ""}{delta} today
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Dashboard ───────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map((i) => (
        <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "#1A1A1A" }} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: "#F5F5F5", fontFamily: "Sora, sans-serif" }}>
        Dashboard
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"  value={stats?.users  ?? 0} icon="👥" color="#5DCAA5" delta={stats?.newUsersToday} />
        <StatCard label="Total Posts"  value={stats?.posts  ?? 0} icon="📸" color={S.accent} delta={stats?.newPostsToday} />
        <StatCard label="Total Likes"  value={stats?.likes  ?? 0} icon="❤️" color="#F07070" />
        <StatCard label="Messages"     value={stats?.messages ?? 0} icon="💬" color="#85B7EB" />
      </div>

      {/* Recent users */}
      <div className="rounded-xl overflow-hidden" style={S.card}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #1E1E1E" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#F5F5F5", fontFamily: "Sora, sans-serif" }}>
            Recent Users
          </h3>
        </div>
        <div className="divide-y" style={{ borderColor: "#1A1A1A" }}>
          {(stats?.recentUsers || []).map((u) => (
            <div key={u._id} className="flex items-center gap-3 px-5 py-3">
              <Avatar src={u.avatar} name={u.name} username={u.username} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#F5F5F5" }}>{u.username}</p>
                <p className="text-xs truncate" style={{ color: "#666" }}>{u.email}</p>
              </div>
              <p className="text-xs shrink-0" style={{ color: "#444" }}>{formatDistanceToNow(u.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Users Management ────────────────────────────────────────
function Users() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);

  const load = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/users?page=${p}&limit=20&q=${encodeURIComponent(q)}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1, search); }, [search]);

  const handleBan = async (userId, isBanned) => {
    try {
      await api.put(`/admin/users/${userId}`, { isBanned: !isBanned });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isBanned: !isBanned } : u));
    } catch {}
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setTotal((t) => t - 1);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: "#F5F5F5", fontFamily: "Sora, sans-serif" }}>
          Users <span className="text-sm font-normal ml-2" style={{ color: "#666" }}>({total})</span>
        </h2>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{ background: "#1A1A1A", border: "1px solid #222", color: "#F5F5F5", width: 200 }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={S.card}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1E1E1E" }}>
              {["User", "Email", "Posts", "Followers", "Joined", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded animate-pulse" style={{ background: "#1A1A1A", width: "80%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.map((u) => (
              <tr key={u._id} style={{ borderBottom: "1px solid #161616" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#161616"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={u.avatar} name={u.name} username={u.username} size={30} />
                    <div>
                      <p className="font-medium" style={{ color: "#F5F5F5" }}>{u.username}</p>
                      <p className="text-xs" style={{ color: "#555" }}>{u.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: "#888" }}>{u.email}</td>
                <td className="px-4 py-3" style={{ color: "#888" }}>{u.postCount ?? 0}</td>
                <td className="px-4 py-3" style={{ color: "#888" }}>{u.followerCount ?? 0}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "#555" }}>{formatDistanceToNow(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={u.isBanned
                      ? { background: "rgba(240,112,112,0.15)", color: "#F07070" }
                      : { background: "rgba(93,202,165,0.15)", color: "#5DCAA5" }}>
                    {u.isBanned ? "Banned" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => handleBan(u._id, u.isBanned)}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={u.isBanned
                        ? { background: "rgba(93,202,165,0.15)", color: "#5DCAA5" }
                        : { background: "rgba(240,112,112,0.15)", color: "#F07070" }}>
                      {u.isBanned ? "Unban" : "Ban"}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={async () => {
                        try {
                          await api.put(`/admin/users/${u._id}/role`, { role: u.role === "admin" ? "user" : "admin" });
                          setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, role: x.role === "admin" ? "user" : "admin" } : x));
                        } catch {}
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={u.role === "admin"
                        ? { background: "rgba(232,68,10,0.15)", color: "#FF6B35" }
                        : { background: "rgba(133,183,235,0.15)", color: "#85B7EB" }}>
                      {u.role === "admin" ? "Admin" : "User"}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(u._id)}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: "rgba(240,112,112,0.1)", color: "#F07070" }}>
                      Delete
                    </motion.button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #1E1E1E" }}>
            <p className="text-xs" style={{ color: "#555" }}>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => { setPage(page - 1); load(page - 1, search); }}
                className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-30"
                style={{ background: "#1A1A1A", color: "#F5F5F5" }}>Prev</button>
              <button disabled={page * 20 >= total} onClick={() => { setPage(page + 1); load(page + 1, search); }}
                className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-30"
                style={{ background: "#1A1A1A", color: "#F5F5F5" }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Posts Management ────────────────────────────────────────
function Posts() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/posts?page=${p}&limit=20`);
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, []);

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setTotal((t) => t - 1);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "#F5F5F5", fontFamily: "Sora, sans-serif" }}>
        Posts <span className="text-sm font-normal ml-2" style={{ color: "#666" }}>({total})</span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ background: "#1A1A1A" }} />
          ))
        ) : posts.map((post) => (
          <motion.div key={post._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative group rounded-xl overflow-hidden aspect-square"
            style={{ background: "#1A1A1A" }}>
            {post.mediaUrl
              ? post.mediaType === "video"
                ? <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                : <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center p-3">
                  <p className="text-xs text-center line-clamp-4" style={{ color: "#888" }}>{post.caption}</p>
                </div>
            }
            {/* Overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
              style={{ background: "rgba(0,0,0,0.75)" }}>
              <p className="text-xs font-medium" style={{ color: "#F5F5F5" }}>@{post.author?.username}</p>
              <p className="text-xs" style={{ color: "#888" }}>❤️ {post.likeCount ?? 0} · 💬 {post.commentCount ?? 0}</p>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(post._id)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium mt-1"
                style={{ background: "rgba(240,112,112,0.2)", color: "#F07070" }}>
                Delete
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-3">
          <button disabled={page === 1} onClick={() => { setPage(page - 1); load(page - 1); }}
            className="text-xs px-4 py-2 rounded-lg disabled:opacity-30"
            style={{ background: "#1A1A1A", color: "#F5F5F5" }}>← Prev</button>
          <span className="text-xs py-2" style={{ color: "#555" }}>Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => { setPage(page + 1); load(page + 1); }}
            className="text-xs px-4 py-2 rounded-lg disabled:opacity-30"
            style={{ background: "#1A1A1A", color: "#F5F5F5" }}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Reports ─────────────────────────────────────────────────
function Reports() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "#F5F5F5", fontFamily: "Sora, sans-serif" }}>Reports</h2>
      <div className="rounded-xl p-8 flex flex-col items-center justify-center"
        style={{ ...S.card, minHeight: 200 }}>
        <AiOutlineFlag size={36} style={{ color: "#444" }} />
        <p className="mt-3 text-sm" style={{ color: "#555" }}>No reports yet</p>
      </div>
    </div>
  );
}

// ── Analytics ───────────────────────────────────────────────
function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setData(data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "#F5F5F5", fontFamily: "Sora, sans-serif" }}>Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Users"    value={data?.users ?? "—"}    icon="👥" color="#5DCAA5" />
        <StatCard label="Total Posts"    value={data?.posts ?? "—"}    icon="📸" color={S.accent} />
        <StatCard label="Total Likes"    value={data?.likes ?? "—"}    icon="❤️" color="#F07070" />
        <StatCard label="Total Comments" value={data?.comments ?? "—"} icon="💬" color="#85B7EB" />
        <StatCard label="Total Follows"  value={data?.follows ?? "—"}  icon="➕" color="#EF9F27" />
        <StatCard label="Total Messages" value={data?.messages ?? "—"} icon="✉️" color="#a78bfa" />
      </div>
    </div>
  );
}

// ── Main Admin Panel ────────────────────────────────────────
const navItems = [
  { to: "/admin",          label: "Dashboard", icon: <AiOutlineDashboard size={18} />, end: true },
  { to: "/admin/users",    label: "Users",     icon: <AiOutlineUser size={18} /> },
  { to: "/admin/posts",    label: "Posts",     icon: <AiOutlineFileImage size={18} /> },
  { to: "/admin/reports",  label: "Reports",   icon: <AiOutlineFlag size={18} /> },
  { to: "/admin/analytics",label: "Analytics", icon: <AiOutlineBarChart size={18} /> },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080808", fontFamily: "DM Sans, sans-serif" }}>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {(sidebarOpen || true) && (
          <motion.aside
            initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
            className="hidden md:flex flex-col h-full shrink-0"
            style={{ ...S.sidebar, width: 240 }}>

            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid #1A1A1A" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: S.accent }}>
                <BsShieldCheck size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#F5F5F5", fontFamily: "Sora, sans-serif" }}>
                  Admin
                </p>
                <p className="text-xs" style={{ color: "#555" }}>Sosal Panel</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end}>
                  {({ isActive }) => (
                    <motion.div whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                      style={{
                        background: isActive ? `${S.accent}18` : "transparent",
                        color: isActive ? S.accent : "#666",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#161616"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.div>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Back to app */}
            <div className="px-3 pb-4">
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full"
                style={{ color: "#555" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#161616"; e.currentTarget.style.color = "#F5F5F5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#555"; }}>
                <AiOutlineLogout size={18} />
                <span className="text-sm">Back to App</span>
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ background: "#0D0D0D", borderBottom: "1px solid #1A1A1A" }}>
          <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: "#F5F5F5" }}>
            {sidebarOpen ? <AiOutlineClose size={22} /> : <AiOutlineMenu size={22} />}
          </button>
          <p className="text-sm font-semibold" style={{ color: "#F5F5F5", fontFamily: "Sora, sans-serif" }}>
            Sosal Admin
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "#5DCAA5" }} />
            <span className="text-xs" style={{ color: "#555" }}>Live</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="users"     element={<Users />} />
            <Route path="posts"     element={<Posts />} />
            <Route path="reports"   element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
