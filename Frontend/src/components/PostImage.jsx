import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AiFillHeart } from "react-icons/ai";

/**
 * Instagram-style post image:
 * - Double tap → like animation inside box
 * - Double tap zoom (2.5x) → drag to pan → double tap again to reset
 * - All contained within the image box, nothing overflows
 */
export default function PostImage({ src, alt = "post", onDoubleTap }) {
  const [scale, setScale]       = useState(1);
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [showHeart, setShowHeart] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: "50%", y: "50%" });

  const lastTap   = useRef(0);
  const isDragging = useRef(false);

  const handleDoubleTap = useCallback((e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (scale > 1) {
        // Already zoomed — reset
        setScale(1);
        setPos({ x: 0, y: 0 });
      } else {
        // Zoom in to tap point
        setScale(2.5);
        // Center zoom on tap point
        const offsetX = (rect.width / 2 - x) * 1.5;
        const offsetY = (rect.height / 2 - y) * 1.5;
        setPos({ x: offsetX, y: offsetY });
      }

      // Heart animation at tap position
      setHeartPos({ x: `${(x / rect.width) * 100}%`, y: `${(y / rect.height) * 100}%` });
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);

      // Trigger like
      onDoubleTap?.();
    }
    lastTap.current = now;
  }, [scale, onDoubleTap]);

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{ width: "100%", cursor: scale > 1 ? "grab" : "default" }}
      onTouchStart={handleDoubleTap}
      onClick={handleDoubleTap}
    >
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        drag={scale > 1}
        dragConstraints={{
          left:  -((scale - 1) * 200),
          right:  (scale - 1) * 200,
          top:   -((scale - 1) * 200),
          bottom: (scale - 1) * 200,
        }}
        dragElastic={0.1}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={() => { setTimeout(() => { isDragging.current = false; }, 50); }}
        animate={{ scale, x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full object-cover block"
        style={{ maxHeight: 580, pointerEvents: scale > 1 ? "auto" : "none" }}
        draggable={false}
        whileTap={scale > 1 ? { cursor: "grabbing" } : {}}
      />

      {/* Heart animation — appears at tap position, inside box */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            key="heart"
            className="absolute pointer-events-none"
            style={{
              left: heartPos.x,
              top:  heartPos.y,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <AiFillHeart
              size={90}
              style={{
                color: "#fff",
                filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.5))",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
