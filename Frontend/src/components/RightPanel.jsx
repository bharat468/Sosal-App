import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Avatar from "./Avatar";
import api from "../api/api";
import { showFollowErrorToast, showFollowToast } from "../utils/followFeedback";
import { getStoredAccounts, activateStoredAccount, saveAccountSession } from "../utils/accounts";
import { setUser } from "../redux/slices/userSlice";

export default function RightPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((s) => s.user);
  const switchMenuRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [followStatus, setFollowStatus] = useState({});
  const [followLoading, setFollowLoading] = useState({});
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  useEffect(() => {
    api.get("/users/suggestions")
      .then(({ data }) => {
        setSuggestions(data);
        setFollowStatus(
          Object.fromEntries(
            data.map((user) => [((user._id || user.id)?.toString()), user.followStatus || "none"])
          )
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (currentUser && token) saveAccountSession(currentUser, token);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!switchMenuRef.current?.contains(event.target)) {
        setShowSwitchMenu(false);
      }
    };

    if (showSwitchMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSwitchMenu]);

  const handleFollow = async (userId) => {
    if (!userId || userId === "undefined" || followLoading[userId]) return;
    setFollowLoading((p) => ({ ...p, [userId]: true }));
    try {
      const { data } = await api.post(`/users/${userId}/follow`);
      setFollowStatus((p) => ({
        ...p,
        [userId]:
          data.status === "followed" ? "following" :
          data.status === "unfollowed" ? "none" :
          data.status === "requested" ? "requested" :
          data.status === "request_cancelled" ? "none" :
          p[userId] || "none",
      }));
      if (data.followerCount !== undefined) {
        setSuggestions((prev) =>
          prev.map((u) => {
            const uid = (u._id || u.id)?.toString();
            return uid === userId
              ? { ...u, _count: { ...u._count, followers: data.followerCount } }
              : u;
          })
        );
      }
      showFollowToast(data.status);
    } catch (e) {
      showFollowErrorToast(e?.response?.data?.message);
    } finally {
      setFollowLoading((p) => ({ ...p, [userId]: false }));
    }
  };

  if (!currentUser) return null;

  const currentId = (currentUser?._id || currentUser?.id)?.toString();
  const switchableAccounts = getStoredAccounts().filter((a) => a.user.id?.toString() !== currentId);

  const handleSwitchAccount = (account) => {
    const user = activateStoredAccount(account);
    if (!user) return;
    dispatch(setUser(user));
    setShowSwitchMenu(false);
    window.location.href = "/";
  };

  const handleAddAccount = () => {
    setShowSwitchMenu(false);
    navigate("/login");
  };

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
          <div className="relative" ref={switchMenuRef}>
            <button type="button" onClick={() => setShowSwitchMenu((v) => !v)}>
              <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Switch</span>
            </button>
            {showSwitchMenu && (
              <div className="absolute right-0 top-6 rounded-xl overflow-hidden min-w-[210px] z-20"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                {switchableAccounts.length > 0 ? (
                  switchableAccounts.map((a) => (
                    <button key={a.user.id} type="button" onClick={() => handleSwitchAccount(a)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left"
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      <Avatar src={a.user.avatar} name={a.user.name} username={a.user.username} size={26} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--t1)" }}>{a.user.username}</p>
                        <p className="text-[11px] truncate" style={{ color: "var(--t3)" }}>{a.user.name}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs" style={{ color: "var(--t3)" }}>No other accounts yet</p>
                )}
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  <button type="button" onClick={handleAddAccount}
                    className="w-full px-3 py-2.5 text-left text-sm font-semibold"
                    style={{ color: "var(--accent)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    Add account
                  </button>
                </div>
              </div>
            )}
          </div>
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
              <button type="button" onClick={() => setShowAllSuggestions((v) => !v)}>
                <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                  {showAllSuggestions ? "Show less" : "See all"}
                </span>
              </button>
            </div>

            <div className="flex flex-col pb-2 overflow-y-auto scrollbar-hide"
              style={{ maxHeight: showAllSuggestions ? 320 : "none" }}>
              {(showAllSuggestions ? suggestions : suggestions.slice(0, 5)).map((user, i) => {
                const uid = (user._id || user.id)?.toString();
                const status = followStatus[uid] || "none";
                const isRequested = status === "requested";
                const isFollowing = status === "following";
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
                      disabled={!!followLoading[uid]}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 transition-all disabled:opacity-80 disabled:cursor-not-allowed"
                      style={isRequested || isFollowing
                        ? { color: "var(--t1)", background: "var(--bg-input)", border: "1px solid var(--border)", minWidth: 88 }
                        : { color: "var(--accent)", background: "var(--bg-active)", border: "1px solid var(--border-accent)" }}>
                      {followLoading[uid] ? "..." : isRequested ? "Requested" : isFollowing ? "Unfollow" : "Follow"}
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
