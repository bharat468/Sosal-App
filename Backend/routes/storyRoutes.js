import { Router } from "express";
import { createStory, getStoryFeed, viewStory, deleteStory, getViewers } from "../controllers/storyController.js";
import protect from "../middlewares/authMiddleware.js";
import upload  from "../middlewares/upload.js";

const router = Router();
router.use(protect);

router.get("/feed",           getStoryFeed);
router.post("/",              upload.single("media"), createStory);
router.post("/:id/view",      viewStory);
router.get("/:id/viewers",    getViewers);
router.delete("/:id",         deleteStory);

export default router;
