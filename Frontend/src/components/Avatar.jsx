import { useState } from "react";

export default function Avatar({ src, name = "", username = "", size = 40, className = "", style: extraStyle = {} }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = src && src.trim() !== "" && !imgError;

  const getInitials = () => {
    const str = name || username || "?";
    const parts = str.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return str.slice(0, 2).toUpperCase();
  };

  const getColor = () => {
    const colors = ["#3b82f6","#ec4899","#8b5cf6","#06b6d4","#f59e0b","#10b981","#ef4444","#6366f1"];
    const str = name || username || "?";
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const baseStyle = { width: size, height: size, borderRadius: "50%", flexShrink: 0, ...extraStyle };

  if (hasImage) {
    return (
      <img src={src} alt={name || username}
        loading="lazy"
        style={{ ...baseStyle, objectFit: "cover" }}
        className={className}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center font-bold text-white shrink-0 ${className}`}
      style={{ ...baseStyle, background: getColor(), fontSize: size * 0.35, letterSpacing: "0.5px" }}>
      {getInitials()}
    </div>
  );
}
