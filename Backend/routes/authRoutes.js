import { Router } from "express";
import { register, login, getMe, googleAuth } from "../controllers/authController.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register",     register);
router.post("/login",        login);
router.post("/google",       googleAuth);
router.get("/me",            protect, getMe);

export default router;
