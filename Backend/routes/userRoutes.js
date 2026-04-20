import { Router } from "express";
import {
  getProfile, updateProfile, changePassword,
  followUser, searchUsers, getFollowers, getFollowing,
  getSuggestions, acceptFollowRequest, rejectFollowRequest, getFollowRequests, shareProfile,
} from "../controllers/userController.js";
import { toggleBlock, getBlocked } from "../controllers/blockController.js";
import { reportUser } from "../controllers/reportController.js";
import protect from "../middlewares/authMiddleware.js";
import upload  from "../middlewares/upload.js";

const router = Router();
router.use(protect);

router.get("/search",                      searchUsers);
router.get("/suggestions",                 getSuggestions);
router.get("/requests",                    getFollowRequests);
router.get("/blocked",                     getBlocked);
router.put("/profile",                     upload.single("avatar"), updateProfile);
router.put("/password",                    changePassword);
router.post("/requests/:requestId/accept", acceptFollowRequest);
router.post("/requests/:requestId/reject", rejectFollowRequest);
router.get("/:username",                   getProfile);
router.post("/:id/follow",                 followUser);
router.post("/:id/share",                  shareProfile);
router.post("/:id/block",                  toggleBlock);
router.post("/:id/report",                 reportUser);
router.get("/:id/followers",               getFollowers);
router.get("/:id/following",               getFollowing);

export default router;
