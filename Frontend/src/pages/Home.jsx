import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeed, clearPosts } from "../redux/slices/postsSlice";
import StorySection from "../components/StorySection";
import PostCard from "../components/PostCard";
import PageTransition from "../components/PageTransition";
import { BsSend } from "react-icons/bs";
import { AiOutlineHeart } from "react-icons/ai";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Home() {
  const dispatch = useDispatch();
  const { posts, loading, hasMore, page, error } = useSelector((s) => s.posts);
  const loaderRef = useRef(null);

  useEffect(() => {
    if (posts.length === 0) dispatch(fetchFeed(1));
    return () => { dispatch(clearPosts()); };
  }, [dispatch]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          dispatch(fetchFeed(page + 1));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, dispatch]);

  return (
    <PageTransition>
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-20 app-header">
        <span className="text-[22px] font-bold" style={{ fontFamily: "Sora, sans-serif", color: "var(--t1)", letterSpacing: "-0.5px" }}>Sosal</span>
        <div className="flex items-center gap-3">
          <Link to="/notifications"><motion.button whileTap={{ scale: 0.78 }}><AiOutlineHeart size={26} style={{ color: "var(--t1)" }} /></motion.button></Link>
          <Link to="/messages"><motion.button whileTap={{ scale: 0.78 }}><BsSend size={22} style={{ color: "var(--t1)" }} /></motion.button></Link>
        </div>
      </div>

      <StorySection />

      {loading && posts.length === 0 ? (
        <div className="flex flex-col gap-4 p-4">
          {[1,2,3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full" style={{ background: "var(--bg-skeleton)" }} />
                <div className="flex-1">
                  <div className="h-3 rounded w-24 mb-1" style={{ background: "var(--bg-skeleton)" }} />
                  <div className="h-2 rounded w-16" style={{ background: "var(--bg-skeleton)" }} />
                </div>
              </div>
              <div className="w-full aspect-square rounded" style={{ background: "var(--bg-skeleton)" }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--t1)" }}>Something went wrong</p>
          <p className="text-sm mb-4" style={{ color: "var(--t3)" }}>{error}</p>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => dispatch(fetchFeed(1))}
            className="grad-btn px-6 py-2 rounded-lg text-sm">Retry</motion.button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: "var(--t1)" }}>No posts yet</p>
          <p className="text-sm" style={{ color: "var(--t3)" }}>Follow people to see their posts here.</p>
          <Link to="/search">
            <motion.button whileTap={{ scale: 0.94 }} className="grad-btn mt-4 px-6 py-2 rounded-lg text-sm">
              Discover People
            </motion.button>
          </Link>
        </div>
      ) : (
        <>
          {posts.map((post) => <PostCard key={post.id || post._id} post={post} />)}

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="flex justify-center py-6">
            {loading && hasMore && (
              <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-xs" style={{ color: "var(--t4)" }}>You're all caught up ✓</p>
            )}
          </div>
        </>
      )}
    </PageTransition>
  );
}
