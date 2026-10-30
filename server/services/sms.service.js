import twilio from "twilio";
import dotenv from "dotenv";
import { normalizePhoneNumber } from "../utils/phoneUtils.js";

dotenv.config();

const defaultPhoneRegion = process.env.DEFAULT_PHONE_REGION || "US";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * @param {string} to - E.164
 * @param {string} body
 * @returns {Promise<{ sid?: string, skipped?: boolean }>}
 */
export async function sendSms(to, body) {
  if (!client || !fromNumber) {
    console.warn(
      "[sms] Twilio not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER). SMS not sent.",
    );
    return { skipped: true };
  }

  const message = await client.messages.create({
    body,
    from: fromNumber,
    to,
  });

  return { sid: message.sid };
}

export function isSmsConfigured() {
  return Boolean(client && fromNumber);
}

const smsTemplateBodies = {
  tournamentRegistration: (d) =>
    `Hi ${d.userName || "there"}! You're registered for ${d.tournamentName || "a tournament"}.`,
  tournamentReminder: (d) =>
    `Reminder: ${d.tournamentName || "Tournament"} — check the app for details.`,
  matchScheduled: (d) =>
    `Match scheduled${d.matchDetails ? `: ${d.matchDetails}` : ""}. Open Les Kick't for info.`,
  matchReminder: (d) =>
    `Match reminder${d.matchDetails ? `: ${d.matchDetails}` : ""}. See the app.`,
  matchResult: (d) =>
    `Match result${d.result ? `: ${d.result}` : d.matchDetails ? `: ${d.matchDetails}` : ""}.`,
  paymentConfirmation: (d) =>
    `Payment confirmed. Thanks${d.userName ? `, ${d.userName}` : ""}!`,
};

/**
 * Send SMS using the same template keys as getSMSTemplateName() in notification.service.js
 * @returns {Promise<{ success: boolean, skipped?: boolean, sid?: string }>}
 */
export async function sendSMSWithTemplate(to, templateName, data = {}) {
  if (!to) {
    return { success: false };
  }

  const raw = String(to).trim();
  const e164 =
    normalizePhoneNumber(raw, defaultPhoneRegion) ||
    (raw.startsWith("+") ? raw : null);
  const phone = e164 || raw;

  const build = templateName ? smsTemplateBodies[templateName] : null;
  const body = build
    ? build(data)
    : typeof data.body === "string"
      ? data.body
      : null;

  if (!body) {
    console.warn(
      "[sms] sendSMSWithTemplate: no body for template:",
      templateName,
    );
    return { success: false };
  }

  try {
    const result = await sendSms(phone, body);
    if (result.skipped) {
      return { success: false, skipped: true };
    }
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error("[sms] sendSMSWithTemplate failed:", err);
    return { success: false };
  }
}
