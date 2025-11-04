-- ============================================================================
-- CREATE ADMIN USER FOR GRADUATION ANNOUNCEMENT SYSTEM
-- ============================================================================
-- This script sets up authentication for the application.
-- 
-- IMPORTANT: Run this in Supabase SQL Editor after creating your project
-- 
-- USER TO CREATE:
-- Single admin account that works for both desktop and mobile
-- Email: your.email@example.com (use your real email)
-- Password: your-secure-password
-- 
-- NOTE: The same user account can be logged in on multiple devices simultaneously
-- Supabase automatically handles multiple concurrent sessions (desktop + mobile)
-- Each device gets its own JWT token, all linked to the same user account
-- 
-- NOTE: Multiple concurrent sessions are supported by default.
-- The same user can be logged in on multiple devices simultaneously.
-- ============================================================================

-- Enable the auth schema if not already enabled
-- (Supabase projects have this enabled by default)

-- ============================================================================
-- CREATE USER ACCOUNT
-- ============================================================================
-- This creates ONE user account that works for:
-- - Admin dashboard access (/admin)
-- - Scanner page access (/scanner)  
-- - Mobile scanner access (/mobile-scan)
-- 
-- Email: your.email@example.com (use your real email)
-- Password: your-secure-password
-- 
-- The same login credentials work everywhere!
-- Multiple devices can use the same account simultaneously.
-- ============================================================================

-- Method 1: Using Supabase Dashboard (RECOMMENDED)
-- ------------------------------------------------
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User" > "Create new user"
-- 3. Enter:
--    - Email: your.email@example.com (use your real email)
--    - Password: your-secure-password (make it strong!)
--    - Auto Confirm User: YES ✅ (CRITICAL: check this box to skip email verification)
-- 4. Click "Create user"
-- 
-- That's it! Use these same credentials to log in on:
-- - Desktop admin dashboard
-- - Scanner page
-- - Mobile scanner app

-- Method 2: Using SQL (Alternative)
-- ------------------------------------------------
-- If you prefer SQL, you can create users programmatically.
-- However, note that Supabase recommends using the Dashboard for user creation.
-- 
-- To create a user via SQL, you'll need to use Supabase's admin API
-- or the auth.users table directly (requires service role key).
-- 
-- For security reasons, we recommend Method 1 above.

-- ============================================================================
-- NO SEPARATE MOBILE SCANNER USER NEEDED!
-- ============================================================================
-- The same user account above works for mobile scanning too.
-- Just enter the same email and password on the mobile device.
-- 
-- Supabase will automatically:
-- - Create separate JWT tokens for each device
-- - Allow simultaneous logins on desktop + multiple mobile devices
-- - Keep all sessions synced and secure
-- ============================================================================

-- ============================================================================
-- VERIFY USERS WERE CREATED
-- ============================================================================
-- Run this query to verify both users exist:

SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- You should see your email listed with email_confirmed_at showing a timestamp
-- (not NULL if you checked "Auto Confirm User")

-- ============================================================================
-- IMPORTANT SECURITY NOTES
-- ============================================================================
-- 1. CHANGE DEFAULT PASSWORDS IMMEDIATELY after first login
-- 2. Consider enabling MFA (Multi-Factor Authentication) for admin user
-- 3. Monitor auth.sessions table for unusual activity
-- 4. Set up Row Level Security (RLS) policies on your tables
-- 5. Keep Supabase project and API keys secure
-- 
-- To change password programmatically (after authentication):
-- Use Supabase Dashboard: Authentication > Users > Select User > Reset Password
-- 
-- Or in your application, use:
-- await supabase.auth.updateUser({ password: 'new_password' })
-- ============================================================================

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Ensure your students and guest_book tables have proper RLS policies

-- Example: Allow authenticated users to read students table
-- CREATE POLICY "Allow authenticated users to read students"
-- ON students FOR SELECT
-- TO authenticated
-- USING (true);

-- Example: Allow authenticated users to manage students table
-- CREATE POLICY "Allow authenticated users to manage students"
-- ON students FOR ALL
-- TO authenticated
-- USING (true);

-- ============================================================================
-- SESSION MANAGEMENT
-- ============================================================================
-- Supabase automatically handles multiple concurrent sessions.
-- Each device/browser gets its own session token stored in JWT.
-- 
-- Session tokens automatically refresh and expire after 7 days of inactivity.
-- 
-- To view active sessions:
SELECT 
    user_id,
    created_at,
    updated_at,
    NOT_AFTER as expires_at
FROM auth.sessions
ORDER BY updated_at DESC;

-- To manually revoke all sessions for a user (logout from all devices):
-- This is useful if you want to force logout from all devices
-- DELETE FROM auth.sessions WHERE user_id = 'USER_ID_HERE';

-- ============================================================================
-- ALTERNATIVE: CREATE USERS VIA SUPABASE CLI
-- ============================================================================
-- If you have Supabase CLI installed, you can create users via command line:
-- 
-- supabase auth users create your.email@example.com --password YourSecurePassword123
-- 
-- Replace with your actual email and password
-- ============================================================================

