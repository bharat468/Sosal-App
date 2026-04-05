import { motion } from "framer-motion";

// Full-page skeleton loader — shown while any page is loading
export default function PageLoader() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-body)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4">
        {/* Spinning ring */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: "var(--border)" }} />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <p className="text-xs" style={{ color: "var(--t4)", fontFamily: "DM Sans, sans-serif", letterSpacing: "0.1em" }}>
          Loading...
        </p>
      </motion.div>
    </div>
  );
}

// Inline skeleton for content areas
export function SkeletonLine({ width = "100%", height = 12, className = "" }) {
  return (
    <div className={`skeleton rounded ${className}`}
      style={{ width, height }} />
  );
}

export function SkeletonAvatar({ size = 40 }) {
  return (
    <div className="skeleton rounded-full shrink-0"
      style={{ width: size, height: size }} />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonAvatar size={36} />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="40%" height={10} />
          <SkeletonLine width="25%" height={8} />
        </div>
      </div>
      <div className="skeleton rounded-lg mb-3" style={{ width: "100%", height: 200 }} />
      <SkeletonLine width="60%" height={10} />
    </div>
  );
}
