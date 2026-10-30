import "../config/env.js";
import nodemailer from "nodemailer";
import { normalizeEmailPassword } from "../config/env.js";

const user = String(process.env.EMAIL_USER || "").trim();
const pass = normalizeEmailPassword(process.env.EMAIL_PASSWORD);

console.log("Email config check:");
console.log("  EMAIL_USER:", user || "(missing)");
console.log("  Password length:", pass.length, pass.length === 16 ? "(ok)" : "(expected 16 for Gmail app password)");
console.log("  EMAIL_HOST:", process.env.EMAIL_HOST || "smtp.gmail.com");

if (!user || !pass) {
  console.error("\nMissing EMAIL_USER or EMAIL_PASSWORD in .env");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
});

console.log("\nVerifying Gmail SMTP connection...");

try {
  await transporter.verify();
  console.log("SUCCESS: Gmail credentials are valid.\n");
  process.exit(0);
} catch (error) {
  console.error("\nFAILED:", error.message);
  if (error.code === "EAUTH") {
    console.error(`
Gmail rejected the app password. Generate a new one:

1. Sign in to the SAME account as EMAIL_USER (${user})
2. Enable 2-Step Verification: https://myaccount.google.com/signinoptions/two-step-verification
3. Create App Password: https://myaccount.google.com/apppasswords
   - App: Mail
   - Device: Other (Les Kick It)
4. Copy the 16-character password into .env as EMAIL_PASSWORD (no quotes, no spaces)
5. Restart the server and run this script again
`);
  }
  process.exit(1);
}
