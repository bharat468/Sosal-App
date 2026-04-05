import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoMusicalNotes } from "react-icons/io5";
import { BsImage, BsCameraVideo } from "react-icons/bs";
import api from "../api/api";
import MusicPicker from "./MusicPicker";

export default function StoryCreate({ onClose, onCreated }) {
  const fileRef = useRef(null);
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const handleSubmit = async () => {
    if (!file) { setError("Please select a photo or video"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("media", file);
      if (caption.trim()) fd.append("caption", caption.trim());
      if (selectedTrack) {
        fd.append("audioUrl",   selectedTrack.url);
        fd.append("trackTitle", selectedTrack.title + " - " + selectedTrack.artist);
      }
      const { data } = await api.post("/stories", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onCreated(data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create story");
    } finally { setLoading(false); }
  };

  const isVideo = file?.type?.startsWith("video");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        className="w-full max-w-[380px] rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-bold" style={{ color: "var(--t1)" }}>Add to Story</h2>
          <button onClick={onClose}><IoClose size={22} style={{ color: "var(--t3)" }} /></button>
        </div>

        <AnimatePresence>
          {showMusicPicker && (
            <MusicPicker selected={selectedTrack} onSelect={setSelectedTrack} onClose={() => setShowMusicPicker(false)} />
          )}
        </AnimatePresence>

        <div className="p-5 flex flex-col gap-4">
          {/* Preview / Upload area */}
          <div className="relative w-full rounded-xl overflow-hidden cursor-pointer"
            style={{ aspectRatio: "9/16", maxHeight: 320, background: "var(--bg-input)", border: "2px dashed var(--border)" }}
            onClick={() => !preview && fileRef.current?.click()}>
            {preview ? (
              <>
                {isVideo
                  ? <video src={preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  : <img src={preview} alt="preview" className="w-full h-full object-cover" />}
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.6)" }}>
                  <IoClose size={16} className="text-white" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="flex gap-4">
                  <BsImage size={32} style={{ color: "var(--accent)" }} />
                  <BsCameraVideo size={32} style={{ color: "var(--accent2)" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--t2)" }}>Tap to add photo or video</p>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

          {preview && (
            <input value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..." className="app-input text-sm"
              style={{ borderRadius: 10 }} />
          )}

          {/* Music button */}
          <motion.button type="button" whileTap={{ scale: 0.96 }}
            onClick={() => setShowMusicPicker(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: selectedTrack ? "var(--accent)" : "var(--bg-hover)" }}>
              <IoMusicalNotes size={15} style={{ color: selectedTrack ? "#fff" : "var(--t3)" }} />
            </div>
            <p className="text-sm truncate" style={{ color: selectedTrack ? "var(--t1)" : "var(--t3)" }}>
              {selectedTrack ? `${selectedTrack.title} - ${selectedTrack.artist}` : "Add music"}
            </p>
          </motion.button>

          {error && <p className="text-sm text-center" style={{ color: "#ed4956" }}>{error}</p>}

          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.94 }} onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}>
              Cancel
            </motion.button>
            <motion.button whileTap={{ scale: 0.94 }} onClick={handleSubmit}
              disabled={loading || !file}
              className="flex-1 grad-btn py-2.5 rounded-xl text-sm disabled:opacity-50">
              {loading ? "Sharing..." : "Share Story"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
