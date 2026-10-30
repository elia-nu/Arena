# Notification System Setup Guide

## Overview

The notification system provides automated email/SMS confirmations, countdown timers, and real-time notifications for tournaments and matches.

## Features

- ✅ **Email Notifications** - Automated email confirmations for registrations, reminders, and results
- ✅ **SMS Notifications** - SMS alerts (Twilio integration ready)
- ✅ **Real-time Notifications** - In-app notification bell with live updates
- ✅ **Countdown Timers** - Visual countdown for tournaments and matches
- ✅ **Notification History** - View and manage all notifications

## Backend Setup

### 1. Email Configuration (Required for Email Notifications)

Add to your `.env` file:

```env
# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**For Gmail:**

1. Enable 2-Factor Authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password) in `EMAIL_PASSWORD`

**For Other SMTP Providers:**

- Update `EMAIL_HOST`, `EMAIL_PORT`, and `EMAIL_SECURE` accordingly
- Common providers:
  - Outlook: `smtp-mail.outlook.com`, port `587`
  - SendGrid: `smtp.sendgrid.net`, port `587`
  - Mailgun: `smtp.mailgun.org`, port `587`

### 2. SMS Configuration (Optional - Twilio)

Add to your `.env` file:

```env
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**To enable SMS:**

1. Sign up for Twilio: https://www.twilio.com
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Uncomment the Twilio code in `server/services/sms.service.js`
5. Install Twilio: `npm install twilio`

## Frontend Features

### Notification Bell

The notification bell appears in the navbar when users are logged in:

- Shows unread notification count
- Click to view notifications
- Mark as read / delete notifications
- Auto-refreshes every 30 seconds

### Countdown Timer

Use the `CountdownTimer` component anywhere:

```jsx
import CountdownTimer from "../components/CountdownTimer";

<CountdownTimer
  targetDate={tournament.startDate}
  onComplete={() => console.log("Event started!")}
  label="Tournament starts in"
/>;
```

## Notification Types

The system sends notifications for:

1. **Tournament Registration** - When a user registers for a tournament
2. **Tournament Reminder** - Before tournament starts (can be scheduled)
3. **Match Scheduled** - When a match is created
4. **Match Reminder** - Before match starts (can be scheduled)
5. **Match Result** - When match result is updated
6. **Payment Confirmation** - When payment is processed
7. **System Announcement** - General announcements
8. **Team Invitation** - Team-related notifications

## API Endpoints

### Get Notifications

```
GET /api/notifications
Query params: page, limit, unreadOnly
```

### Get Unread Count

```
GET /api/notifications/unread-count
```

### Mark as Read

```
PUT /api/notifications/:id/read
```

### Mark All as Read

```
PUT /api/notifications/read-all
```

### Delete Notification

```
DELETE /api/notifications/:id
```

## Integration Points

Notifications are automatically sent when:

1. **Tournament Registration** (`server/routes/tournament.routes.js`)

   - User registers for tournament
   - Email confirmation sent

2. **Match Result Update** (`server/routes/match.routes.js`)
   - Admin updates match result
   - All participants notified via email

## Testing

### Test Email Notifications

1. Configure email in `.env`
2. Register for a tournament
3. Check your email inbox

### Test SMS Notifications

1. Configure Twilio in `.env`
2. Uncomment Twilio code in `sms.service.js`
3. Register for a tournament
4. Check your phone

### Test Real-time Notifications

1. Login to the app
2. Look for notification bell in navbar
3. Register for a tournament
4. Notification should appear in bell

## Troubleshooting

### Email Not Sending

1. Check `.env` configuration
2. Verify email credentials
3. Check server logs for errors
4. For Gmail, ensure App Password is used (not regular password)

### SMS Not Sending

1. Verify Twilio credentials
2. Check if Twilio code is uncommented
3. Verify phone number format (+1234567890)
4. Check Twilio account balance

### Notifications Not Appearing

1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check authentication token
4. Verify notification API routes are mounted

## Future Enhancements

- [ ] WebSocket support for instant notifications
- [ ] Push notifications (browser notifications)
- [ ] Scheduled reminder emails (cron jobs)
- [ ] Notification preferences per user
- [ ] Email templates customization
- [ ] SMS templates customization
