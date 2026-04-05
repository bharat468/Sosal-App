import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("show"); // show → fade

  useEffect(() => {
    // Show for 2.2s then fade out
    const t1 = setTimeout(() => setPhase("fade"), 2200);
    const t2 = setTimeout(() => onDone(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#0A0A0A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {/* Animated ring */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "relative", width: 80, height: 80, marginBottom: 28 }}
          >
            {/* Outer ring */}
            <motion.svg
              width="80" height="80" viewBox="0 0 80 80"
              style={{ position: "absolute", inset: 0 }}
              initial={{ rotate: -90 }}
              animate={{ rotate: 270 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            >
              <circle cx="40" cy="40" r="34"
                fill="none"
                stroke="rgba(232,68,10,0.25)"
                strokeWidth="1"
              />
              <motion.circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="#E8440A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="213"
                initial={{ strokeDashoffset: 213 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.8, ease: "easeInOut", delay: 0.2 }}
              />
            </motion.svg>

            {/* Center dot */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
              style={{
                position: "absolute",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 8, height: 8,
                borderRadius: "50%",
                background: "#E8440A",
                boxShadow: "0 0 12px rgba(232,68,10,0.8)",
              }}
            />
          </motion.div>

          {/* App name */}
          <motion.h1
            initial={{ opacity: 0, y: 12, letterSpacing: "0.3em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.18em" }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#F0EBE3",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Sosal
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 11,
              color: "rgba(240,235,227,0.4)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            Connect · Share · Discover
          </motion.p>

          {/* Divider line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
            style={{
              width: 40,
              height: 1,
              background: "rgba(232,68,10,0.5)",
              marginTop: 20,
              transformOrigin: "center",
            }}
          />

          {/* Made by */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 10,
              color: "rgba(240,235,227,0.3)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginTop: 14,
            }}
          >
            Made by Bharat
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
