import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

export default function AnimatedBg() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let animId;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    // Orbs — warm orange/amber palette
    const orbs = Array.from({ length: 4 }, (_, i) => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    160 + Math.random() * 220,
      dx:   (Math.random() - 0.5) * 0.25,
      dy:   (Math.random() - 0.5) * 0.25,
      hue:  [22, 35, 18, 28][i],
      alpha: 0.03 + Math.random() * 0.04,
    }));

    // Particles
    const particles = Array.from({ length: 40 }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    0.5 + Math.random() * 1.5,
      dx:   (Math.random() - 0.5) * 0.3,
      dy:   -0.2 - Math.random() * 0.4,
      alpha: 0.2 + Math.random() * 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      if (!isDark) { animId = requestAnimationFrame(draw); return; }

      // Draw orbs
      orbs.forEach((o) => {
        o.x += o.dx; o.y += o.dy;
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r;
        if (o.y > H + o.r) o.y = -o.r;

        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `hsla(${o.hue},80%,60%,${o.alpha})`);
        g.addColorStop(1, `hsla(${o.hue},80%,60%,0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // Draw particles
      particles.forEach((p) => {
        p.x += p.dx; p.y += p.dy;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha * 0.4})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isDark]);

  if (!isDark) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 1 }}
    />
  );
}
