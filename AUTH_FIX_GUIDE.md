# Authentication Fix Guide - Complete Setup

## 🔍 Issues Found & Fixed

### **Issue 1: Missing Email Configuration**
- **Problem**: Email host, port, and secure flags weren't in `.env`
- **Fix**: Added complete email configuration to `.env`

### **Issue 2: Insufficient Error Logging**
- **Problem**: Generic "Network error" message without details
- **Fix**: Added detailed console logging throughout the signup process

### **Issue 3: Database Connection Errors Not Handled**
- **Problem**: Connection issues weren't being reported properly
- **Fix**: Added specific error handling for database connection failures

### **Issue 4: Email Service Error Handling**
- **Problem**: Email transporter wasn't initialized with error handling
- **Fix**: Added transporter initialization with connection verification

---

## 🚀 Setup Instructions

### **Step 1: Verify Environment Configuration**

Your `.env` file has been updated. Verify it contains:

```env
DATABASE_URL="postgresql://fyp_user:ABCDEFGHIJ@localhost:5432/fyp_database"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production-min-32-chars-12345"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars-12345"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="mubarafatima.2284@dsp.qaed.edu.pk"
EMAIL_PASS="12345678"
```

⚠️ **Important for Gmail**: 
- Regular Gmail passwords won't work for SMTP
- Generate an **App Password**: https://myaccount.google.com/apppasswords
- Use the 16-character app password instead of your regular password

---

### **Step 2: Restart the Development Server**

```powershell
# Kill any running processes
# Then restart with environment variables loaded
npm run dev
```

The `npm run dev` command automatically loads `.env` variables.

---

### **Step 3: Verify Database Connection**

```powershell
# Confirm Prisma schema is synced
npx prisma db push

# Check database schema
npx prisma db execute --stdin < prisma/schema.prisma
```

---

### **Step 4: Test Email Configuration (Development Mode)**

For **development testing without real email**:

```env
# Comment out these lines in .env to use development mode
# EMAIL_USER="mubarafatima.2284@dsp.qaed.edu.pk"
# EMAIL_PASS="12345678"
```

Then verification codes will be logged to the console instead of being sent via email.

---

## 🧪 Testing Checklist

### **Test 1: Basic Signup**
- [ ] Open the app at `http://localhost:3000`
- [ ] Click "Sign Up"
- [ ] Fill in email, password, name
- [ ] Click submit
- **Expected**: See success message (no "Network error")
- **Check**: Server logs show `[Signup] Signup completed successfully`

### **Test 2: Verify Database Insert**
- [ ] Check PostgreSQL database directly:
```sql
SELECT * FROM users WHERE email = 'test@example.com';
```
- **Expected**: User record exists with `isVerified = false`

### **Test 3: Email Sending (Dev Mode)**
- [ ] With email credentials commented out
- [ ] Sign up with a test email
- [ ] Check server console for: `🔐 Verification Code: XXXXXX`
- [ ] Use that code in the verification page

### **Test 4: Email Sending (Production Mode)**
- [ ] With email credentials configured
- [ ] Sign up with a test email
- [ ] Check:
  - [ ] Email inbox for verification email
  - [ ] Server logs show `[Email] Verification email sent successfully`
  - [ ] Server logs show connection verified

---

## 🐛 Debugging Tips

### **If you still see "Network error":**

1. **Check Browser Console** (F12):
   - Open DevTools → Console tab
   - Look for detailed error messages
   - Copy the full error and check server logs

2. **Check Server Logs**:
   ```
   [Signup] New signup attempt for email: ...
   [Signup] Checking if email exists in database...
   [Signup] Email is unique, proceeding with user creation...
   [Signup] Hashing password...
   [Signup] Creating user in database...
   [Signup] Sending verification email...
   [Signup] Signup completed successfully
   ```

3. **Database Connection Issues**:
   ```
   [Signup] User creation failed: Unable to connect to database
   [Signup] Error details: ECONNREFUSED - connection refused on localhost:5432
   ```
   → Check PostgreSQL is running: `psql -U fyp_user -d fyp_database`

4. **Email Configuration Issues**:
   ```
   [Email] Email sending error: Invalid credentials
   ```
   → Verify EMAIL_USER and EMAIL_PASS are correct
   → For Gmail, use App Password instead

---

## 📋 Common Issues & Solutions

### **"Database connection failed"**
```
Issue: PostgreSQL not running or credentials wrong
Solution:
1. Ensure PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Test: psql -U fyp_user -d fyp_database
```

### **"Failed to send verification email"**
```
Issue: Email credentials invalid or SMTP unreachable
Solution:
1. For Gmail: Use App Password (https://myaccount.google.com/apppasswords)
2. Verify EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE are correct
3. Check firewall allows port 587 outbound
4. Try in development mode (comment email credentials)
```

### **"User not created"**
```
Issue: Prisma client not synced or schema mismatch
Solution:
1. Run: npx prisma db push
2. Run: npx prisma generate
3. Restart dev server: npm run dev
```

---

## 🔐 Security Notes

### **Before Production:**
1. Change `NEXTAUTH_SECRET` and `JWT_SECRET` to strong random values
2. Never commit real email credentials to git
3. Use environment variables from your hosting provider
4. For Gmail: Always use App Passwords, not regular passwords
5. Enable 2FA on email account

### **Generate Strong Secrets:**
```powershell
# PowerShell: Generate 32+ character random string
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32|ForEach-Object{[char][byte]::Parse(('{0:X2}' -f (Get-Random -Max 256)),'AllowHexSpecifier')})) -join '')

# Or use: openssl rand -base64 32
```

---

## 📞 Next Steps

If issues persist:
1. Check all server logs in terminal
2. Open browser DevTools (F12) and check Console tab
3. Verify `.env` file has all required fields
4. Ensure PostgreSQL service is running
5. Verify network connectivity to SMTP server

All modified files now include extensive logging - check both **browser console** and **server terminal** for debugging information.
