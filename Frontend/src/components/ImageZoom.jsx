import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";

export default function ImageZoom({ src, alt }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos]     = useState({ x: 0, y: 0 });
  const lastTap = useRef(0);

  const handleDoubleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setScale((s) => s === 1 ? 2.5 : 1);
      setPos({ x: 0, y: 0 });
    }
    lastTap.current = now;
  };

  return (
    <>
      <img src={src} alt={alt}
        className="w-full object-cover cursor-zoom-in"
        style={{ maxHeight: 580 }}
        onClick={() => setOpen(true)}
        draggable={false}
      />

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.95)" }}
            onClick={() => { setOpen(false); setScale(1); setPos({ x: 0, y: 0 }); }}>
            <button className="absolute top-4 right-4 z-10 text-white" onClick={() => setOpen(false)}>
              <IoClose size={28} />
            </button>
            <motion.img
              src={src} alt={alt}
              className="max-w-full max-h-full object-contain select-none"
              style={{ scale, x: pos.x, y: pos.y, cursor: scale > 1 ? "grab" : "zoom-in" }}
              drag={scale > 1}
              dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
              onDoubleClick={handleDoubleTap}
              onClick={(e) => e.stopPropagation()}
              whileTap={{ cursor: "grabbing" }}
            />
            <p className="absolute bottom-4 text-white/50 text-xs">Double tap to zoom · Drag to pan</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
