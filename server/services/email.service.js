import nodemailer from "nodemailer";
import { normalizeEmailPassword } from "../config/env.js";

// eslint-disable-next-line no-undef
const env = process.env;

const getEmailAuth = () => ({
  user: String(env.EMAIL_USER || "").trim(),
  pass: normalizeEmailPassword(env.EMAIL_PASSWORD),
});

// Create reusable transporter
const createTransporter = () => {
  const auth = getEmailAuth();
  const host = env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(env.EMAIL_PORT) || 587;
  const isGmail = host.includes("gmail.com");

  if (isGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: env.EMAIL_SECURE === "true" || port === 465,
    auth,
    requireTLS: port === 587,
  });
};

// Email templates
const emailTemplates = {
  tournamentRegistration: (data) => ({
    subject: `Registration Confirmed: ${data.tournamentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 20px;">Registration Confirmed!</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hi ${data.firstName || data.userName},</p>
        ${
          data.registrationType === "team"
            ? `<p style="font-size: 16px; line-height: 1.6;">Thanks for registering your team${data.teamName ? ` <strong>${data.teamName}</strong>` : ""} for <strong>${data.tournamentName}</strong> on Les Kick't.</p>`
            : `<p style="font-size: 16px; line-height: 1.6;">Thanks for registering for <strong>${data.tournamentName}</strong> on Les Kick't.</p>`
        }
        ${
          data.memberCode
            ? `<p style="font-size: 16px; line-height: 1.6;">Your member number is; <strong>${data.memberCode}</strong></p>`
            : ""
        }
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0;"><strong>Event Details:</strong></p>
          <p style="margin: 8px 0;">Start Date: ${new Date(data.startDate).toLocaleDateString()}</p>
          <p style="margin: 8px 0;">Location: ${data.location || "TBD"}</p>
          ${data.entryFee > 0 ? `<p style="margin: 8px 0; font-weight: bold; color: #d97706;">Entry Fee: $${data.entryFee}</p>` : ""}
        </div>
        ${
          data.paymentStatus === "paid" && data.entryFee > 0
            ? `
        <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0; color: #065f46;"><strong>✓ Payment Completed</strong></p>
          <p style="margin: 8px 0; color: #047857;">Your entry fee payment of <strong>$${data.entryFee}</strong> has been successfully processed. Your ${
            data.registrationType === "team" ? "team's" : ""
          } registration is now fully confirmed!</p>
        </div>
        `
            : data.requiresPayment && data.paymentUrl
              ? `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0; color: #92400e;"><strong>Payment Required</strong></p>
          <p style="margin: 8px 0; color: #78350f;">To confirm your ${
            data.registrationType === "team" ? "team's" : ""
          } seat in this tournament, please complete the entry fee payment of <strong>$${data.entryFee}</strong>.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.paymentUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Pay Entry Fee</a>
          </div>
          <p style="margin: 8px 0; font-size: 14px; color: #78350f;">Click the button above to securely complete your payment via Stripe.</p>
        </div>
        `
              : data.entryFee === 0
                ? `<p style="font-size: 16px; line-height: 1.6; color: #059669; font-weight: bold;">✓ Your registration is complete - no payment required!</p>`
                : ""
        }
        <p style="font-size: 16px; line-height: 1.6;">We look forward to seeing you at the tournament!</p>
        <p style="margin-top: 30px;">Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  tournamentReminder: (data) => ({
    subject: `Reminder: ${data.tournamentName} starts soon!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Tournament Reminder</h2>
        <p>Hello ${data.userName},</p>
        <p>This is a reminder that <strong>${
          data.tournamentName
        }</strong> starts in ${data.timeUntil}!</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Event Details:</strong></p>
          <p>Start Date: ${new Date(data.startDate).toLocaleDateString()}</p>
          <p>Location: ${data.location || "TBD"}</p>
        </div>
        <p>Don't forget to arrive early for check-in!</p>
        <p>Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  matchScheduled: (data) => ({
    subject: `Match Scheduled: ${data.matchTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Match Scheduled</h2>
        <p>Hello ${data.userName},</p>
        <p>Your match has been scheduled:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${data.matchTitle}</strong></p>
          <p>Date: ${new Date(data.scheduledDate).toLocaleDateString()}</p>
          <p>Time: ${data.scheduledTime || "TBD"}</p>
          <p>Location: ${data.location || "TBD"}</p>
        </div>
        <p>Good luck!</p>
        <p>Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  matchReminder: (data) => ({
    subject: `Reminder: Your match is ${data.timeUntil}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Match Reminder</h2>
        <p>Hello ${data.userName},</p>
        <p>Your match is ${data.timeUntil}!</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${data.matchTitle}</strong></p>
          <p>Date: ${new Date(data.scheduledDate).toLocaleDateString()}</p>
          <p>Time: ${data.scheduledTime || "TBD"}</p>
          <p>Location: ${data.location || "TBD"}</p>
        </div>
        <p>See you there!</p>
        <p>Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  matchResult: (data) => ({
    subject: `Match Result: ${data.matchTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Match Result</h2>
        <p>Hello ${data.userName},</p>
        <p>The result for your match has been updated:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>${data.matchTitle}</strong></p>
          <p>Score: ${data.team1Score} - ${data.team2Score}</p>
          ${data.winner ? `<p>Winner: ${data.winner}</p>` : ""}
        </div>
        <p>Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  paymentConfirmation: (data) => ({
    subject: `Payment Confirmation - ${data.itemName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Payment Confirmed</h2>
        <p>Hello ${data.userName},</p>
        <p>Your payment has been confirmed:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Item:</strong> ${data.itemName}</p>
          <p><strong>Amount:</strong> $${data.amount}</p>
          <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
        </div>
        <p>Thank you for your payment!</p>
        <p>Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  orderConfirmation: (data) => ({
    subject: `Order Confirmation - Order #${data.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 20px;">Order Confirmed!</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hi ${data.firstName || data.userName},</p>
        <p style="font-size: 16px; line-height: 1.6;">Thank you for your purchase on Les Kick't!</p>
        ${
          data.memberCode
            ? `<p style="font-size: 16px; line-height: 1.6;">Your member number is; <strong>${data.memberCode}</strong></p>`
            : ""
        }
        
        <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0; color: #065f46;"><strong>✓ Payment Completed</strong></p>
          <p style="margin: 8px 0; color: #047857;">Your payment of <strong>$${data.total.toFixed(2)}</strong> has been successfully processed.</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0;"><strong>Order Details:</strong></p>
          <p style="margin: 8px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p style="margin: 8px 0;"><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString()}</p>
          <p style="margin: 8px 0;"><strong>Items:</strong> ${data.itemCount} ${data.itemCount === 1 ? "item" : "items"}</p>
          <p style="margin: 8px 0;"><strong>Subtotal:</strong> $${data.subtotal.toFixed(2)}</p>
          ${data.discount > 0 ? `<p style="margin: 8px 0;"><strong>Discount:</strong> -$${data.discount.toFixed(2)}</p>` : ""}
          ${data.shipping > 0 ? `<p style="margin: 8px 0;"><strong>Shipping:</strong> $${data.shipping.toFixed(2)}</p>` : ""}
          <p style="margin: 8px 0;"><strong>Tax:</strong> $${data.tax.toFixed(2)}</p>
          <p style="margin: 8px 0; font-weight: bold; font-size: 18px; color: #d97706;"><strong>Total:</strong> $${data.total.toFixed(2)}</p>
        </div>

        ${
          data.items && data.items.length > 0
            ? `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0;"><strong>Order Items:</strong></p>
          ${data.items
            .map(
              (item) => `
            <div style="margin: 12px 0; padding-bottom: 12px; border-bottom: 1px solid #e5e5e5;">
              <p style="margin: 4px 0; font-weight: bold;">${item.name} × ${item.quantity}</p>
              <p style="margin: 4px 0; color: #666;">$${item.price.toFixed(2)} each</p>
            </div>
          `,
            )
            .join("")}
        </div>
        `
            : ""
        }

        ${
          data.shippingAddress
            ? `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0;"><strong>Delivery Address:</strong></p>
          <p style="margin: 4px 0;">${data.shippingAddress}</p>
        </div>
        `
            : ""
        }

        <p style="font-size: 16px; line-height: 1.6;">We'll send you a shipping confirmation email once your order has been processed.</p>
        <p style="margin-top: 30px;">Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  orderConfirmationZelle: (data) => ({
    subject: `Order Received - Order #${data.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 20px;">Order Received!</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hi ${data.firstName || data.userName},</p>
        <p style="font-size: 16px; line-height: 1.6;">Thank you for your purchase on Les Kick't!</p>
        ${
          data.memberCode
            ? `<p style="font-size: 16px; line-height: 1.6;">Your member number is; <strong>${data.memberCode}</strong></p>`
            : ""
        }

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0; color: #92400e;"><strong>Payment Pending Verification</strong></p>
          <p style="margin: 8px 0; color: #78350f;">We received your order. Your payment will be verified shortly.</p>
          <p style="margin: 8px 0; color: #78350f;">Order total: <strong>$${data.total.toFixed(2)}</strong></p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0;"><strong>Order Details:</strong></p>
          <p style="margin: 8px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p style="margin: 8px 0;"><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString()}</p>
          <p style="margin: 8px 0;"><strong>Items:</strong> ${data.itemCount} ${data.itemCount === 1 ? "item" : "items"}</p>
          <p style="margin: 8px 0; font-weight: bold; font-size: 18px; color: #d97706;"><strong>Total:</strong> $${data.total.toFixed(2)}</p>
        </div>

        ${
          data.items && data.items.length > 0
            ? `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0;"><strong>Order Items:</strong></p>
          ${data.items
            .map(
              (item) => `
            <div style="margin: 12px 0; padding-bottom: 12px; border-bottom: 1px solid #e5e5e5;">
              <p style="margin: 4px 0; font-weight: bold;">${item.name} × ${item.quantity}</p>
              <p style="margin: 4px 0; color: #666;">$${item.price.toFixed(2)} each</p>
            </div>
          `,
            )
            .join("")}
        </div>
        `
            : ""
        }

        ${
          data.shippingAddress
            ? `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0;"><strong>Delivery Address:</strong></p>
          <p style="margin: 4px 0;">${data.shippingAddress}</p>
        </div>
        `
            : ""
        }

        <p style="margin-top: 30px;">Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  registrationPaymentSuccess: (data) => ({
    subject: `Registration & Payment Successful - Welcome to Les Kick't!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p style="font-size: 16px; line-height: 1.6;">Hi ${data.firstName || data.userName},</p>
        <p style="font-size: 16px; line-height: 1.6;">Thanks for registering on Les Kick't.</p>
        ${
          data.memberCode
            ? `<p style="font-size: 16px; line-height: 1.6;">Your member number is; <strong>${data.memberCode}</strong></p>`
            : ""
        }
        <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0; color: #065f46;"><strong>✓ Payment Completed</strong></p>
          <p style="margin: 8px 0; color: #047857;">Your registration payment of <strong>$${data.amount}</strong> has been successfully processed.</p>
          <p style="margin: 8px 0; color: #047857;">Transaction ID: ${data.transactionId || data.sessionId}</p>
        </div>
        ${data.teamName ? `<p style="font-size: 16px; line-height: 1.6;">Team: <strong>${data.teamName}</strong></p>` : ""}
        <p style="margin-top: 30px;">Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  registrationPaymentFailure: (data) => ({
    subject: `Registration Payment Failed - Action Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Payment Failed</h2>
        <p>Hello ${data.userName || "there"},</p>
        <p>We're sorry, but your payment for registration could not be processed.</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Important:</strong> Your registration has <strong>not been completed</strong> because the payment was unsuccessful.</p>
          <p>Registration Fee: $${data.amount}</p>
          ${data.reason ? `<p>Reason: ${data.reason}</p>` : ""}
        </div>
        <p><strong>What you need to do:</strong></p>
        <ol style="line-height: 1.8;">
          <li>Check your payment method and ensure it has sufficient funds</li>
          <li>Try registering again with a different payment method if needed</li>
          <li>If you continue to experience issues, please contact our support team</li>
        </ol>
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  userRegistration: (data) => ({
    subject: `Welcome to Les Kick't`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p style="font-size: 16px; line-height: 1.6;">Hi ${data.firstName || data.userName},</p>
        <p style="font-size: 16px; line-height: 1.6;">Thanks for registering on Les Kick't.</p>
        ${
          data.memberCode
            ? `<p style="font-size: 16px; line-height: 1.6;">Your member number is; <strong>${data.memberCode}</strong></p>`
            : ""
        }
        ${data.teamName ? `<p style="font-size: 16px; line-height: 1.6;">Team: <strong>${data.teamName}</strong></p>` : ""}
        <p style="margin-top: 30px;">Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  teamRegistration: (data) => ({
    subject: `Team Registration Confirmed: ${data.teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Team Registration Confirmed!</h2>
        <p>Hello ${data.userName},</p>
        <p>Your team <strong>${
          data.teamName
        }</strong> has been successfully registered!</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Team Details:</strong></p>
          <p>Team Name: ${data.teamName}</p>
          <p>Team Leader: ${data.userName}</p>
          <p>Team Members: ${data.memberCount || 0}</p>
        </div>
        <p>As the team leader, you can now:</p>
        <ul style="line-height: 1.8;">
          <li>Manage your team roster</li>
          <li>Register your team for tournaments</li>
          <li>View team statistics and performance</li>
          <li>Communicate with team members</li>
        </ul>
        <p>Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  registrationOtp: (data) => ({
    subject: "Your Les Kick't verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 16px;">Verify your email</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hi there,</p>
        <p style="font-size: 16px; line-height: 1.6;">Use this code to continue creating your Les Kick't account:</p>
        <div style="background-color: #111111; color: #ffffff; padding: 24px; border-radius: 12px; margin: 28px 0; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: #fe5723;">Verification code</p>
          <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 0.35em; color: #ffffff;">${data.otp}</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #555;">This code expires in ${data.expiresInMinutes || 10} minutes. If you didn't request this, you can ignore this email.</p>
        <p style="margin-top: 30px;">Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  passwordReset: (data) => ({
    subject: "Reset your Les Kick't password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Password Reset Request</h2>
        <p>Hello ${data.userName || "there"},</p>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="text-align: center; margin: 20px 0;">
            <a href="${data.resetPasswordUrl}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 12px; color: #555;">${data.resetPasswordUrl}</p>
          <p><strong>Note:</strong> This link will expire in ${data.expiresInHours || 1} hour${(data.expiresInHours || 1) === 1 ? "" : "s"}.</p>
        </div>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  // Invitation for team members to set their password and activate account
  teamMemberInvitation: (data) => ({
    subject: `You're invited to join team ${data.teamName} on Les Kick't`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">You've Been Added to a Team!</h2>
        <p>Hello ${data.userName || "Player"},</p>
        <p>You have been added to the team <strong>${data.teamName}</strong> on Les Kick't.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>To activate your account and join the team, please set your password:</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${data.setPasswordUrl}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: bold;">
              Set Your Password
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 12px; color: #555;">${data.setPasswordUrl}</p>
          <p><strong>Note:</strong> This link will expire in ${data.expiresInHours || 24} hours.</p>
        </div>
        <p>Once your password is set, your account will be active and you'll officially be part of the team.</p>
        <p>Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  contactForm: (data) => ({
    subject: `New Contact Form: ${data.subject}`,
    html:
      data.html ||
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Contact Form Submission</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 5px;">${data.message}</p>
        </div>
      </div>
    `,
  }),

  contactFormReply: (data) => ({
    subject: `Thank you for contacting us - ${data.subject}`,
    html:
      data.html ||
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Thank You for Contacting Us!</h2>
        <p>Dear ${data.name},</p>
        <p>Thank you for reaching out to us. We have received your message and will get back to you within 24 hours.</p>
        <p>Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),

  teamAssignment: (data) => ({
    subject: `Team Assignment - ${data.teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 20px;">Team Assignment</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hello ${data.userName},</p>
        <p style="font-size: 16px; line-height: 1.6;">You have been assigned to a new team!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0;"><strong>Team Details:</strong></p>
          <p style="margin: 8px 0;"><strong>Team Name:</strong> ${data.teamName}</p>
          <p style="margin: 8px 0;"><strong>Team Leader:</strong> ${data.leaderName}</p>
          ${data.isLeader ? `<p style="margin: 8px 0; color: #059669; font-weight: bold;">✓ You are the team leader</p>` : ""}
        </div>

        ${
          data.isLeader
            ? `
        <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0; color: #1e40af;"><strong>Team Leader Responsibilities</strong></p>
          <p style="margin: 8px 0; color: #1e3a8a;">As the team leader, you can:</p>
          <ul style="margin: 8px 0; padding-left: 20px; color: #1e3a8a;">
            <li>Manage team roster</li>
            <li>Register your team for tournaments</li>
            <li>View team statistics and performance</li>
            <li>Communicate with team members</li>
          </ul>
        </div>
        `
            : ""
        }

        <p style="font-size: 16px; line-height: 1.6;">You can now access your team dashboard to view team details, register for tournaments, and communicate with your teammates.</p>
        <p style="margin-top: 30px;">Best regards,<br>Les Kick't Team</p>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async (to, templateName, data) => {
  try {
    // Check if email is configured
    console.log("📧 Email service check:", {
      hasEmailUser: !!env.EMAIL_USER,
      hasEmailPassword: !!env.EMAIL_PASSWORD,
      emailUser: env.EMAIL_USER || "(not set)",
      passwordLength: normalizeEmailPassword(env.EMAIL_PASSWORD).length,
      emailHost: env.EMAIL_HOST || "smtp.gmail.com",
      emailPort: env.EMAIL_PORT || 587,
    });

    if (!env.EMAIL_USER || !env.EMAIL_PASSWORD) {
      console.warn(
        "❌ Email service not configured. Missing EMAIL_USER or EMAIL_PASSWORD in .env file.",
      );
      console.warn(
        "   Please add email configuration to your server/.env file:",
      );
      console.warn("   EMAIL_HOST=smtp.gmail.com");
      console.warn("   EMAIL_PORT=587");
      console.warn("   EMAIL_SECURE=false");
      console.warn("   EMAIL_USER=your-email@gmail.com");
      console.warn("   EMAIL_PASSWORD=your-app-password");
      return { success: false, message: "Email service not configured" };
    }

    const transporter = createTransporter();
    const template = emailTemplates[templateName];

    if (!template) {
      console.error(
        `❌ Email template "${templateName}" not found. Available templates:`,
        Object.keys(emailTemplates),
      );
      throw new Error(`Email template ${templateName} not found`);
    }

    const emailContent = template(data);

    const mailOptions = {
      from: `"Les Kick't" <${env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    console.log(`📤 Sending email to ${to} using template: ${templateName}`);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully! Message ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("   Full error:", error);
    if (error.code === "EAUTH") {
      console.error(
        "   Authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD.",
      );
      console.error(
        "   Gmail app passwords must be 16 chars, no spaces, from the SAME account as EMAIL_USER.",
      );
      console.error(
        "   Generate a new one: https://myaccount.google.com/apppasswords (requires 2-Step Verification)",
      );
      console.error("   Then run: npm run test-email");
    } else if (error.code === "ECONNECTION") {
      console.error("   Connection failed. Check EMAIL_HOST and EMAIL_PORT.");
    }
    return { success: false, error: error.message };
  }
};

// Send bulk emails
export const sendBulkEmails = async (recipients, templateName, data) => {
  const results = [];
  for (const recipient of recipients) {
    const result = await sendEmail(recipient.email, templateName, {
      ...data,
      userName: recipient.name || recipient.email,
    });
    results.push({ recipient, result });
  }
  return results;
};
