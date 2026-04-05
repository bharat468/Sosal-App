import { v2 as cloudinary } from "cloudinary";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Upload file to Cloudinary
// Returns { url, publicId, isCloud }
export async function uploadToCloudinary(filePath, folder = "sosal") {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
      use_filename: false,
      unique_filename: true,
    });
    return { url: result.secure_url, publicId: result.public_id, isCloud: true };
  } catch (err) {
    console.error("Cloudinary upload failed:", err.message);
    // Fallback: keep local file, return local URL via APP_URL env
    const filename = path.basename(filePath);
    const base = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    return { url: `${base}/uploads/${filename}`, publicId: null, isCloud: false };
  }
}

// Delete from Cloudinary
export async function deleteFromCloudinary(publicId, resourceType = "image") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
}

// Extract public_id from Cloudinary URL
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
