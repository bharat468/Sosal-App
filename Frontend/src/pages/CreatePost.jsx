import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { createPost } from "../redux/slices/postsSlice";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BsImage, BsCameraVideo, BsX, BsLink45Deg } from "react-icons/bs";
import PageTransition from "../components/PageTransition";

export default function CreatePost() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [caption, setCaption]   = useState("");
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");   // URL input
  const [urlInput, setUrlInput] = useState("");   // raw input
  const [tab, setTab]           = useState("upload"); // "upload" | "url"
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Handle file pick
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMediaUrl("");
    setUrlInput("");
  };

  // Handle URL input — show preview immediately
  const handleUrlChange = (e) => {
    const val = e.target.value.trim();
    setUrlInput(e.target.value);
    setMediaUrl(val);
    setFile(null);
    setPreview(null);
  };

  const clearMedia = () => {
    setFile(null);
    setPreview(null);
    setMediaUrl("");
    setUrlInput("");
  };

  const isVideo = (url) => url && (url.includes(".mp4") || url.includes(".mov") || url.includes(".webm") || url.includes("video"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !file && !mediaUrl) {
      setError("Add a caption, image/video file, or media URL");
      return;
    }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      if (caption)  fd.append("caption",  caption.trim());
      if (file)     fd.append("media",    file);
      if (mediaUrl) fd.append("mediaUrl", mediaUrl);  // URL-based media
      await dispatch(createPost(fd)).unwrap();
      navigate("/");
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to create post");
    } finally { setLoading(false); }
  };

  // What to show in preview area
  const showPreview = preview || mediaUrl;
  const previewIsVideo = file?.type?.startsWith("video") || isVideo(mediaUrl);

  return (
    <PageTransition>
      <div className="px-4 py-3 sticky top-0 z-10 app-header flex items-center justify-between">
        <h1 className="text-lg font-bold" style={{ color: "var(--t1)" }}>New Post</h1>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} style={{ color: "var(--t3)" }}>
          <BsX size={26} />
        </motion.button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {[
            { id: "upload", label: "Upload File",  icon: <BsImage size={15} /> },
            { id: "url",    label: "Paste URL",    icon: <BsLink45Deg size={15} /> },
          ].map((t) => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); clearMedia(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? "var(--accent)" : "var(--bg-input)",
                color: tab === t.id ? "#fff" : "var(--t3)",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Media area */}
        <div className="relative w-full rounded-2xl overflow-hidden"
          style={{ aspectRatio: "1/1", border: "2px dashed var(--border)", background: "var(--bg-input)" }}>

          {showPreview ? (
            <>
              {previewIsVideo ? (
                <video src={preview || mediaUrl} className="w-full h-full object-cover" controls />
              ) : (
                <img src={preview || mediaUrl} alt="preview" className="w-full h-full object-cover"
                  onError={() => setError("Could not load image from URL")} />
              )}
              {/* Clear button */}
              <motion.button type="button" whileTap={{ scale: 0.85 }}
                onClick={clearMedia}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.6)" }}>
                <BsX size={18} className="text-white" />
              </motion.button>
            </>
          ) : tab === "upload" ? (
            <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
              onClick={() => fileRef.current?.click()}>
              <div className="flex gap-4 mb-3">
                <BsImage size={36} style={{ color: "var(--accent)" }} />
                <BsCameraVideo size={36} style={{ color: "var(--accent2)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>Tap to add photo or video</p>
              <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>JPG, PNG, GIF, MP4 up to 50MB</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center px-6">
              <BsLink45Deg size={40} style={{ color: "var(--accent)" }} className="mb-3" />
              <p className="text-sm font-medium mb-1" style={{ color: "var(--t1)" }}>Paste image or video URL</p>
              <p className="text-xs" style={{ color: "var(--t3)" }}>Preview will appear here</p>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

        {/* URL input — shown when tab is url */}
        <AnimatePresence>
          {tab === "url" && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <input
                type="url"
                value={urlInput}
                onChange={handleUrlChange}
                placeholder="https://example.com/image.jpg"
                className="app-input"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          rows={3}
          className="app-input resize-none"
          style={{ borderRadius: 12 }}
        />

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-center" style={{ color: "#ed4956" }}>
            {error}
          </motion.p>
        )}

        <motion.button type="submit" whileTap={{ scale: 0.96 }}
          disabled={loading || (!caption.trim() && !file && !mediaUrl)}
          className="grad-btn w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
          {loading ? "Posting..." : "Share Post"}
        </motion.button>
      </form>
    </PageTransition>
  );
}
