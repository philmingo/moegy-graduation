# Supabase Authentication Setup Guide

This guide will walk you through setting up Supabase authentication for the Voceo Graduation Announcement App.

## 📋 Overview

The app has been migrated from hardcoded authentication to **Supabase Authentication**, providing:
- ✅ Secure, production-ready authentication
- ✅ Multiple concurrent sessions (same user can login on multiple devices)
- ✅ Automatic session management and refresh tokens
- ✅ Password reset and security features
- ✅ Separate admin and mobile scanner accounts

---

## 🚀 Setup Instructions

### **Step 1: Create Admin User in Supabase**

#### Option A: Using Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **"Add User"** > **"Create new user"**
4. Enter the following details:
   - **Email**: `admin@voceo.app`
   - **Password**: `Admin@2025`
   - **Auto Confirm User**: ✅ **CHECK THIS BOX** (Important!)
5. Click **"Create user"**
6. (Optional) Add user metadata:
   - Click on the created user
   - Go to **"User Metadata"** section
   - Add: `{"role": "admin"}`

#### Option B: Using SQL Script

Alternatively, run the SQL script provided in:
```
scripts/create-admin-user.sql
```

### **Step 2: Create Mobile Scanner User**

Follow the same process as Step 1, but use these credentials:
- **Email**: `mobile_scanner@internal`
- **Password**: `Scanner@2025`
- **Auto Confirm User**: ✅ **CHECK THIS BOX**
- **User Metadata** (optional): `{"role": "scanner"}`

### **Step 3: Verify Users Were Created**

Run this query in Supabase SQL Editor:

```sql
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email IN ('admin@voceo.app', 'mobile_scanner@internal')
ORDER BY email;
```

You should see both users listed.

### **Step 4: Update Environment Variables** (if needed)

Ensure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Step 5: Test the Authentication**

1. **Admin Login**:
   - Navigate to `/login`
   - Email: `admin@voceo.app`
   - Password: `Admin@2025`

2. **Mobile Scanner Login**:
   - Navigate to `/mobile-scan`
   - Password: `Scanner@2025`

---

## 🔐 Security Best Practices

### **Change Default Passwords Immediately**

After first login, change the default passwords:

1. Go to Supabase Dashboard > Authentication > Users
2. Select the user
3. Click **"Reset Password"**
4. Set a strong, unique password

Or programmatically in your app:
```typescript
await supabase.auth.updateUser({ password: 'new_secure_password' })
```

### **Enable Additional Security Features**

Consider enabling these in Supabase:

1. **Email Verification**: Require users to verify their email
   - Dashboard > Authentication > Settings > Enable email confirmations

2. **Multi-Factor Authentication (MFA)**: Add an extra security layer
   - Dashboard > Authentication > Settings > Enable MFA

3. **Rate Limiting**: Protect against brute force attacks
   - Automatically enabled by Supabase

4. **Row Level Security (RLS)**: Ensure proper data access
   - Already configured for `students` and `guest_book` tables

---

## 💡 How It Works

### **Multiple Device Sessions**

✅ **Supported out of the box!** The same user can be logged in on multiple devices simultaneously.

- Each device/browser gets its own JWT session token
- Sessions are stored in browser localStorage
- Tokens automatically refresh every 7 days
- No conflicts between devices

### **Session Management**

| Action | Behavior |
|--------|----------|
| Login | Creates new session on current device |
| Logout | Only signs out from current device |
| Logout All | Can be implemented if needed (see below) |

### **Logout from All Devices** (Optional)

To force logout from all devices, run this SQL:

```sql
DELETE FROM auth.sessions WHERE user_id = 'USER_ID_HERE';
```

---

## 📁 Files Modified

### **New Files Created:**
- ✅ `lib/actions/auth.ts` - Authentication server actions
- ✅ `scripts/create-admin-user.sql` - SQL setup script
- ✅ `SUPABASE_AUTH_SETUP.md` - This documentation

### **Files Updated:**
- ✅ `app/login/page.tsx` - Uses Supabase auth instead of hardcoded
- ✅ `components/auth-guard.tsx` - Checks Supabase session
- ✅ `components/mobile-login.tsx` - Uses Supabase for mobile scanner
- ✅ `components/app-header.tsx` - Logout button uses Supabase signOut

### **Files NOT Modified:**
- ❌ `app/student-qr-portal/page.tsx` - Remains public (no auth required)
- ❌ `lib/supabase.ts` - Already properly configured

---

## 🔧 Authentication API Reference

### **Server Actions** (`lib/actions/auth.ts`)

```typescript
// Sign in with email and password
await signIn(email: string, password: string)
// Returns: { user: AuthUser | null, error: string | null }

// Sign out current session
await signOut()
// Returns: { error: string | null }

// Get current session
await getSession()
// Returns: { user: AuthUser | null, error: string | null }

// Check if authenticated
await isAuthenticated()
// Returns: boolean

// Mobile scanner authentication
await signInMobileScanner(password: string)
// Returns: { success: boolean, error: string | null }
```

---

## 🐛 Troubleshooting

### **Issue: "Invalid email or password"**

✅ **Solution**: Make sure you checked **"Auto Confirm User"** when creating users

### **Issue: "User not found"**

✅ **Solution**: Verify users exist:
```sql
SELECT email FROM auth.users;
```

### **Issue: "Authentication not working"**

✅ **Solution**: Check environment variables:
```bash
# Verify these are set correctly
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### **Issue: "Session expired"**

✅ **Solution**: Sessions expire after 7 days of inactivity. Just log in again.

### **Issue: "Multiple login attempts failing"**

✅ **Solution**: Supabase has rate limiting. Wait 1 minute and try again.

---

## 📊 Session Monitoring

### **View Active Sessions**

```sql
SELECT 
    user_id,
    created_at,
    updated_at,
    NOT_AFTER as expires_at
FROM auth.sessions
ORDER BY updated_at DESC;
```

### **View Login History**

```sql
SELECT 
    email,
    last_sign_in_at,
    sign_in_count,
    created_at
FROM auth.users
ORDER BY last_sign_in_at DESC;
```

---

## 🎯 Default Credentials

| Account | Email | Password | Purpose |
|---------|-------|----------|---------|
| **Admin** | `admin@voceo.app` | `Admin@2025` | Full admin access |
| **Mobile Scanner** | `mobile_scanner@internal` | `Scanner@2025` | Mobile QR scanning |

⚠️ **IMPORTANT**: Change these passwords immediately after first login!

---

## 📞 Support

If you encounter issues:

1. Check Supabase logs: Dashboard > Logs
2. Check browser console for errors
3. Verify environment variables are set
4. Ensure users are confirmed in Supabase

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] Admin user created in Supabase
- [ ] Mobile scanner user created in Supabase
- [ ] Both users can log in successfully
- [ ] Default passwords changed to secure passwords
- [ ] Environment variables configured correctly
- [ ] Row Level Security (RLS) policies enabled
- [ ] Email verification enabled (optional)
- [ ] MFA enabled for admin (optional)
- [ ] Session monitoring configured
- [ ] Logout functionality tested

---

**Last Updated**: January 4, 2025
**Version**: 1.0.0
