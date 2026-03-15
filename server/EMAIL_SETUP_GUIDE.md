# Email Confirmation Setup Guide

## Overview
This guide explains how to configure email confirmation functionality for job applications in the MERN Job Portal.

## Features Implemented

✅ Automatic email confirmation when candidates apply for jobs  
✅ Professional HTML email template  
✅ Non-blocking email sending (application succeeds even if email fails)  
✅ Secure credential storage in .env file  
✅ Reusable email utility following MVC architecture  
✅ Clean async/await implementation with proper error handling  

---

## Configuration Steps

### Step 1: Email Service Setup

#### Option A: Gmail (Recommended for Development)

1. **Enable 2-Step Verification**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the 16-character password generated

3. **Update .env file**
   ```env
   EMAIL_SERVICE="gmail"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"  # 16-character app password
   EMAIL_FROM_NAME="Job Portal"
   ```

#### Option B: Outlook/Hotmail

```env
EMAIL_SERVICE="hotmail"
EMAIL_USER="your-email@outlook.com"
EMAIL_PASSWORD="your-password"
EMAIL_FROM_NAME="Job Portal"
```

#### Option C: Yahoo Mail

```env
EMAIL_SERVICE="yahoo"
EMAIL_USER="your-email@yahoo.com"
EMAIL_PASSWORD="your-password"
EMAIL_FROM_NAME="Job Portal"
```

### Step 2: Install Dependencies

The nodemailer package has already been installed. If you need to reinstall:

```bash
cd server
npm install nodemailer
```

### Step 3: Update Environment Variables

Edit `server/.env` and replace the placeholder values:

```env
# Email Configuration
EMAIL_SERVICE="gmail"                          # Email service provider
EMAIL_USER="jobportal@gmail.com"              # Your system email
EMAIL_PASSWORD="abcd efgh ijkl mnop"          # App password (not regular password)
EMAIL_FROM_NAME="Job Portal"                  # Display name in emails
```

### Step 4: Restart Server

```bash
cd server
npm run server
```

---

## File Structure

```
server/
├── utils/
│   └── sendEmail.js              # Email utility with transporter and sending logic
├── controllers/
│   └── userController.js         # applyForJob controller with email integration
├── .env                          # Environment variables (email credentials)
└── EMAIL_SETUP_GUIDE.md         # This file
```

---

## How It Works

### 1. Email Utility (`utils/sendEmail.js`)

```javascript
// Creates transporter with credentials from .env
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Sends confirmation email with professional HTML template
export const sendApplicationConfirmation = async (userEmail, userName, jobTitle, companyName) => {
    // Implementation with try-catch error handling
};
```

### 2. Controller Integration (`controllers/userController.js`)

```javascript
// After successful job application save
await JobApplication.create({ ... })
await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } })

// Send email (non-blocking)
try {
    const populatedJob = await Job.findById(jobId).populate('companyId', 'name')
    const companyName = populatedJob.companyId.name
    
    sendApplicationConfirmation(
        user.email,
        user.name,
        jobData.title,
        companyName
    ).catch(emailError => {
        console.error('Failed to send confirmation email:', emailError)
    })
} catch (emailError) {
    console.error('Error preparing confirmation email:', emailError)
}

res.json({ success: true, message: 'Applied Successfully' })
```

### 3. Email Content

The email includes:
- ✅ Candidate name (personalized greeting)
- ✅ Job title
- ✅ Company name
- ✅ Confirmation message
- ✅ Next steps information
- ✅ Professional HTML formatting

---

## Testing

### Test the Email Functionality

1. **Configure credentials** in `.env`
2. **Restart the server**
3. **Apply for a job** through the application
4. **Check the candidate's email inbox**

### Expected Behavior

- ✅ Application saves successfully to database
- ✅ Email is sent asynchronously
- ✅ API returns success immediately (doesn't wait for email)
- ✅ If email fails, application still succeeds
- ✅ Error logs appear in console if email fails

---

## Troubleshooting

### Issue: Email not sending

**Solutions:**
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- For Gmail: Ensure you're using App Password, not regular password
- Check if 2-Step Verification is enabled (required for Gmail)
- Check server console for error messages
- Test credentials by sending a test email

### Issue: Email goes to spam

**Solutions:**
- Ask recipients to mark as "Not Spam"
- Use a professional email address
- For production, use dedicated email services (see below)

### Issue: "Invalid login" error

**Solutions:**
- Gmail: Use App Password instead of account password
- Enable "Less secure app access" (not recommended)
- Verify email service name matches provider

### Issue: Email sending but not receiving

**Solutions:**
- Check spam/junk folder
- Verify recipient email is correct
- Check email service quotas/limits
- Review server logs for delivery status

---

## Production Recommendations

For production environments, use professional email services instead of Gmail:

### SendGrid (Recommended)

```javascript
// Install: npm install @sendgrid/mail
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
    to: userEmail,
    from: process.env.EMAIL_USER,
    subject: `Application Confirmation - ${jobTitle}`,
    html: emailTemplate
};

await sgMail.send(msg);
```

### AWS SES (Cost-effective)

```javascript
// Install: npm install @aws-sdk/client-ses
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const client = new SESClient({ region: "us-east-1" });
const command = new SendEmailCommand({ ... });
await client.send(command);
```

### Other Options

- **Mailgun**: Developer-friendly API
- **Postmark**: Transactional email specialist
- **Brevo (Sendinblue)**: Free tier available

---

## Security Best Practices

1. ✅ **Never commit .env file** to version control
2. ✅ **Use App Passwords** instead of account passwords
3. ✅ **Rotate credentials** regularly
4. ✅ **Use environment variables** for all sensitive data
5. ✅ **Enable 2FA** on email accounts
6. ✅ **Monitor email logs** for suspicious activity

---

## Sample .env Configuration

```env
# Email Configuration
EMAIL_SERVICE="gmail"
EMAIL_USER="jobportal.noreply@gmail.com"
EMAIL_PASSWORD="abcd efgh ijkl mnop"
EMAIL_FROM_NAME="Job Portal - Career Services"
```

---

## Email Template Preview

```
┌─────────────────────────────────────────┐
│ Application Received!                   │
├─────────────────────────────────────────┤
│                                         │
│ Dear John Doe,                          │
│                                         │
│ Thank you for applying to the position │
│ of Senior Developer at Tech Corp.      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Your application has been         │ │
│ │   successfully submitted and is     │ │
│ │   now under review.                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Our team will carefully review your    │
│ application and get back to you soon.  │
│                                         │
│ Best regards,                           │
│ Tech Corp                               │
└─────────────────────────────────────────┘
```

---

## Support

If you encounter issues:
1. Check server console logs
2. Verify .env configuration
3. Test email credentials manually
4. Review nodemailer documentation: https://nodemailer.com/

---

## Summary

✅ Email confirmation is now fully integrated  
✅ Candidates receive professional confirmation emails  
✅ System uses single organization email (not recruiter emails)  
✅ Non-blocking implementation ensures application success  
✅ Secure credential management via .env  
✅ Production-ready with proper error handling  

**Next Step:** Update your `.env` file with valid email credentials and test the functionality!
