import { useState, useEffect, useCallback } from "react";
import { BiSearch } from "react-icons/bi";
import { AiFillHeart, AiOutlineComment } from "react-icons/ai";
import { BsCameraVideo, BsHash } from "react-icons/bs";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import api from "../api/api";
import Avatar from "../components/Avatar";
import { useDebounce } from "../hooks/useDebounce";
import { DEBOUNCE_MS } from "../constants";

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery]         = useState("");
  const [users, setUsers]         = useState([]);
  const [searching, setSearching] = useState(false);
  const [trending, setTrending]   = useState([]);
  const [explore, setExplore]     = useState([]);
  const [loadingExplore, setLoadingExplore] = useState(true);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  // Load trending hashtags + explore posts on mount
  useEffect(() => {
    api.get("/posts/trending-hashtags").then(({ data }) => setTrending(data)).catch(() => {});
    api.get("/posts/feed?page=1&limit=24").then(({ data }) => {
      setExplore(data.posts || []);
    }).catch(() => {}).finally(() => setLoadingExplore(false));
  }, []);

  const searchUsers = useCallback(async (q) => {
    if (!q.trim()) { setUsers([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setUsers(data);
    } catch {
      setUsers([]);
    } finally { setSearching(false); }
  }, []);

  useEffect(() => {
    searchUsers(debouncedQuery);
  }, [debouncedQuery, searchUsers]);

  return (
    <PageTransition>
      {/* Search bar */}
      <div className="sticky top-0 z-10 px-4 pt-3 pb-2 app-header">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
          <BiSearch size={18} style={{ color: "var(--t3)" }} className="shrink-0" />
          <input type="text" placeholder="Search people, hashtags..." value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-sm flex-1 outline-none"
            style={{ color: "var(--t1)" }} />
          {query && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
              onClick={() => setQuery("")} style={{ color: "var(--t3)" }} className="text-xs">✕</motion.button>
          )}
        </div>
      </div>

      {query ? (
        <div className="p-4">
          {/* Hashtag search */}
          {query.startsWith("#") && (
            <motion.div whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/hashtag/${query.slice(1)}`)}
              className="flex items-center gap-3 py-3 px-2 rounded-xl cursor-pointer mb-2"
              style={{ background: "var(--bg-hover)" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-input)" }}>
                <BsHash size={22} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{query}</p>
                <p className="text-xs" style={{ color: "var(--t3)" }}>Search hashtag</p>
              </div>
            </motion.div>
          )}

          {searching ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full shrink-0" style={{ background: "var(--bg-skeleton)" }} />
                  <div className="flex-1">
                    <div className="h-3 rounded w-32 mb-1" style={{ background: "var(--bg-skeleton)" }} />
                    <div className="h-2 rounded w-20" style={{ background: "var(--bg-skeleton)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 && !query.startsWith("#") ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--t3)" }}>No users found for "{query}"</p>
          ) : (
            users.map((user, i) => (
              <motion.div key={user.id || user._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Link to={`/profile/${user.username}`}
                  className="flex items-center gap-3 py-3 rounded-xl px-2"
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <Avatar src={user.avatar} name={user.name} username={user.username} size={48} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>{user.username}</p>
                    <p className="text-xs truncate" style={{ color: "var(--t3)" }}>{user.name}</p>
                    <p className="text-xs" style={{ color: "var(--t4)" }}>{user._count?.followers ?? 0} followers</p>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Trending hashtags */}
          {trending.length > 0 && (
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--t3)", fontFamily: "Syne, sans-serif" }}>
                Trending
              </p>
              <div className="flex flex-wrap gap-2">
                {trending.map((t) => (
                  <motion.button key={t.tag} whileTap={{ scale: 0.92 }}
                    onClick={() => navigate(`/hashtag/${t.tag}`)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ background: "var(--bg-input)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}>
                    <BsHash size={13} />
                    {t.tag}
                    <span className="text-xs ml-1" style={{ color: "var(--t4)" }}>{t.count}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Explore grid */}
          <div className="grid grid-cols-3 gap-[3px] mt-2">
            {loadingExplore
              ? [...Array(9)].map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse" style={{ background: "var(--bg-skeleton)" }} />
                ))
              : explore.map((post, i) => {
                  const big  = i % 7 === 0;
                  const isVideo = post.mediaType === "video";
                  return (
                    <motion.div key={post.id || post._id}
                      initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.018, duration: 0.2 }}
                      onClick={() => navigate(`/post/${post.id || post._id}`)}
                      className={`relative group overflow-hidden cursor-pointer ${big ? "col-span-2 row-span-2" : ""}`}
                      style={{ background: "var(--bg-skeleton)" }}>
                      {post.mediaUrl
                        ? isVideo
                          ? <video src={post.mediaUrl} className="w-full h-full object-cover aspect-square" muted playsInline preload="metadata" />
                          : <img src={post.mediaUrl} alt="explore" className="w-full h-full object-cover aspect-square" />
                        : <div className="w-full h-full aspect-square flex items-center justify-center p-2" style={{ background: "var(--bg-card)" }}>
                            <p className="text-xs text-center line-clamp-3" style={{ color: "var(--t2)" }}>{post.caption}</p>
                          </div>
                      }
                      {isVideo && <BsCameraVideo size={15} className="absolute top-2 right-2 text-white drop-shadow" />}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-opacity duration-150"
                        style={{ background: "rgba(0,0,0,0.5)" }}>
                        <span className="flex items-center gap-1 text-white font-bold text-sm">
                          <AiFillHeart size={18} style={{ color: "var(--accent2)" }} /> {post._count?.likes ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-white font-bold text-sm">
                          <AiOutlineComment size={18} /> {post._count?.comments ?? 0}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
            }
          </div>
        </>
      )}
    </PageTransition>
  );
}
