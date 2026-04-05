import { Router } from "express";
import {
  getStats, getUsers, updateUser, deleteUser,
  getPosts, deletePost,
} from "../controllers/adminController.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

// Admin check — role must be "admin"
const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Admin access required" });
};

router.use(protect, adminOnly);

router.get("/stats",         getStats);
router.get("/users",         getUsers);
router.put("/users/:id",     updateUser);
router.delete("/users/:id",  deleteUser);
router.get("/posts",         getPosts);
router.delete("/posts/:id",  deletePost);

// Promote/demote user role (admin only)
router.put("/users/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role))
    return res.status(400).json({ message: "Invalid role" });
  const User = (await import("../models/User.js")).default;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
    .select("username role");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ ...user.toObject(), id: user._id });
});

export default router;
