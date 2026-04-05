import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { AiOutlineHome, AiFillHome } from "react-icons/ai";
import { BiSearch } from "react-icons/bi";
import { BsCameraVideo, BsCameraVideoFill, BsPlusSquare } from "react-icons/bs";
import { IoNotificationsOutline, IoNotifications, IoChatbubbleOutline, IoChatbubble } from "react-icons/io5";
import { useSelector } from "react-redux";
import Avatar from "./Avatar";

export default function BottomNav() {
  const { currentUser }        = useSelector((s) => s.user);
  const { unread, unreadMsgs } = useSelector((s) => s.notif);

  const tabs = [
    { to: "/",              end: true, A: <AiFillHome size={22} />,        I: <AiOutlineHome size={22} />,         badge: 0 },
    { to: "/search",                   A: <BiSearch size={22} />,           I: <BiSearch size={22} />,              badge: 0 },
    { to: "/create",                   A: <BsPlusSquare size={20} />,       I: <BsPlusSquare size={20} />,          badge: 0 },
    { to: "/messages",                 A: <IoChatbubble size={20} />,       I: <IoChatbubbleOutline size={20} />,   badge: unreadMsgs },
    { to: "/notifications",            A: <IoNotifications size={22} />,    I: <IoNotificationsOutline size={22}/>, badge: unread },
  ];

  return (
    <motion.nav
      initial={{ y: 60 }} animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 right-0 flex items-center z-[100]"
      style={{
        height: "calc(56px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--nav-border)",
      }}
    >
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className="flex-1 flex items-center justify-center h-full">
          {({ isActive }) => (
            <motion.span whileTap={{ scale: 0.72 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                color: isActive ? "var(--accent)" : "var(--t3)",
                background: isActive ? "var(--bg-active)" : "transparent",
              }}
            >
              {isActive ? tab.A : tab.I}
              {tab.badge > 0 && !isActive && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: "var(--accent)", fontSize: 8, padding: "0 3px" }}>
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </motion.span>
          )}
        </NavLink>
      ))}

      <NavLink to="/profile" className="flex-1 flex items-center justify-center h-full">
        {({ isActive }) => (
          <motion.div whileTap={{ scale: 0.72 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: isActive ? "var(--bg-active)" : "transparent" }}>
            <Avatar
              src={currentUser?.avatar}
              name={currentUser?.name}
              username={currentUser?.username}
              size={24}
              style={{ outline: isActive ? "2px solid var(--accent)" : "none", outlineOffset: 2 }}
            />
          </motion.div>
        )}
      </NavLink>
    </motion.nav>
  );
}
