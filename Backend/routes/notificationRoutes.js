import { Router } from "express";
import {
  getNotifications, markAllRead,
  markOneRead, deleteNotification,
} from "../controllers/notificationController.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/",           getNotifications);
router.put("/read",       markAllRead);
router.put("/:id/read",   markOneRead);
router.delete("/:id",     deleteNotification);

export default router;
