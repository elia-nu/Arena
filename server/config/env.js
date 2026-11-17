import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config({ path: path.join(projectRoot, "server", ".env") });
dotenv.config();

// Clean carriage returns or extra whitespace from crucial env keys
for (const key of [
  "CLOUDINARY_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
]) {
  if (process.env[key] !== undefined) {
    process.env[key] = process.env[key]
      .trim()
      .replace(/\r/g, "")
      .replace(/^["']+|["']+$/g, "");
    if (!process.env[key]) {
      delete process.env[key];
    }
  }
}

export const normalizeEmailPassword = (password) => {
  if (!password) return "";
  return String(password)
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, "");
};

export { projectRoot };
