import { useState, useEffect, useCallback } from "react";
import { Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom";
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

// ── Theme tokens ───────────────────────────────────────────
const C = {
  bg:      "#080808",
  sidebar: "#0D0D0D",
  card:    "#111111",
  border:  "#1E1E1E",
  hover:   "#161616",
  accent:  "#E8440A",
  t1:      "#F5F5F5",
  t2:      "#AAAAAA",
  t3:      "#555555",
  success: "#5DCAA5",
  danger:  "#F07070",
  warning: "#EF9F27",
};

// ── Stat Card ───────────────────────────────────────────────
function StatCard({ label, value, icon, color = C.accent, delta }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl flex items-center gap-3"
      style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold truncate" style={{ color: C.t1, fontFamily: "Sora, sans-serif" }}>
          {typeof value === "number" ? value.toLocaleString() : (value ?? "—")}
        </p>
        <p className="text-xs mt-0.5" style={{ color: C.t3 }}>{label}</p>
        {delta !== undefined && (
          <p className="text-xs" style={{ color: delta >= 0 ? C.success : C.danger }}>
            {delta >= 0 ? "+" : ""}{delta} today
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Dashboard ───────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold" style={{ color: C.t1, fontFamily: "Sora, sans-serif" }}>Dashboard</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: C.card }} />
          ))
        ) : (
          <>
            <StatCard label="Users"    value={stats?.users}    icon="👥" color={C.success} delta={stats?.newUsersToday} />
            <StatCard label="Posts"    value={stats?.posts}    icon="📸" color={C.accent}  delta={stats?.newPostsToday} />
            <StatCard label="Likes"    value={stats?.likes}    icon="❤️" color={C.danger} />
            <StatCard label="Messages" value={stats?.messages} icon="💬" color="#85B7EB" />
          </>
        )}
      </div>

      {/* Recent users */}
      <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-semibold" style={{ color: C.t1, fontFamily: "Sora, sans-serif" }}>Recent Users</h3>
        </div>
        {(stats?.recentUsers || []).map((u) => (
          <div key={u._id} className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: `1px solid ${C.border}` }}>
            <Avatar src={u.avatar} name={u.name} username={u.username} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: C.t1 }}>{u.username}</p>
              <p className="text-xs truncate" style={{ color: C.t3 }}>{u.email}</p>
            </div>
            <p className="text-xs shrink-0" style={{ color: C.t3 }}>{formatDistanceToNow(u.createdAt)}</p>
          </div>
        ))}
        {!loading && !stats?.recentUsers?.length && (
          <p className="text-center py-6 text-sm" style={{ color: C.t3 }}>No users yet</p>
        )}
      </div>
    </div>
  );
}

// ── Users ───────────────────────────────────────────────────
function Users() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);

  const load = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/users?page=${p}&limit=15&q=${encodeURIComponent(q)}`);
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

  const handleRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role } : u));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold" style={{ color: C.t1, fontFamily: "Sora, sans-serif" }}>
          Users <span className="text-sm font-normal" style={{ color: C.t3 }}>({total})</span>
        </h2>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="text-sm px-3 py-2 rounded-lg outline-none w-full sm:w-48"
          style={{ background: C.card, border: `1px solid ${C.border}`, color: C.t1 }} />
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: C.card }} />
          ))
        ) : users.map((u) => (
          <div key={u._id} className="rounded-xl p-4"
            style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar src={u.avatar} name={u.name} username={u.username} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: C.t1 }}>{u.username}</p>
                <p className="text-xs truncate" style={{ color: C.t3 }}>{u.email}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                style={u.isBanned
                  ? { background: `${C.danger}20`, color: C.danger }
                  : { background: `${C.success}20`, color: C.success }}>
                {u.isBanned ? "Banned" : "Active"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleBan(u._id, u.isBanned)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={u.isBanned
                  ? { background: `${C.success}20`, color: C.success }
                  : { background: `${C.danger}20`, color: C.danger }}>
                {u.isBanned ? "Unban" : "Ban"}
              </button>
              <button onClick={() => handleRole(u._id, u.role === "admin" ? "user" : "admin")}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: `${C.accent}20`, color: C.accent }}>
                {u.role === "admin" ? "Admin ✓" : "Make Admin"}
              </button>
              <button onClick={() => handleDelete(u._id)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: `${C.danger}15`, color: C.danger }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl overflow-hidden"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["User", "Email", "Posts", "Role", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: C.t3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: C.hover, width: "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.map((u) => (
                <tr key={u._id} style={{ borderBottom: `1px solid #111` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={u.avatar} name={u.name} username={u.username} size={30} />
                      <div>
                        <p className="font-medium" style={{ color: C.t1 }}>{u.username}</p>
                        <p className="text-xs" style={{ color: C.t3 }}>{u.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.t2 }}>{u.email}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.t2 }}>{u.postCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={u.role === "admin"
                        ? { background: `${C.accent}20`, color: C.accent }
                        : { background: `${C.border}`, color: C.t3 }}>
                      {u.role || "user"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={u.isBanned
                        ? { background: `${C.danger}20`, color: C.danger }
                        : { background: `${C.success}20`, color: C.success }}>
                      {u.isBanned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleBan(u._id, u.isBanned)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={u.isBanned
                          ? { background: `${C.success}20`, color: C.success }
                          : { background: `${C.danger}20`, color: C.danger }}>
                        {u.isBanned ? "Unban" : "Ban"}
                      </button>
                      <button onClick={() => handleRole(u._id, u.role === "admin" ? "user" : "admin")}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: `${C.accent}20`, color: C.accent }}>
                        {u.role === "admin" ? "Admin" : "User"}
                      </button>
                      <button onClick={() => handleDelete(u._id)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: `${C.danger}15`, color: C.danger }}>
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 15 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-xs" style={{ color: C.t3 }}>
              {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => { setPage(page - 1); load(page - 1, search); }}
                className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-30"
                style={{ background: C.hover, color: C.t1 }}>Prev</button>
              <button disabled={page * 15 >= total} onClick={() => { setPage(page + 1); load(page + 1, search); }}
                className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-30"
                style={{ background: C.hover, color: C.t1 }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Posts ───────────────────────────────────────────────────
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
      <h2 className="text-lg font-bold" style={{ color: C.t1, fontFamily: "Sora, sans-serif" }}>
        Posts <span className="text-sm font-normal" style={{ color: C.t3 }}>({total})</span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {loading ? (
          [...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ background: C.card }} />
          ))
        ) : posts.map((post) => (
          <motion.div key={post._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative group rounded-xl overflow-hidden aspect-square"
            style={{ background: C.card }}>
            {post.mediaUrl
              ? post.mediaType === "video"
                ? <video src={post.mediaUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                : <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover" loading="lazy" />
              : <div className="w-full h-full flex items-center justify-center p-2">
                  <p className="text-xs text-center line-clamp-3" style={{ color: C.t3 }}>{post.caption}</p>
                </div>
            }
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2"
              style={{ background: "rgba(0,0,0,0.8)" }}>
              <p className="text-xs font-medium text-center" style={{ color: C.t1 }}>@{post.author?.username}</p>
              <p className="text-xs" style={{ color: C.t2 }}>❤️{post.likeCount ?? 0} 💬{post.commentCount ?? 0}</p>
              <button onClick={() => handleDelete(post._id)}
                className="text-xs px-3 py-1 rounded-lg font-medium"
                style={{ background: `${C.danger}30`, color: C.danger }}>
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-3">
          <button disabled={page === 1} onClick={() => { setPage(page - 1); load(page - 1); }}
            className="text-xs px-4 py-2 rounded-lg disabled:opacity-30"
            style={{ background: C.card, color: C.t1 }}>← Prev</button>
          <span className="text-xs py-2" style={{ color: C.t3 }}>Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => { setPage(page + 1); load(page + 1); }}
            className="text-xs px-4 py-2 rounded-lg disabled:opacity-30"
            style={{ background: C.card, color: C.t1 }}>Next →</button>
        </div>
      )}
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
      <h2 className="text-lg font-bold" style={{ color: C.t1, fontFamily: "Sora, sans-serif" }}>Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Users"    value={data?.users}    icon="👥" color={C.success} />
        <StatCard label="Total Posts"    value={data?.posts}    icon="📸" color={C.accent} />
        <StatCard label="Total Likes"    value={data?.likes}    icon="❤️" color={C.danger} />
        <StatCard label="Total Comments" value={data?.comments} icon="💬" color="#85B7EB" />
        <StatCard label="Total Follows"  value={data?.follows}  icon="➕" color={C.warning} />
        <StatCard label="Total Messages" value={data?.messages} icon="✉️" color="#a78bfa" />
      </div>
    </div>
  );
}

// ── Reports ─────────────────────────────────────────────────
function Reports() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold" style={{ color: C.t1, fontFamily: "Sora, sans-serif" }}>Reports</h2>
      <div className="rounded-xl p-10 flex flex-col items-center justify-center"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <AiOutlineFlag size={32} style={{ color: C.t3 }} />
        <p className="mt-3 text-sm" style={{ color: C.t3 }}>No reports yet</p>
      </div>
    </div>
  );
}

// ── Nav items ───────────────────────────────────────────────
const navItems = [
  { to: "/admin",           label: "Dashboard", icon: <AiOutlineDashboard size={18} />, end: true },
  { to: "/admin/users",     label: "Users",     icon: <AiOutlineUser size={18} /> },
  { to: "/admin/posts",     label: "Posts",     icon: <AiOutlineFileImage size={18} /> },
  { to: "/admin/analytics", label: "Analytics", icon: <AiOutlineBarChart size={18} /> },
  { to: "/admin/reports",   label: "Reports",   icon: <AiOutlineFlag size={18} /> },
];

// ── Main Admin Panel ────────────────────────────────────────
export default function AdminPanel() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ background: C.sidebar }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: C.accent }}>
          <BsShieldCheck size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: C.t1, fontFamily: "Sora, sans-serif" }}>Admin</p>
          <p className="text-xs" style={{ color: C.t3 }}>Sosal Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {({ isActive }) => (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                style={{
                  background: isActive ? `${C.accent}18` : "transparent",
                  color: isActive ? C.accent : C.t3,
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = C.hover; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Back to app */}
      <div className="px-3 pb-4">
        <button onClick={() => navigate("/")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full"
          style={{ color: C.t3 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.t1; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.t3; }}>
          <AiOutlineLogout size={18} />
          <span className="text-sm">Back to App</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, fontFamily: "DM Sans, sans-serif" }}>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-full"
        style={{ borderRight: `1px solid ${C.border}` }}>
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(0,0,0,0.7)" }}
              onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: -220 }} animate={{ x: 0 }} exit={{ x: -220 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[220px] md:hidden"
              style={{ borderRight: `1px solid ${C.border}` }}>
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: C.sidebar, borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-lg"
              style={{ color: C.t1, background: C.hover }}
              onClick={() => setOpen(!open)}>
              {open ? <AiOutlineClose size={18} /> : <AiOutlineMenu size={18} />}
            </button>
            <p className="text-sm font-semibold" style={{ color: C.t1, fontFamily: "Sora, sans-serif" }}>
              Sosal Admin
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: C.success }} />
            <span className="text-xs" style={{ color: C.t3 }}>Live</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="users"     element={<Users />} />
            <Route path="posts"     element={<Posts />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports"   element={<Reports />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
