import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
import RightPanel from "./RightPanel";
import AnimatedBg from "./AnimatedBg";

const noRight = ["/messages", "/reels"];

export default function Layout() {
  const { pathname } = useLocation();
  const showRight    = !noRight.includes(pathname);
  const collapseSide = false;

  return (
    <div className="min-h-screen flex w-full" style={{ background: "var(--bg-body)", position: "relative" }}>
      <AnimatedBg />
      <div className="flex w-full min-h-screen" style={{ position: "relative", zIndex: 1 }}>

        <SideNav collapsed={collapseSide} />

        <div className="flex flex-1 min-w-0 justify-center">
          <main
            className="w-full min-w-0 overflow-y-auto"
            style={{
              maxWidth: showRight ? 630 : 935,
              background: "var(--bg-surface)",
              borderLeft:  "1px solid var(--border)",
              borderRight: "1px solid var(--border)",
            }}
          >
            <Outlet />
            {/* Spacer for mobile bottom nav — 56px nav + safe area */}
            <div className="md:hidden" style={{ height: "calc(56px + env(safe-area-inset-bottom, 8px))" }} aria-hidden="true" />
          </main>

          {showRight && <RightPanel />}
        </div>

        {/* z-[100] so it's above content but below modals (z-200) */}
        <BottomNav />
      </div>
    </div>
  );
}
