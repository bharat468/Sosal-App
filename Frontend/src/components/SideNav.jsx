import { NavLink, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { AiOutlineHome, AiFillHome } from "react-icons/ai";
import { BiSearch } from "react-icons/bi";
import { BsCameraVideo, BsCameraVideoFill, BsPlusSquare, BsPlusSquareFill } from "react-icons/bs";
import { IoChatbubbleOutline, IoChatbubble, IoNotificationsOutline, IoNotifications } from "react-icons/io5";
import { HiOutlineUser, HiUser } from "react-icons/hi";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";

export default function SideNav({ collapsed }) {
  const { currentUser }          = useSelector((s) => s.user);
  const { unread, unreadMsgs }   = useSelector((s) => s.notif);

  const navItems = [
    { to: "/",              label: "Home",          end: true, icon: <AiOutlineHome size={20} />,       activeIcon: <AiFillHome size={20} />,      badge: 0 },
    { to: "/search",        label: "Search",                   icon: <BiSearch size={20} />,             activeIcon: <BiSearch size={20} />,         badge: 0 },
    { to: "/reels",         label: "Reels",                    icon: <BsCameraVideo size={19} />,        activeIcon: <BsCameraVideoFill size={19} />, badge: 0 },
    { to: "/messages",      label: "Messages",                 icon: <IoChatbubbleOutline size={20} />,  activeIcon: <IoChatbubble size={20} />,      badge: unreadMsgs },
    { to: "/notifications", label: "Notifications",            icon: <IoNotificationsOutline size={21}/>, activeIcon: <IoNotifications size={21} />,  badge: unread },
    { to: "/profile",       label: "Profile",                  icon: <HiOutlineUser size={20} />,        activeIcon: <HiUser size={20} />,            badge: 0 },
  ];

  return (
    <nav
      className={`hidden md:flex flex-col h-screen sticky top-0 py-5 shrink-0 ${
        collapsed ? "w-[68px]" : "w-[68px] lg:w-[232px]"
      }`}
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid var(--nav-border)",
      }}
    >
      {/* Brand */}
      <div className="h-[52px] flex items-center justify-center lg:justify-start lg:px-5 mb-3">
        <span className="text-[20px] font-bold cursor-pointer"
          style={{ fontFamily: "Sora, sans-serif", color: "var(--t1)", letterSpacing: "-0.3px" }}>
          <span className="lg:hidden" style={{ color: "var(--accent)" }}>S</span>
          <span className="hidden lg:inline">
            {collapsed
              ? <span style={{ color: "var(--accent)" }}>S</span>
              : <span>Sosal</span>}
          </span>
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col flex-1 gap-0.5 px-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="block">
            {({ isActive }) => (
              <motion.div whileTap={{ scale: 0.96 }}
                className="flex items-center justify-center lg:justify-start gap-3 rounded-lg py-2.5 px-2 lg:px-3 cursor-pointer relative"
                style={{
                  background: isActive ? "var(--bg-active)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--t3)",
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--t1)"; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t3)"; } }}
              >
                {/* Active left bar */}
                {isActive && (
                  <motion.div layoutId="navBar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: "var(--accent)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}

                <div className="relative shrink-0">
                  {isActive ? item.activeIcon : item.icon}
                  {item.badge > 0 && !isActive && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: "var(--accent)", fontSize: 8, padding: "0 3px" }}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>

                <span className="hidden lg:inline text-[13.5px]"
                  style={{ fontFamily: "DM Sans, sans-serif", fontWeight: isActive ? 600 : 400 }}>
                  {item.label}
                </span>

                {item.badge > 0 && !isActive && (
                  <span className="hidden lg:flex ml-auto min-w-[18px] h-[18px] rounded-full items-center justify-center text-white font-bold text-[9px]"
                    style={{ background: "var(--accent)", padding: "0 4px" }}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </motion.div>
            )}
          </NavLink>
        ))}

        {/* Create */}
        <Link to="/create" className="block mt-1">
          <motion.div whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center lg:justify-start gap-3 rounded-lg py-2.5 px-2 lg:px-3 cursor-pointer"
            style={{ color: "var(--t3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--t1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t3)"; }}
          >
            <BsPlusSquare size={19} />
            <span className="hidden lg:inline text-[13.5px]" style={{ fontFamily: "DM Sans, sans-serif" }}>Create</span>
          </motion.div>
        </Link>
      </div>

      {/* Bottom */}
      <div className="px-2 flex flex-col gap-1">
        <div className="flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2">
          <ThemeToggle />
          <span className="hidden lg:inline text-[12px]" style={{ color: "var(--t3)", fontFamily: "DM Sans, sans-serif" }}>Theme</span>
        </div>
        <NavLink to="/profile" className="block">
          <motion.div whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center lg:justify-start gap-3 rounded-lg py-2.5 px-2 lg:px-3 cursor-pointer"
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Avatar src={currentUser?.avatar} name={currentUser?.name} username={currentUser?.username} size={26} />
            <div className="hidden lg:block min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>
                {currentUser?.username}
              </p>
            </div>
          </motion.div>
        </NavLink>
      </div>
    </nav>
  );
}
