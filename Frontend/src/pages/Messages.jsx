import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearUnreadMsg } from "../redux/slices/notifSlice";
import { IoArrowBack, IoChatbubbleOutline } from "react-icons/io5";
import { BsEmojiSmile, BsImage, BsCheck2, BsCheck2All } from "react-icons/bs";
import { HiDotsHorizontal } from "react-icons/hi";
import { AiOutlineSend } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import Avatar from "../components/Avatar";
import api from "../api/api";
import { useSocket } from "../context/SocketContext";
import { formatDistanceToNow } from "../utils/time";

// Shared post preview card in messages
function SharedPostPreview({ postId, isMe, text, onLoad }) {
  const [post, setPost] = useState(null);
  useEffect(() => {
    api.get(`/posts/${postId}`).then(({ data }) => {
      setPost(data);
    }).catch(() => {});
  }, [postId]);

  // Extract caption from message text (before the URL)
  const caption = text?.split("\n")[0]?.replace(/^[📸🎬]\s*/, "").replace(/^.*?:\s*/, "").replace(/^"(.*)"$/, "$1") || "";

  return (
    <div style={{ minWidth: 200, maxWidth: 260 }}>
      {post?.mediaUrl && (
        post.mediaType === "video"
          ? <video src={post.mediaUrl} className="w-full aspect-square object-cover" muted playsInline preload="metadata"
              onLoadedMetadata={onLoad} />
          : <img src={post.mediaUrl} alt="post" className="w-full aspect-square object-cover"
              onLoad={onLoad} />
      )}
      <div className="px-3 py-2">
        <p className="text-xs font-semibold" style={{ color: isMe ? "rgba(255,255,255,0.9)" : "var(--t1)" }}>
          {post?.author?.username || ""}
        </p>
        {(post?.caption || caption) && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: isMe ? "rgba(255,255,255,0.7)" : "var(--t3)" }}>
            {post?.caption || caption}
          </p>
        )}
        <p className="text-[10px] mt-1 font-semibold" style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--accent)" }}>
          View post →
        </p>
      </div>
    </div>
  );
}

// ── Chat List ──────────────────────────────────────────────
function ChatList({ activeUser, onSelect }) {
  const { currentUser } = useSelector((s) => s.user);
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const activeUserId = String(activeUser?._id || activeUser?.id || "");

  const clearUnreadForUser = useCallback((list, userId) => {
    if (!userId) return list;

    return list.map((item) => {
      const itemUser = item.user || item;
      const itemUserId = String(itemUser?._id || itemUser?.id || "");

      if (itemUserId !== userId || (item.unread ?? 0) === 0) return item;
      return { ...item, unread: 0 };
    });
  }, []);

  useEffect(() => {
    api.get("/messages/conversations")
      .then(({ data }) => {
        setConversations(clearUnreadForUser(data, activeUserId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clearUnreadForUser]);

  useEffect(() => {
    if (!activeUserId) return;
    setConversations((prev) => clearUnreadForUser(prev, activeUserId));
  }, [activeUserId, clearUnreadForUser]);

  const filtered = search.trim()
    ? conversations.filter((item) => {
        const u = item.user || item;
        return u.username?.toLowerCase().includes(search.toLowerCase()) ||
               u.name?.toLowerCase().includes(search.toLowerCase());
      })
    : conversations;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-surface)" }}>
      {/* Header */}
      <div className="px-4 py-4 app-header flex items-center justify-between shrink-0">
        <span className="text-lg font-bold" style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>{currentUser?.username}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-input)", color: "var(--t3)" }}>
          Messages
        </span>
      </div>

      {/* Search */}
      <div className="px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
          <svg width="14" height="14" fill="none" stroke="var(--t3)" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..." className="bg-transparent text-sm flex-1 outline-none"
            style={{ color: "var(--t1)" }} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-14 h-14 rounded-full shrink-0" style={{ background: "var(--bg-skeleton)" }} />
                <div className="flex-1">
                  <div className="h-3 rounded w-28 mb-1.5" style={{ background: "var(--bg-skeleton)" }} />
                  <div className="h-2 rounded w-20" style={{ background: "var(--bg-skeleton)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <IoChatbubbleOutline size={40} style={{ color: "var(--t4)" }} className="mb-3" />
            <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>No chats yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>People appear here after you message them</p>
          </div>
        ) : (
          filtered.map((item) => {
            const user    = item.user || item;
            const lastMsg = item.lastMessage;
            const unread  = item.unread ?? 0;
            const isOnline = onlineUsers.includes(String(user._id || user.id));
            const isActive = activeUser?.id === user.id;

            return (
              <motion.button
                key={user.id}
                onClick={() => {
                  setConversations((prev) => clearUnreadForUser(prev, String(user._id || user.id)));
                  onSelect(user);
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                style={{ background: isActive ? "var(--bg-active)" : "transparent" }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Avatar + online dot */}
                <div className="relative shrink-0">
                  <Avatar src={user.avatar} name={user.name} username={user.username} size={52} />
                  {isOnline && (
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ background: "#22c55e", borderColor: "var(--bg-surface)" }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>
                      {user.name || user.username}
                    </p>
                    {lastMsg && (
                      <span className="text-[11px] shrink-0 ml-2" style={{ color: "var(--t4)" }}>
                        {formatDistanceToNow(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5"
                    style={{ color: unread > 0 ? "var(--t1)" : "var(--t3)", fontWeight: unread > 0 ? 600 : 400 }}>
                    {lastMsg ? lastMsg.text : `@${user.username}`}
                  </p>
                </div>

                {/* Unread badge */}
                {unread > 0 && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--accent)" }}>
                    <span className="text-white text-[10px] font-bold">{unread}</span>
                  </div>
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Chat Window ────────────────────────────────────────────
function ChatWindow({ user, onBack }) {
  const { currentUser } = useSelector((s) => s.user);
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [typing, setTyping]     = useState(false);
  const [sending, setSending]   = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef  = useRef(null);
  const scrollRef  = useRef(null); // messages container ref
  const typingTimer = useRef(null);
  const emojiRef   = useRef(null);
  const isOnline = onlineUsers.includes(String(user._id || user.id));

  // Close emoji on outside click
  useEffect(() => {
    const handler = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load history
  useEffect(() => {
    setLoading(true);
    api.get(`/messages/${user._id || user.id}`)
      .then(({ data }) => {
        setMessages(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      const msgSenderId   = msg.sender?._id || msg.sender?.id || msg.senderId;
      const msgReceiverId = msg.receiver?._id || msg.receiver?.id || msg.receiverId;
      const myId   = currentUser._id || currentUser.id;
      const otherId = user._id || user.id;

      if (
        (msgSenderId?.toString() === otherId?.toString() && msgReceiverId?.toString() === myId?.toString()) ||
        (msgSenderId?.toString() === myId?.toString()    && msgReceiverId?.toString() === otherId?.toString())
      ) {
        setMessages((prev) => {
          if (prev.find((m) => (m._id || m.id)?.toString() === (msg._id || msg.id)?.toString())) return prev;
          return [...prev, msg];
        });
        socket.emit("mark_read", { senderId: otherId });
      }
    };

    const onMsgSent = (msg) => {
      setMessages((prev) => {
        const msgId = (msg._id || msg.id)?.toString();
        if (prev.find((m) => (m._id || m.id)?.toString() === msgId)) return prev;
        return [...prev, msg];
      });
      // Scroll to bottom after sending
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    };

    const onTyping      = ({ userId }) => { if (userId === user.id) setTyping(true); };
    const onStopTyping  = ({ userId }) => { if (userId === user.id) setTyping(false); };

    socket.on("new_message",    onNewMessage);
    socket.on("message_sent",   onMsgSent);
    socket.on("user_typing",    onTyping);
    socket.on("user_stop_typing", onStopTyping);

    // Mark existing as read
    socket.emit("mark_read", { senderId: user._id || user.id });

    return () => {
      socket.off("new_message",    onNewMessage);
      socket.off("message_sent",   onMsgSent);
      socket.off("user_typing",    onTyping);
      socket.off("user_stop_typing", onStopTyping);
    };
  }, [socket, user.id, currentUser.id]);

  // Auto scroll — scroll container to bottom
  const scrollToBottom = useCallback((smooth = false) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
    }
  }, []);

  // Scroll to bottom when messages first load (loading goes false)
  useEffect(() => {
    if (!loading && messages.length > 0) {
      // Double rAF — waits for images/cards to render and expand
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      });
      // Also scroll after a delay to catch lazy-loaded images
      const t = setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 400);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      scrollToBottom(true); // smooth for new messages
    }
  }, [messages, typing]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit("typing", { receiverId: user._id || user.id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("stop_typing", { receiverId: user._id || user.id });
    }, 1500);
  };

  const handleSend = useCallback(() => {
    if (!input.trim() || sending) return;
    setSending(true);
    clearTimeout(typingTimer.current);
    socket?.emit("stop_typing", { receiverId: user._id || user.id });

    if (socket?.connected) {
      socket.emit("send_message", { receiverId: user._id || user.id, text: input.trim() });
      setInput("");
      setSending(false);
    } else {
      // Fallback to REST
      api.post(`/messages/${user._id || user.id}`, { text: input.trim() })
        .then(({ data }) => setMessages((prev) => [...prev, data]))
        .catch(() => {})
        .finally(() => { setInput(""); setSending(false); });
    }
  }, [input, sending, socket, user.id]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-surface)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0 app-header">
        <motion.button onClick={onBack} whileTap={{ scale: 0.8 }} className="lg:hidden mr-1" style={{ color: "var(--t1)" }}>
          <IoArrowBack size={22} />
        </motion.button>

        <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <Avatar src={user.avatar} name={user.name} username={user.username} size={40} />
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: "#22c55e", borderColor: "var(--bg-surface)" }} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>{user.name || user.username}</p>
            <p className="text-xs" style={{ color: isOnline ? "#22c55e" : "var(--t4)" }}>
              {isOnline ? "Active now" : "Offline"}
            </p>
          </div>
        </Link>

        <motion.button whileTap={{ scale: 0.8 }} style={{ color: "var(--t3)" }}>
          <HiDotsHorizontal size={20} />
        </motion.button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <>
            {/* Profile card at top */}
            <div className="flex flex-col items-center py-6 mb-4">
              <Avatar src={user.avatar} name={user.name} username={user.username} size={72} />
              <p className="font-semibold mt-2" style={{ color: "var(--t1)" }}>{user.name || user.username}</p>
              <p className="text-sm" style={{ color: "var(--t3)" }}>@{user.username}</p>
              <Link to={`/profile/${user.username}`}>
                <motion.button whileTap={{ scale: 0.92 }}
                  className="mt-3 text-sm font-semibold px-4 py-1.5 rounded-lg"
                  style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}>
                  View profile
                </motion.button>
              </Link>
            </div>

            {messages.length === 0 && (
              <p className="text-center text-sm py-4" style={{ color: "var(--t3)" }}>
                Say hi to {user.name || user.username}! 👋
              </p>
            )}

            {/* Message bubbles */}
            {messages.map((msg, i) => {
              const msgSenderId = msg.sender?._id || msg.sender?.id || msg.senderId;
              const myId = currentUser._id || currentUser.id;
              const isMe = msgSenderId?.toString() === myId?.toString();
              const showTime = i === 0 || (new Date(msg.createdAt) - new Date(messages[i-1].createdAt)) > 300000;

              // Detect shared post URL
              const postUrlMatch = msg.text?.match(/\/post\/([a-f0-9]{24})/);
              const sharedPostId = postUrlMatch?.[1];

              return (
                <div key={msg._id || msg.id}>
                  {showTime && (
                    <p className="text-center text-[11px] my-3" style={{ color: "var(--t4)" }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    {!isMe && (
                      <Avatar src={user.avatar} name={user.name} username={user.username} size={24} className="shrink-0 mb-1" />
                    )}
                    {sharedPostId ? (
                      // Shared post card
                      <Link to={`/post/${sharedPostId}`}
                        className="max-w-[72%] rounded-2xl overflow-hidden text-sm"
                        style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                        <SharedPostPreview
                          postId={sharedPostId}
                          isMe={isMe}
                          text={msg.text}
                          onLoad={() => {
                            if (scrollRef.current) {
                              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                            }
                          }}
                        />
                      </Link>
                    ) : (
                      <div
                        className="max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-snug whitespace-pre-wrap"
                        style={isMe
                          ? { background: "var(--accent)", color: "#fff", borderBottomRightRadius: 4 }
                          : { background: "var(--bg-card)", color: "var(--t1)", border: "1px solid var(--border)", borderBottomLeftRadius: 4 }
                        }
                      >
                        {msg.text}
                      </div>
                    )}
                    {isMe && (
                      <span className="shrink-0 mb-1" style={{ color: msg.read ? "var(--accent)" : "var(--t4)" }}>
                        {msg.read ? <BsCheck2All size={14} /> : <BsCheck2 size={14} />}
                      </span>
                    )}
                  </motion.div>
                </div>
              );
            })}

            {/* Typing indicator */}
            <AnimatePresence>
              {typing && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-end gap-2 mb-2">
                  <Avatar src={user.avatar} name={user.name} username={user.username} size={24} className="shrink-0" />
                  <div className="px-4 py-3 rounded-2xl flex gap-1 items-center"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderBottomLeftRadius: 4 }}>
                    {[0,1,2].map((i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full"
                        style={{ background: "var(--t3)" }}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 shrink-0 flex items-center gap-3 app-header">
        <div ref={emojiRef} className="relative">
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => setShowEmoji(!showEmoji)}>
            <BsEmojiSmile size={22} style={{ color: showEmoji ? "var(--accent)" : "var(--t3)" }} />
          </motion.button>
          <AnimatePresence>
            {showEmoji && (
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-12 left-0 z-50">
                <EmojiPicker
                  onEmojiClick={(e) => { setInput((t) => t + e.emoji); setShowEmoji(false); }}
                  theme="auto" height={380} width={300}
                  previewConfig={{ showPreview: false }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 flex items-center rounded-full px-4 py-2.5 gap-2"
          style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
          <input
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--t1)" }}
          />
        </div>

        <AnimatePresence mode="wait">
          {input.trim() ? (
            <motion.button key="send"
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              whileTap={{ scale: 0.85 }} onClick={handleSend} disabled={sending}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--accent)" }}>
              <AiOutlineSend size={18} className="text-white" />
            </motion.button>
          ) : (
            <motion.button key="img"
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              whileTap={{ scale: 0.85 }} style={{ color: "var(--t3)" }}>
              <BsImage size={22} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main Messages Page ─────────────────────────────────────
export default function Messages() {
  const location = useLocation();
  const dispatch = useDispatch();
  const [activeUser, setActiveUser] = useState(null);
  const [mobileView, setMobileView] = useState("list");

  // Clear message unread count when page opens
  useEffect(() => { dispatch(clearUnreadMsg()); }, [dispatch]);

  // Open chat directly when coming from profile message button
  useEffect(() => {
    const user = location.state?.user;
    if (!user) return;
    setActiveUser(user);
    setMobileView("chat");
  }, [location.state]);

  const handleSelect = (user) => { setActiveUser(user); setMobileView("chat"); };
  const handleBack   = ()     => { setMobileView("list"); setActiveUser(null); };

  return (
    <div className="flex overflow-hidden" style={{ height: "calc(100dvh - 56px)" }}>
      {/* Chat list */}
      <div className={`${mobileView === "chat" ? "hidden" : "flex"} lg:flex flex-col h-full shrink-0`}
        style={{ width: "100%", maxWidth: 360, borderRight: "1px solid var(--border)" }}>
        <ChatList onSelect={handleSelect} activeUser={activeUser} />
      </div>

      {/* Chat window */}
      <div className={`${mobileView === "list" ? "hidden" : "flex"} lg:flex flex-col flex-1 h-full min-w-0`}>
        {activeUser ? (
          <ChatWindow user={activeUser} onBack={handleBack} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ border: "2px solid var(--border)" }}>
              <IoChatbubbleOutline size={36} style={{ color: "var(--t4)" }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: "var(--t1)" }}>Your Messages</p>
            <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>
              Select a conversation to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
