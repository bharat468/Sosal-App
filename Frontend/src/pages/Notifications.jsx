import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markAllRead } from "../redux/slices/notifSlice";
import { AiFillHeart } from "react-icons/ai";
import { IoChatbubble, IoPersonAdd, IoCheckmark, IoClose } from "react-icons/io5";
import { BsAt } from "react-icons/bs";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import Avatar from "../components/Avatar";
import { formatDistanceToNow } from "../utils/time";
import api from "../api/api";
import { useSocket } from "../context/SocketContext";
import { showFollowErrorToast, showFollowToast } from "../utils/followFeedback";

const iconMap = {
  like:             <AiFillHeart size={13} style={{ color: "#ed4956" }} />,
  comment:          <IoChatbubble size={13} style={{ color: "var(--accent)" }} />,
  follow:           <IoPersonAdd size={13} style={{ color: "var(--accent)" }} />,
  follow_request:   <IoPersonAdd size={13} style={{ color: "#f59e0b" }} />,
  follow_accepted:  <IoCheckmark size={13} style={{ color: "var(--accent)" }} />,
  mention:          <BsAt size={13} style={{ color: "#a855f7" }} />,
};

const actionText = {
  like:            "liked your post",
  comment:         "commented on your post",
  follow:          "started following you",
  follow_request:  "sent you a follow request",
  follow_accepted: "accepted your follow request",
  mention:         "mentioned you in a comment",
};

// Follow request card
function FollowRequestCard({ request, onAction }) {
  const [loading, setLoading] = useState(false);

  const handle = async (action) => {
    setLoading(true);
    try {
      await api.post(`/users/requests/${request.id}/${action}`);
      onAction(request.id);
    } catch {} finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 px-4 py-3"
      style={{ background: "rgba(245,158,11,0.06)", borderBottom: "1px solid var(--border-soft)" }}>
      <Link to={`/profile/${request.sender?.username}`}>
        <Avatar src={request.sender?.avatar} name={request.sender?.name} username={request.sender?.username} size={44} />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: "var(--t1)" }}>
          <span className="font-semibold">{request.sender?.username}</span>{" "}
          <span style={{ color: "var(--t2)" }}>wants to follow you</span>{" "}
          <span className="text-xs" style={{ color: "var(--t4)" }}>{formatDistanceToNow(request.createdAt)}</span>
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <motion.button whileTap={{ scale: 0.88 }} disabled={loading}
          onClick={() => handle("accept")}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg grad-btn disabled:opacity-50">
          Confirm
        </motion.button>
        <motion.button whileTap={{ scale: 0.88 }} disabled={loading}
          onClick={() => handle("reject")}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}>
          Delete
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notifications, loading, unread } = useSelector((s) => s.notif);
  const { socket } = useSocket();
  const [requests, setRequests]   = useState([]);
  const [followed, setFollowed]   = useState({});
  const [followStatus, setFollowStatus] = useState({});

  useEffect(() => {
    dispatch(fetchNotifications());
    api.get("/users/requests").then(({ data }) => setRequests(data)).catch(() => {});
    return () => { dispatch(markAllRead()); };
  }, [dispatch]);

  // Real-time: add new notification when socket fires
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      // Refresh notifications list
      dispatch(fetchNotifications());
      // If it's a follow request, refresh requests too
      if (notif.type === "follow_request") {
        api.get("/users/requests").then(({ data }) => setRequests(data)).catch(() => {});
      }
    };
    const refreshHandler = () => {
      dispatch(fetchNotifications());
      api.get("/users/requests").then(({ data }) => setRequests(data)).catch(() => {});
    };
    socket.on("notification", handler);
    socket.on("notifications_changed", refreshHandler);
    return () => {
      socket.off("notification", handler);
      socket.off("notifications_changed", refreshHandler);
    };
  }, [socket, dispatch]);

  const handleRequestAction = (requestId) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleFollow = async (senderId, notifId) => {
    try {
      const { data } = await api.post(`/users/${senderId}/follow`);
      setFollowed((p) => ({ ...p, [notifId]: data.following }));
      setFollowStatus((p) => ({
        ...p,
        [notifId]:
          data.status === "followed" ? "following" :
          data.status === "unfollowed" ? "none" :
          data.status === "requested" ? "requested" :
          data.status === "request_cancelled" ? "none" :
          p[notifId] || "none",
      }));
      showFollowToast(data.status);
    } catch (e) {
      showFollowErrorToast(e?.response?.data?.message);
    }
  };

  const handleOpenNotifPost = (notif) => {
    const postId = notif?.post?.id || notif?.post?._id;
    if (!postId) return;
    navigate(`/post/${postId}`);
  };

  return (
    <PageTransition>
      <div className="px-4 py-4 sticky top-0 z-10 app-header flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>Notifications</h1>
        {unread > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {unread} new
          </span>
        )}
      </div>

      {/* Follow requests section */}
      {requests.length > 0 && (
        <div>
          <p className="px-4 pt-4 pb-2 text-sm font-semibold" style={{ color: "var(--t1)" }}>
            Follow Requests ({requests.length})
          </p>
          {requests.map((req) => (
            <FollowRequestCard key={req.id} request={req} onAction={handleRequestAction} />
          ))}
        </div>
      )}

      {/* Notifications */}
      {loading && notifications.length === 0 ? (
        <div className="flex flex-col gap-3 p-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-11 h-11 rounded-full shrink-0" style={{ background: "var(--bg-skeleton)" }} />
              <div className="flex-1">
                <div className="h-3 rounded w-3/4 mb-1" style={{ background: "var(--bg-skeleton)" }} />
                <div className="h-2 rounded w-1/2" style={{ background: "var(--bg-skeleton)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 && requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-semibold" style={{ color: "var(--t1)" }}>No notifications yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>When someone interacts with you, it'll show here.</p>
        </div>
      ) : (
        <>
          {notifications.length > 0 && (
            <p className="px-4 pt-4 pb-2 text-sm font-semibold" style={{ color: "var(--t1)" }}>Activity</p>
          )}
          {notifications.map((n, i) => (
            <motion.div key={n.id}
              initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${(n.type === "like" || n.type === "comment") && (n.post?.id || n.post?._id) ? "cursor-pointer" : ""}`}
              style={!n.read ? { background: "var(--bg-hover)" } : {}}
              onClick={() => handleOpenNotifPost(n)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = !n.read ? "var(--bg-hover)" : "transparent"; }}
            >
              {/* Avatar + icon */}
              <div className="relative shrink-0">
                <Link to={`/profile/${n.sender?.username}`} onClick={(e) => e.stopPropagation()}>
                  <Avatar src={n.sender?.avatar} name={n.sender?.name} username={n.sender?.username} size={44} />
                </Link>
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full p-[3px]"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  {iconMap[n.type] || iconMap.follow}
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug" style={{ color: "var(--t1)" }}>
                  <span className="font-semibold">{n.sender?.username}</span>{" "}
                  <span style={{ color: "var(--t2)" }}>{actionText[n.type] || n.type}</span>{" "}
                  <span className="text-xs" style={{ color: "var(--t4)" }}>{formatDistanceToNow(n.createdAt)}</span>
                </p>
              </div>

              {/* Action */}
              {n.type === "follow" ? (
                <motion.button whileTap={{ scale: 0.88 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const senderId = n.sender?.id || n.sender?._id;
                    if (!senderId) return;
                    handleFollow(senderId, n.id);
                  }}
                  className="shrink-0 text-sm font-semibold px-4 py-1.5 rounded-lg"
                  style={(followStatus[n.id] || n.followStatus || "none") === "following" || (followStatus[n.id] || n.followStatus || "none") === "requested"
                    ? { background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }
                    : { background: "var(--accent)", color: "#fff" }}>
                  {(followStatus[n.id] || n.followStatus || "none") === "requested"
                    ? "Requested"
                    : (followStatus[n.id] || n.followStatus || "none") === "following"
                      ? "Unfollow"
                      : "Follow"}
                </motion.button>
              ) : n.post?.mediaUrl ? (
                <Link to={`/post/${n.post.id || n.post._id}`} onClick={(e) => e.stopPropagation()}>
                  <img src={n.post.mediaUrl} alt="post" className="w-11 h-11 object-cover shrink-0 rounded-sm" />
                </Link>
              ) : null}
            </motion.div>
          ))}
        </>
      )}
    </PageTransition>
  );
}
