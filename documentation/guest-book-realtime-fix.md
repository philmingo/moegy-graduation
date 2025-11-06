 Guest Book Realtime Fix Guide

## Problem Summary

You're experiencing two critical errors in the guest book pages:

1. **"tried to subscribe multiple times"** - Multiple subscription attempts to the same channel
2. **"mismatch between server and client bindings for postgres changes"** - Supabase realtime not properly configured

## Root Causes

### 1. Multiple Subscription Error
- Both admin and student guest book pages use the same realtime hook
- When navigating between pages or when React StrictMode causes double renders, multiple subscriptions are attempted
- The old implementation didn't handle concurrent subscription attempts properly

### 2. Server/Client Binding Mismatch
- The `voceo_guest_book_messages` table is not enabled for realtime in Supabase
- The postgres_changes listener is trying to subscribe to a table that's not in the `supabase_realtime` publication

## Solutions Applied

### ✅ Fixed: Realtime Hook (`use-guest-book-realtime.ts`)

**Key improvements:**

1. **Prevents concurrent subscriptions**: Added `isSubscribing` flag and `subscriptionPromise`
2. **Unique channel names**: Changed from static name to `guest-book-realtime-${Date.now()}`
3. **Better cleanup**: Properly handles cleanup when switching between pages
4. **Global query client**: Prevents issues when invalidating queries from different pages
5. **Error handling**: Added try-catch in callbacks to prevent cascading failures

### ⚠️ Action Required: Enable Realtime in Supabase

**You MUST run this in your Supabase SQL Editor:**

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE voceo_guest_book_messages;
```

**Or use the provided script:**
1. Open Supabase Dashboard → SQL Editor
2. Run the script: `scripts/enable-guest-book-realtime.sql`
3. Verify the output shows the table was added

## Testing the Fix

### 1. Clear Browser State
```bash
# In browser console:
localStorage.clear()
sessionStorage.clear()
# Then hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### 2. Test Realtime Subscription

1. Open browser console
2. Navigate to admin guest book page
3. Look for these console logs:
   ```
   ✅ [REALTIME-HOOK] Successfully subscribed to real-time updates
   📡 [REALTIME-HOOK] Subscription status: SUBSCRIBED
   ```

4. Navigate to student guest book page
5. Should see:
   ```
   ♻️ [REALTIME-HOOK] Reusing existing global channel
   ```

### 3. Test Real-Time Updates

1. Keep both admin page open in one tab
2. Open student portal in another tab
3. Create a new guest book message
4. Both tabs should update immediately with the new message
5. Console should show:
   ```
   📨 [REALTIME-HOOK] Database change detected
   ♻️ [REALTIME-HOOK] Invalidating guestBookMessages query cache
   ```

## Fallback Mechanism

If realtime fails (network issues, Supabase issues), the app automatically falls back to **polling mode**:

- Checks for updates every 10 seconds
- No data loss, just slightly delayed updates
- Console will show:
   ```
   ⚡ [GUEST-BOOK-PAGE] Real-time unavailable, starting polling (10s interval)
   🔃 [GUEST-BOOK-PAGE] Polling for updates...
   ```

## Common Issues & Solutions

### Issue: Still seeing "tried to subscribe multiple times"

**Solution:**
1. Clear all browser cache and reload
2. Check if React StrictMode is enabled in `app/layout.tsx`
3. Ensure only ONE instance of the hook is running per page

### Issue: "CHANNEL_ERROR" in console

**Solution:**
1. Verify you ran the SQL script to enable realtime
2. Check Supabase dashboard → Database → Replication
3. Ensure `voceo_guest_book_messages` has realtime enabled

### Issue: Changes not appearing in real-time

**Solution:**
1. Check browser console for errors
2. Verify Supabase URL and anon key in `.env.local`
3. Check Supabase dashboard → API → Realtime is enabled
4. The polling fallback should still work (10s delay)

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│ Admin Guest Book Page                           │
│  └─ useGuestBookRealtime(enabled: true)        │
│     └─ Subscriber #1                            │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ Global Realtime Channel (Singleton)             │
│  - Single Supabase channel instance             │
│  - Shared across all subscribers                │
│  - postgres_changes listener                    │
│  - Global callbacks collection                  │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ Student Guest Book Page                         │
│  └─ useGuestBookRealtime(enabled: true)        │
│     └─ Subscriber #2 (reuses same channel)     │
└─────────────────────────────────────────────────┘
```

## Monitoring Real-Time Status

The hook returns a `status` that you can use to show connection state to users:

- `connecting` - Attempting to establish connection
- `connected` - Successfully subscribed and receiving updates
- `error` - Failed to connect, using polling fallback
- `disconnected` - Intentionally disconnected (disabled)

## Files Changed

1. ✅ `hooks/use-guest-book-realtime.ts` - Fixed subscription logic
2. ✅ `scripts/enable-guest-book-realtime.sql` - SQL script to enable realtime
3. ✅ `documentation/guest-book-realtime-fix.md` - This guide

## Next Steps

1. ✅ Code changes applied
2. ⚠️ **YOU MUST DO**: Run `scripts/enable-guest-book-realtime.sql` in Supabase
3. Test the application
4. Monitor console logs for any remaining issues
5. If still having issues, enable polling as primary mechanism (already implemented as fallback)

## Support

If issues persist after following this guide:
1. Share the full browser console output
2. Share the Supabase SQL query result showing realtime publication status
3. Verify network requests in browser DevTools → Network → WS (WebSocket)
