import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AiFillHeart, AiOutlineComment } from "react-icons/ai";
import { BsArrowLeft, BsHash } from "react-icons/bs";
import PageTransition from "../components/PageTransition";
import api from "../api/api";

export default function Hashtag() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/posts/hashtag/${tag}`)
      .then(({ data }) => { setPosts(data.posts || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tag]);

  return (
    <PageTransition>
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10 app-header">
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => navigate(-1)} style={{ color: "var(--t1)" }}>
          <BsArrowLeft size={22} />
        </motion.button>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-1" style={{ color: "var(--t1)", fontFamily: "Syne, sans-serif" }}>
            <BsHash size={20} style={{ color: "var(--accent)" }} />{tag}
          </h1>
          <p className="text-xs" style={{ color: "var(--t3)" }}>{total.toLocaleString()} posts</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-[3px]">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square animate-pulse" style={{ background: "var(--bg-skeleton)" }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-base font-semibold" style={{ color: "var(--t1)" }}>No posts for #{tag}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[3px]">
          {posts.map((post, i) => (
            <motion.div key={post.id || post._id}
              initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => navigate(`/post/${post.id || post._id}`)}
              className="relative group aspect-square overflow-hidden cursor-pointer"
              style={{ background: "var(--bg-skeleton)" }}>
              {post.mediaUrl
                ? <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center p-2" style={{ background: "var(--bg-card)" }}>
                    <p className="text-xs text-center line-clamp-3" style={{ color: "var(--t2)" }}>{post.caption}</p>
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
      )}
    </PageTransition>
  );
}
