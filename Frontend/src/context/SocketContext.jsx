import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";
import { incrementUnreadMsg, incrementUnread } from "../redux/slices/notifSlice";

const SocketContext = createContext(null);

function getSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  try {
    const u = new URL(apiUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "http://localhost:3000";
  }
}

export function SocketProvider({ children }) {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((s) => s.user);
  const socketRef  = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected]     = useState(false);

  const userId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Disconnect if no user/token
    if (!token || !userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Already connected with same socket — skip
    if (socketRef.current?.connected) return;

    // Disconnect stale socket before creating new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ["polling", "websocket"], // polling first — more stable
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect",       () => setConnected(true));
    socket.on("disconnect",    () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("online_users", (users) => setOnlineUsers(users.map(String)));
    socket.on("user_online",  ({ userId: uid }) => setOnlineUsers((p) => [...new Set([...p, String(uid)])]));
    socket.on("user_offline", ({ userId: uid }) => setOnlineUsers((p) => p.filter((id) => id !== String(uid))));

    socket.on("new_message", () => {
      if (!window.location.pathname.includes("/messages")) {
        dispatch(incrementUnreadMsg());
      }
    });

    socket.on("notification", () => {
      dispatch(incrementUnread());
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]); // only re-run when user changes

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
