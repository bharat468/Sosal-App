import { Router } from "express";
import { getTracks, uploadTrack } from "../controllers/trackController.js";
import protect from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Audio files only"));
  },
});

const router = Router();
router.use(protect);
router.get("/",        getTracks);
router.post("/upload", audioUpload.single("audio"), uploadTrack);

export default router;
