# Email Setup Guide for Registration

## Overview

This guide will help you configure email sending for user registration confirmations.

## Step 1: Configure Email Settings

Add the following environment variables to your `.env` file in the `server` directory:

### For Gmail (Recommended for Development)

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Important:** For Gmail, you need to use an App Password, not your regular password.

#### How to Get Gmail App Password:

1. Go to your Google Account: https://myaccount.google.com
2. Enable 2-Factor Authentication (if not already enabled)
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Select "Mail" and "Other (Custom name)"
5. Enter "Kick It App" as the name
6. Click "Generate"
7. Copy the 16-character password (no spaces)
8. Use this password in `EMAIL_PASSWORD`

### For Other Email Providers

#### Outlook/Office 365

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### SendGrid

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
```

## Step 2: Verify Configuration

1. Make sure your `.env` file is in the `server` directory
2. Restart your server after adding the email configuration
3. The email service will automatically check for these variables

## Step 3: Test Email Sending

1. Register a new user account
2. Check the server console for email sending logs
3. Check the user's email inbox (and spam folder)

## What Emails Are Sent?

### Individual Registration

- **When:** User creates an individual account
- **Subject:** "Welcome to , [Name]!"
- **Content:** Welcome message with account details

### Team Registration

- **When:** Team leader creates a team
- **Subject:** "Team Registration Confirmed: [Team Name]"
- **Content:** Team registration confirmation with team details

## Troubleshooting

### Email Not Sending

1. **Check Environment Variables**
   - Verify all email variables are set in `.env`
   - Make sure there are no typos
   - Restart the server after changing `.env`

2. **Check Server Logs**
   - Look for "Email service not configured" warnings
   - Check for error messages in the console

3. **Gmail Issues**
   - Make sure you're using an App Password, not your regular password
   - Verify 2-Factor Authentication is enabled
   - Check that "Less secure app access" is not required (App Passwords replace this)

4. **Firewall/Network Issues**
   - Some networks block SMTP ports
   - Try using port 465 with `EMAIL_SECURE=true` for SSL

### Email Goes to Spam

- Use a professional email address
- Consider using a service like SendGrid or Mailgun for production
- Add SPF and DKIM records to your domain

## Production Recommendations

For production, consider using:

- **SendGrid** - Reliable email delivery service
- **Mailgun** - Developer-friendly email API
- **AWS SES** - Cost-effective for high volume
- **Postmark** - Great deliverability

These services provide better deliverability and analytics than direct SMTP.

## File Locations

- Email Service: `server/services/email.service.js`
- Registration Route: `server/routes/auth.routes.js`
- Email Templates: Defined in `email.service.js`

## Next Steps

After setting up email:

1. Test registration to verify emails are sent
2. Customize email templates in `server/services/email.service.js`
3. Add more email types (password reset, etc.) as needed
