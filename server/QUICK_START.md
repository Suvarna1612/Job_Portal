# Email Confirmation - Quick Start Guide

## ⚡ 3-Step Setup

### Step 1: Get Gmail App Password (2 minutes)

1. Visit: https://myaccount.google.com/apppasswords
2. Select "Mail" → Generate
3. Copy the 16-character password

### Step 2: Update .env (1 minute)

```env
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"
EMAIL_FROM_NAME="Job Portal"
```

### Step 3: Test & Run (1 minute)

```bash
# Test email configuration
node testEmail.js

# Restart server
npm run server
```

## ✅ Done!

Candidates will now receive confirmation emails when they apply for jobs.

---

## 📧 What Happens Now?

```
User applies → Application saved → Email sent → User receives confirmation
```

---

## 🧪 Quick Test

1. Apply for a job through your app
2. Check the candidate's email inbox
3. Look for "Application Confirmation" email

---

## 🆘 Troubleshooting

**Email not sending?**
```bash
node testEmail.js
```

**Still not working?**
- Check .env has correct credentials
- For Gmail: Use App Password (not regular password)
- Enable 2-Step Verification on Gmail
- Check server console for errors

---

## 📚 Full Documentation

- **EMAIL_SETUP_GUIDE.md** - Complete setup instructions
- **EMAIL_IMPLEMENTATION_SUMMARY.md** - Technical details
- **.env.example** - Configuration template

---

## 🎯 Key Features

✅ Professional HTML email template  
✅ Sent from system email (not recruiter email)  
✅ Non-blocking (app succeeds even if email fails)  
✅ Secure credential storage  
✅ Proper error handling  

---

**Need help?** Check EMAIL_SETUP_GUIDE.md for detailed instructions.
