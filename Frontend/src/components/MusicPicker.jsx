import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoMusicalNotes, IoPlay, IoPause, IoSearch } from "react-icons/io5";
import { BsCheck2 } from "react-icons/bs";
import api from "../api/api";

export default function MusicPicker({ selected, onSelect, onClose }) {
  const [tracks, setTracks]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [playing, setPlaying]   = useState(null); // track id currently previewing
  const audioRef = useRef(null);

  useEffect(() => {
    api.get("/tracks").then(({ data }) => setTracks(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = tracks.filter((t) =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.artist.toLowerCase().includes(search.toLowerCase())
  );

  const handlePreview = (track) => {
    if (playing === track.id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.play().catch(() => {});
      }
      setPlaying(track.id);
    }
  };

  const handleSelect = (track) => {
    audioRef.current?.pause();
    setPlaying(null);
    onSelect(track);
    onClose();
  };

  const handleRemove = () => {
    audioRef.current?.pause();
    setPlaying(null);
    onSelect(null);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) { audioRef.current?.pause(); onClose(); } }}>

      <audio ref={audioRef} onEnded={() => setPlaying(null)} />

      <motion.div
        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <IoMusicalNotes size={18} style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>
              Add Music
            </h3>
          </div>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => { audioRef.current?.pause(); onClose(); }}
            style={{ color: "var(--t3)" }}>
            <IoClose size={22} />
          </motion.button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 shrink-0">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
            <IoSearch size={15} style={{ color: "var(--t3)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search songs..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--t1)" }} />
          </div>
        </div>

        {/* Remove music option */}
        {selected && (
          <div className="px-4 pb-2 shrink-0">
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleRemove}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm"
              style={{ background: "rgba(240,112,112,0.1)", color: "var(--danger)", border: "1px solid rgba(240,112,112,0.2)" }}>
              <IoClose size={16} /> Remove music
            </motion.button>
          </div>
        )}

        {/* Track list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4 space-y-1">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: "var(--bg-skeleton)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded w-3/4" style={{ background: "var(--bg-skeleton)" }} />
                  <div className="h-2 rounded w-1/2" style={{ background: "var(--bg-skeleton)" }} />
                </div>
              </div>
            ))
          ) : filtered.map((track) => {
            const isSelected = selected?.id === track.id;
            const isPlaying  = playing === track.id;
            return (
              <motion.div key={track.id} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                style={{ background: isSelected ? "var(--bg-active)" : "transparent" }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>

                {/* Play/Pause preview */}
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => handlePreview(track)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isPlaying ? "var(--accent)" : "var(--bg-input)" }}>
                  {isPlaying
                    ? <IoPause size={16} className="text-white" />
                    : <IoPlay size={16} style={{ color: isSelected ? "var(--accent)" : "var(--t3)" }} />
                  }
                </motion.button>

                {/* Info */}
                <div className="flex-1 min-w-0" onClick={() => handleSelect(track)}>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>{track.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--t3)" }}>
                    {track.artist} · {track.genre}
                  </p>
                </div>

                {/* Selected check */}
                {isSelected && (
                  <BsCheck2 size={18} style={{ color: "var(--accent)", shrink: 0 }} />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
