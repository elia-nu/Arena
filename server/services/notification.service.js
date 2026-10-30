import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "./email.service.js";
import { sendSMSWithTemplate } from "./sms.service.js";

// Create and send notification
export const createNotification = async (
  userId,
  type,
  title,
  message,
  relatedEntity = null,
  options = {}
) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      relatedEntity,
      priority: options.priority || "medium",
    });

    await notification.save();

    // Send email if requested
    if (options.sendEmail) {
      const user = await User.findById(userId);
      if (user && user.email) {
        const emailResult = await sendEmail(
          user.email,
          getEmailTemplateName(type),
          {
            userName: user.firstName || user.username,
            firstName: user.firstName,
            memberCode: user.memberCode,
            ...options.emailData,
          }
        );

        if (emailResult.success) {
          notification.emailSent = true;
          await notification.save();
        }
      }
    }

    // Send SMS if requested
    if (options.sendSMS) {
      const user = await User.findById(userId).select("+phone");
      if (user && user.phone) {
        const smsResult = await sendSMSWithTemplate(
          user.phone,
          getSMSTemplateName(type),
          {
            userName: user.firstName || user.username,
            ...options.smsData,
          }
        );

        if (smsResult.success) {
          notification.smsSent = true;
          await notification.save();
        }
      }
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Create bulk notifications
export const createBulkNotifications = async (
  userIds,
  type,
  title,
  message,
  relatedEntity = null,
  options = {}
) => {
  const notifications = [];
  for (const userId of userIds) {
    try {
      const notification = await createNotification(
        userId,
        type,
        title,
        message,
        relatedEntity,
        options
      );
      notifications.push(notification);
    } catch (error) {
      console.error(`Error creating notification for user ${userId}:`, error);
    }
  }
  return notifications;
};

// Helper to get email template name from notification type
const getEmailTemplateName = (type) => {
  const mapping = {
    tournament_registration: "tournamentRegistration",
    tournament_reminder: "tournamentReminder",
    match_scheduled: "matchScheduled",
    match_reminder: "matchReminder",
    match_result: "matchResult",
    payment_confirmation: "paymentConfirmation",
    team_message: null,
    team_announcement: null,
  };
  return mapping[type] || "system_announcement";
};

// Helper to get SMS template name from notification type
const getSMSTemplateName = (type) => {
  const mapping = {
    tournament_registration: "tournamentRegistration",
    tournament_reminder: "tournamentReminder",
    match_scheduled: "matchScheduled",
    match_reminder: "matchReminder",
    match_result: "matchResult",
    payment_confirmation: "paymentConfirmation",
  };
  return mapping[type] || null;
};

// Mark notification as read
export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return result;
};

// Get unread count for a user
export const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({
    user: userId,
    isRead: false,
  });
};
