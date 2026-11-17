import "../config/env.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { uploadFileToCloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import Media from "../models/Media.js";
import { projectRoot } from "../config/env.js";

async function run() {
  if (!isCloudinaryConfigured()) {
    console.error("Cloudinary not configured!");
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI);

  const brokenItems = await Media.find({
    $or: [{ url: { $regex: "^/uploads/" } }, { thumbnail: { $regex: "^/uploads/" } }],
  });

  console.log("Found", brokenItems.length, "items with local /uploads/ paths");

  // Fallback files map
  const fallbackCandidates = [
    path.join(projectRoot, "public/ev2.jpg"),
    path.join(projectRoot, "public/ev3.jpg"),
    path.join(projectRoot, "public/ebc-stadium-hero.webp"),
    path.join(projectRoot, "public/ebc-mini-stadiums.jpg"),
    path.join(projectRoot, "public/asxssx.jpg"),
    path.join(projectRoot, "public/sw.jpg"),
    path.join(projectRoot, "public/logo.jpg"),
    path.join(projectRoot, "uploads/media/tts-1794815734020.jpg"),
    path.join(projectRoot, "uploads/media/jac-1794815889921.jpg"),
  ].filter((p) => fs.existsSync(p));

  // Upload fallback images to Cloudinary once
  const uploadedUrls = [];
  for (const f of fallbackCandidates) {
    try {
      const res = await uploadFileToCloudinary(f, { folder: "arena/gallery" });
      uploadedUrls.push({ name: path.basename(f), url: res.secure_url, publicId: res.public_id });
      console.log(`Uploaded fallback ${path.basename(f)} -> ${res.secure_url}`);
    } catch (e) {
      console.error("Failed uploading fallback", f, e.message);
    }
  }

  for (let i = 0; i < brokenItems.length; i++) {
    const item = brokenItems[i];
    const fallback = uploadedUrls[i % uploadedUrls.length];
    if (fallback) {
      item.url = fallback.url;
      item.thumbnail = fallback.url;
      item.publicId = fallback.publicId;
      await item.save();
      console.log(`Updated media ${item._id} (${item.event}) -> ${fallback.url}`);
    }
  }

  await mongoose.disconnect();
  console.log("All broken media updated to Cloudinary!");
}

run().catch(console.error);

