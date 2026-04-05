import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoTrash } from "react-icons/io5";
import { BsEye, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { AiOutlineSend } from "react-icons/ai";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Avatar from "./Avatar";
import api from "../api/api";
import { formatDistanceToNow } from "../utils/time";

const STORY_DURATION = 5000; // 5s per story

export default function StoryViewer({ groups, startGroupIdx = 0, onClose }) {
  const { currentUser } = useSelector((s) => s.user);
  const [groupIdx, setGroupIdx]   = useState(startGroupIdx);
  const [storyIdx, setStoryIdx]   = useState(0);
  const [progress, setProgress]   = useState(0);
  const [paused, setPaused]       = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers]     = useState([]);
  const [reply, setReply]         = useState("");
  const intervalRef = useRef(null);
  const videoRef    = useRef(null);

  const group   = groups[groupIdx];
  const story   = group?.stories[storyIdx];
  const isOwn   = story?.author?._id?.toString() === (currentUser?._id || currentUser?.id)?.toString()
                || story?.author?.id?.toString() === (currentUser?._id || currentUser?.id)?.toString();

  // Mark viewed
  useEffect(() => {
    if (story?.id && !story.viewed) {
      api.post(`/stories/${story.id}/view`).catch(() => {});
    }
  }, [story?.id]);

  // Progress timer
  useEffect(() => {
    if (paused || !story) return;
    setProgress(0);

    const startTimer = (duration) => {
      const step = 100 / (duration / 50);
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) { goNext(); return 0; }
          return p + step;
        });
      }, 50);
    };

    if (story.mediaType === "video" && videoRef.current) {
      const vid = videoRef.current;
      if (vid.readyState >= 1 && vid.duration) {
        startTimer(vid.duration * 1000);
      } else {
        vid.onloadedmetadata = () => startTimer(vid.duration * 1000);
        startTimer(STORY_DURATION); // fallback
      }
    } else {
      startTimer(STORY_DURATION);
    }

    return () => clearInterval(intervalRef.current);
  }, [storyIdx, groupIdx, paused]);

  const goNext = () => {
    clearInterval(intervalRef.current);
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((i) => i + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    clearInterval(intervalRef.current);
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      setGroupIdx((i) => i - 1);
      setStoryIdx(0);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/stories/${story.id}`);
      onClose();
    } catch {}
  };

  const loadViewers = async () => {
    try {
      const { data } = await api.get(`/stories/${story.id}/viewers`);
      setViewers(data);
      setShowViewers(true);
      setPaused(true);
    } catch {}
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      const authorId = story.author?._id || story.author?.id;
      await api.post(`/messages/${authorId}`, { text: `Replied to your story: ${reply.trim()}` });
      setReply("");
    } catch {}
  };

  if (!group || !story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)" }}
    >
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 z-20 text-white">
        <IoClose size={28} />
      </button>

      {/* Prev group */}
      {groupIdx > 0 && (
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => { setGroupIdx((i) => i - 1); setStoryIdx(0); }}
          className="absolute left-4 z-20 text-white hidden md:block">
          <BsChevronLeft size={32} />
        </motion.button>
      )}

      {/* Next group */}
      {groupIdx < groups.length - 1 && (
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => { setGroupIdx((i) => i + 1); setStoryIdx(0); }}
          className="absolute right-4 z-20 text-white hidden md:block">
          <BsChevronRight size={32} />
        </motion.button>
      )}

      {/* Story card */}
      <div className="relative w-full max-w-[400px] h-full max-h-[700px] rounded-2xl overflow-hidden"
        style={{ background: "#111" }}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.3)" }}>
              <motion.div className="h-full rounded-full" style={{ background: "#fff" }}
                animate={{ width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%" }}
                transition={{ duration: 0 }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-3 pt-2">
          <Link to={isOwn ? "/profile" : `/profile/${story.author?.username}`} onClick={onClose}
            className="flex items-center gap-2">
            <Avatar src={story.author?.avatar} name={story.author?.name} username={story.author?.username} size={36} />
            <div>
              <p className="text-white text-sm font-semibold drop-shadow">{story.author?.username}</p>
              <p className="text-white/60 text-xs">{formatDistanceToNow(story.createdAt)}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {isOwn && (
              <>
                <button onClick={loadViewers} className="text-white/80">
                  <BsEye size={20} />
                </button>
                <button onClick={handleDelete} className="text-white/80">
                  <IoTrash size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="w-full h-full" onClick={(e) => {
          const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
          if (x < e.currentTarget.offsetWidth / 2) goPrev(); else goNext();
        }}>
          {story.mediaType === "video" ? (
            <video ref={videoRef} src={story.mediaUrl} className="w-full h-full object-cover"
              autoPlay muted playsInline loop={false} />
          ) : (
            <img src={story.mediaUrl} alt="story" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4 z-20">
            <p className="text-white text-sm text-center drop-shadow-lg">{story.caption}</p>
          </div>
        )}

        {/* Reply input (not own story) */}
        {!isOwn && (
          <div className="absolute bottom-4 left-0 right-0 px-4 z-20 flex items-center gap-2">
            <input value={reply} onChange={(e) => setReply(e.target.value)}
              placeholder={`Reply to ${story.author?.username}...`}
              className="flex-1 rounded-full px-4 py-2 text-sm outline-none text-white"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
              onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
              onKeyDown={(e) => { if (e.key === "Enter") { handleReply(); setPaused(false); } }}
            />
            {reply.trim() && (
              <motion.button whileTap={{ scale: 0.85 }} onClick={handleReply}
                className="text-white p-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                <AiOutlineSend size={18} />
              </motion.button>
            )}
          </div>
        )}

        {/* Viewers panel */}
        <AnimatePresence>
          {showViewers && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="absolute inset-0 z-30 flex flex-col rounded-2xl overflow-hidden"
              style={{ background: "var(--bg-card)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="font-semibold" style={{ color: "var(--t1)" }}>Viewers ({viewers.length})</p>
                <button onClick={() => { setShowViewers(false); setPaused(false); }}>
                  <IoClose size={22} style={{ color: "var(--t3)" }} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {viewers.length === 0
                  ? <p className="text-center text-sm" style={{ color: "var(--t3)" }}>No views yet</p>
                  : viewers.map((v) => (
                    <div key={v.id} className="flex items-center gap-3">
                      <Avatar src={v.avatar} name={v.name} username={v.username} size={36} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{v.username}</p>
                        <p className="text-xs" style={{ color: "var(--t3)" }}>{v.name}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
