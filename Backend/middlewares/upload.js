import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import path from "path";

// Ensure Cloudinary is configured
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});
export async function uploadStreamToCloudinary(buffer, mimetype, folder = "sosal") {
  const isVideo = mimetype.startsWith("video");
  return new Promise((resolve, reject) => {
    const opts = {
      folder,
      resource_type: isVideo ? "video" : "image",
      unique_filename: true,
      overwrite: false,
      ...(isVideo ? {} : { format: "webp", quality: "auto:good" }),
    };

    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      resolve({ url: result.secure_url, publicId: result.public_id, isCloud: true });
    });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

// ── Multer — memory storage (no disk write) ────────────────
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/jpg", "image/png",
      "image/gif", "image/webp", "image/avif",
      "video/mp4", "video/quicktime", "video/webm", "video/avi",
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type ${file.mimetype} not supported`));
  },
});

export default upload;
