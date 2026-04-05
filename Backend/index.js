import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRoutes         from "./routes/authRoutes.js";
import userRoutes         from "./routes/userRoutes.js";
import postRoutes         from "./routes/postRoutes.js";
import commentRoutes      from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes      from "./routes/messageRoutes.js";
import storyRoutes        from "./routes/storyRoutes.js";
import adminRoutes        from "./routes/adminRoutes.js";
import trackRoutes        from "./routes/trackRoutes.js";
import Message            from "./models/Message.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

const app    = express();
const server = createServer(app);
const PORT   = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ── MongoDB ────────────────────────────────────────────────
mongoose.set("returnDocument", "after");
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err.message));

// ── Security ───────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());

// Rate limiting — auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── CORS ───────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? CLIENT_URL : "*",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── REST Routes ────────────────────────────────────────────
app.use("/api/auth",          authLimiter, authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/posts",         postRoutes);
app.use("/api/comments",      commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages",      messageRoutes);
app.use("/api/stories",       storyRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/tracks",        trackRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use(notFound);
app.use(errorHandler);

// ── Socket.io ──────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Export io so controllers can emit events
export { io };

const onlineUsers = new Map(); // userId -> socketId
export { onlineUsers };

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    if (decoded.exp && decoded.exp < Date.now() / 1000) return next(new Error("Token expired"));
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  onlineUsers.set(userId, socket.id);
  socket.broadcast.emit("user_online", { userId });
  socket.emit("online_users", Array.from(onlineUsers.keys()));

  socket.on("send_message", async ({ receiverId, text }) => {
    if (!text?.trim() || !receiverId) return;
    try {
      const message = await Message.create({ text: text.trim(), sender: userId, receiver: receiverId });
      await message.populate("sender receiver", "id username name avatar");
      const msg = { ...message.toObject(), id: message._id };

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) io.to(receiverSocketId).emit("new_message", msg);
      socket.emit("message_sent", msg);
    } catch (err) {
      socket.emit("message_error", { error: err.message });
    }
  });

  socket.on("typing", ({ receiverId }) => {
    const s = onlineUsers.get(receiverId);
    if (s) io.to(s).emit("user_typing", { userId });
  });

  socket.on("stop_typing", ({ receiverId }) => {
    const s = onlineUsers.get(receiverId);
    if (s) io.to(s).emit("user_stop_typing", { userId });
  });

  socket.on("mark_read", async ({ senderId }) => {
    await Message.updateMany({ sender: senderId, receiver: userId, read: false }, { read: true });
    const s = onlineUsers.get(senderId);
    if (s) io.to(s).emit("messages_read", { by: userId });
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    socket.broadcast.emit("user_offline", { userId });
  });
});

// ── Start ──────────────────────────────────────────────────
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
