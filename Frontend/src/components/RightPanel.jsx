import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Avatar from "./Avatar";
import api from "../api/api";

export default function RightPanel() {
  const { currentUser } = useSelector((s) => s.user);
  const [suggestions, setSuggestions] = useState([]);
  const [followed, setFollowed]       = useState({});

  useEffect(() => {
    api.get("/users/suggestions").then(({ data }) => setSuggestions(data)).catch(() => {});
  }, []);

  const handleFollow = async (userId) => {
    if (!userId || userId === "undefined") return;
    try {
      const { data } = await api.post(`/users/${userId}/follow`);
      setFollowed((p) => ({ ...p, [userId]: data.following }));
      if (data.following) {
        setSuggestions((prev) => prev.filter((u) => (u._id || u.id)?.toString() !== userId?.toString()));
      }
    } catch {}
  };

  if (!currentUser) return null;

  return (
    <aside className="hidden xl:block w-[300px] shrink-0 pl-6 pt-6 pr-2">
      <div className="sticky top-6 flex flex-col gap-5">

        {/* Current user */}
        <div className="flex items-center gap-3 px-1">
          <Link to="/profile">
            <Avatar src={currentUser.avatar} name={currentUser.name} username={currentUser.username} size={42} />
          </Link>
          <div className="flex-1 min-w-0">
            <Link to="/profile">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>
                {currentUser.username}
              </p>
            </Link>
            <p className="text-xs truncate" style={{ color: "var(--t3)" }}>{currentUser.name}</p>
          </div>
          <Link to="/profile">
            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Switch</span>
          </Link>
        </div>

        {/* Suggested */}
        {suggestions.length > 0 && (
          <div className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--t3)", fontFamily: "Sora, sans-serif", letterSpacing: "0.08em" }}>
                Suggested
              </span>
              <Link to="/search">
                <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>See all</span>
              </Link>
            </div>

            <div className="flex flex-col pb-2">
              {suggestions.slice(0, 5).map((user, i) => {
                const uid = (user._id || user.id)?.toString();
                return (
                  <motion.div key={uid}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <Link to={`/profile/${user.username}`}>
                      <Avatar src={user.avatar} name={user.name} username={user.username} size={32} />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${user.username}`}>
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>{user.username}</p>
                      </Link>
                      <p className="text-xs truncate" style={{ color: "var(--t3)" }}>
                        {user._count?.followers ?? 0} followers
                      </p>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => handleFollow(uid)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all"
                      style={followed[uid]
                        ? { color: "var(--t3)", background: "var(--bg-input)", border: "1px solid var(--border)" }
                        : { color: "var(--accent)", background: "var(--bg-active)", border: "1px solid var(--border-accent)" }}>
                      {followed[uid] ? "Following" : "Follow"}
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[11px] px-1 leading-relaxed" style={{ color: "var(--t4)" }}>
          About · Help · Privacy · Terms
          <br />© 2025 Sosal
        </p>
      </div>
    </aside>
  );
}
