import { v2 as cloudinary } from "cloudinary";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Upload any file to Cloudinary.
 * Images → webp, Videos → mp4
 * THROWS error if upload fails — no local fallback in production
 */
export async function uploadToCloudinary(filePath, folder = "sosal") {
  const ext     = path.extname(filePath).toLowerCase();
  const isVideo = [".mp4", ".mov", ".webm", ".avi", ".mkv"].includes(ext);
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const opts = {
        folder,
        resource_type: isVideo ? "video" : "image",
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      };
      if (!isVideo) {
        opts.format  = "webp";
        opts.quality = "auto:good";
      }

      const result = await cloudinary.uploader.upload(filePath, opts);
      console.log(`[Cloudinary] Uploaded: ${result.secure_url}`);
      return { url: result.secure_url, publicId: result.public_id, isCloud: true };
    } catch (err) {
      console.error(`[Cloudinary] Attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1500));
      } else {
        // In production, throw so caller knows upload failed
        if (process.env.NODE_ENV === "production") {
          throw new Error(`Media upload failed: ${err.message}`);
        }
        // In development, fallback to local URL
        const filename = path.basename(filePath);
        const base = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
        console.warn("[Cloudinary] Using local fallback:", filename);
        return { url: `${base}/uploads/${filename}`, publicId: null, isCloud: false };
      }
    }
  }
}

/**
 * Delete a file from Cloudinary by public_id
 */
export async function deleteFromCloudinary(publicId, resourceType = "image") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("[Cloudinary] Delete failed:", err.message);
  }
}

/**
 * Extract public_id from a Cloudinary URL
 */
export function getPublicId(url) {
  if (!url || !url.includes("cloudinary.com")) return null;
  const parts = url.split("/");
  const uploadIdx = parts.indexOf("upload");
  if (uploadIdx === -1) return null;
  const afterUpload = parts.slice(uploadIdx + 1);
  if (afterUpload[0]?.startsWith("v")) afterUpload.shift();
  return afterUpload.join("/").replace(/\.[^.]+$/, "");
}

export default cloudinary;
