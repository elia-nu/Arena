import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config({ path: path.join(projectRoot, "server", ".env") });
dotenv.config();

// Clean carriage returns or extra whitespace from crucial env keys
if (process.env.CLOUDINARY_URL) {
  process.env.CLOUDINARY_URL = process.env.CLOUDINARY_URL.trim().replace(/\r/g, "");
}
if (process.env.CLOUDINARY_CLOUD_NAME) {
  process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME.trim().replace(/\r/g, "");
}
if (process.env.CLOUDINARY_API_KEY) {
  process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY.trim().replace(/\r/g, "");
}
if (process.env.CLOUDINARY_API_SECRET) {
  process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET.trim().replace(/\r/g, "");
}

export const normalizeEmailPassword = (password) => {
  if (!password) return "";
  return String(password)
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, "");
};

export { projectRoot };
