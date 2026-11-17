import "../config/env.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { uploadFileToCloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import { projectRoot } from "../config/env.js";

async function run() {
  if (!isCloudinaryConfigured()) {
    console.error("Cloudinary is not configured!");
    return;
  }
  console.log("Cloudinary is configured and ready.");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const c of collections) {
    const coll = mongoose.connection.db.collection(c.name);
    const docs = await coll.find({}).toArray();

    for (const doc of docs) {
      let updated = false;
      const updates = {};

      // Check fields: url, thumbnail, image, images
      for (const field of ["url", "thumbnail", "image"]) {
        const val = doc[field];
        if (typeof val === "string" && val.startsWith("/uploads/")) {
          const localRel = val.replace(/^\//, "");
          const localPath = path.join(projectRoot, localRel);

          if (fs.existsSync(localPath)) {
            console.log(`Uploading ${val} from ${localPath}...`);
            try {
              const res = await uploadFileToCloudinary(localPath, { folder: "arena" });
              updates[field] = res.secure_url;
              if (field === "url" && !doc.publicId) {
                updates.publicId = res.public_id;
              }
              updated = true;
              console.log(`-> Migrated ${val} to ${res.secure_url}`);
            } catch (err) {
              console.error(`Failed to upload ${localPath}:`, err.message);
            }
          } else {
            console.warn(`File does not exist on disk: ${localPath}`);
          }
        }
      }

      if (Array.isArray(doc.images)) {
        const newImages = [];
        let imagesChanged = false;
        for (const img of doc.images) {
          if (typeof img === "string" && img.startsWith("/uploads/")) {
            const localRel = img.replace(/^\//, "");
            const localPath = path.join(projectRoot, localRel);
            if (fs.existsSync(localPath)) {
              try {
                const res = await uploadFileToCloudinary(localPath, { folder: "arena" });
                newImages.push(res.secure_url);
                imagesChanged = true;
                console.log(`-> Migrated array image ${img} to ${res.secure_url}`);
              } catch (err) {
                newImages.push(img);
              }
            } else {
              newImages.push(img);
            }
          } else {
            newImages.push(img);
          }
        }
        if (imagesChanged) {
          updates.images = newImages;
          updated = true;
        }
      }

      if (updated) {
        await coll.updateOne({ _id: doc._id }, { $set: updates });
        console.log(`Updated document ${doc._id} in ${c.name}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log("Migration check complete.");
}

run().catch(console.error);

