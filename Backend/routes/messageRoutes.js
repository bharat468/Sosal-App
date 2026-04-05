import { Router } from "express";
import { getConversations, getMessages, sendMessage, getMessageableUsers } from "../controllers/messageController.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();
router.use(protect);

router.get("/followers",    getMessageableUsers);  // who I can message
router.get("/conversations", getConversations);    // my chat list
router.get("/:userId",      getMessages);          // chat history
router.post("/:userId",     sendMessage);          // send message

export default router;
