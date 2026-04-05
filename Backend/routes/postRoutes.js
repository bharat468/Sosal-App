import { Router } from "express";
import {
  createPost, getFeed, getReels, getPost,
  getUserPosts, editPost, deletePost, likePost, sharePost,
  getByHashtag, getTrendingHashtags,
} from "../controllers/postController.js";
import { addComment, getComments } from "../controllers/commentController.js";
import { toggleBookmark, getBookmarks, bookmarkStatus } from "../controllers/bookmarkController.js";
import protect from "../middlewares/authMiddleware.js";
import upload  from "../middlewares/upload.js";

const router = Router();
router.use(protect);

router.get("/feed",              getFeed);
router.get("/reels",             getReels);
router.get("/trending-hashtags", getTrendingHashtags);
router.get("/bookmarks",         getBookmarks);
router.get("/hashtag/:tag",      getByHashtag);
router.post("/",                 upload.single("media"), createPost);
router.get("/user/:userId",      getUserPosts);
router.post("/:id/like",         likePost);
router.post("/:id/share",        sharePost);
router.post("/:id/bookmark",     toggleBookmark);
router.get("/:id/bookmark",      bookmarkStatus);
router.put("/:id",               upload.single("media"), editPost);
router.delete("/:id",            deletePost);
router.get("/:id",               getPost);
router.post("/:id/comments",     addComment);
router.get("/:id/comments",      getComments);

export default router;
