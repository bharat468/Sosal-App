import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { BsSun, BsMoon } from "react-icons/bs";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.82 }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${className}`}
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
    >
      <motion.span
        key={isDark ? "sun" : "moon"}
        initial={{ rotate: -20, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.18 }}>
        {isDark
          ? <BsSun size={14} style={{ color: "#EF9F27" }} />
          : <BsMoon size={13} style={{ color: "var(--accent)" }} />
        }
      </motion.span>
    </motion.button>
  );
}
