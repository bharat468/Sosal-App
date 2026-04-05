import { Router } from "express";
import { deleteComment } from "../controllers/commentController.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.delete("/:id", deleteComment);

export default router;
