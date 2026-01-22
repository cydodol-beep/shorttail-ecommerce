# Password Reset Issue Fix Guide

## Problem: "Invalid or expired password reset link"

### Root Cause: Redirect URLs Not Configured in Supabase

Supabase requires that **all redirect URLs be explicitly whitelisted** in the dashboard. Your password reset link points to `https://www.shorttail.id/update-password`, but Supabase doesn't recognize this as an authorized redirect.

---

## Fix #1: Add Redirect URLs to Supabase (REQUIRED)

### Step 1: Go to Supabase Dashboard
1. Login: https://supabase.com/dashboard
2. Navigate to: **Authentication** → **URL Configuration**

### Step 2: Add These URLs

Click **"Add URL"** and add each of these:

| URL | Environment | Purpose |
|-----|------------|-----------|
| `http://localhost:3000/**` | Development | Local testing |
| `https://www.shorttail.id/**` | Production | Live website |
| `https://shorttail.id/**` | Production | Without www |

**Important**: Include the `/**` at the end - this allows all sub-paths.

### Step 3: Save Configuration

After adding all URLs, click **Save**.

---

## Fix #2: Update Production Environment Variables

Your production deployment needs correct site URL:

### Option A: Vercel Deployment
1. Go to Vercel Dashboard → Your Project → Settings
2. Add Environment Variables:
   ```
   NEXT_PUBLIC_SITE_URL=https://www.shorttail.id
   NEXT_PUBLIC_APP_URL=https://www.shorttail.id
   ```

### Option B: Other Deployment
Add these to your `.env.production` file:
```bash
NEXT_PUBLIC_SITE_URL=https://www.shorttail.id
NEXT_PUBLIC_APP_URL=https://www.shorttail.id
```

### Option C: Docker/Server
Add to your Docker environment or server config:
```bash
export NEXT_PUBLIC_SITE_URL=https://www.shorttail.id
export NEXT_PUBLIC_APP_URL=https://www.shorttail.id
```

---

## Fix #3: Improved Session Handling (Already Applied)

I've updated `UpdatePasswordClient.tsx` to:
- ✅ Retry session check up to 3 times (500ms, 1s, 1.5s delays)
- ✅ Add detailed console logging for debugging
- ✅ Better error handling for delayed session establishment

**No code changes needed** - this fix is already in your codebase.

---

## Fix #4: Increase Password Reset Token Expiry (Optional)

By default, Supabase password reset links expire in **1 hour**. You can increase this to **24 hours**.

### Go to Supabase Dashboard:
1. Authentication → **Email Templates**
2. Click on **"Reset Password"** template
3. Look for token expiry settings
4. Change to: **24 hours** or **7 days**

---

## Testing After Fix

### Test 1: Development
```bash
# Start dev server
npm run dev

# Visit forgot password page
http://localhost:3000/forgot-password

# Enter your phone number
# Check email for reset link
# Click link in email

# Should show password reset form, NOT "invalid link" error
```

### Test 2: Production
```bash
# Deploy to production
# Visit production website
https://www.shorttail.id/forgot-password

# Enter your phone number
# Click reset link in email

# Should show password reset form
```

---

## Verification Checklist

### Supabase Configuration
- [ ] Logged into Supabase Dashboard
- [ ] Navigated to Authentication → URL Configuration
- [ ] Added `http://localhost:3000/**`
- [ ] Added `https://www.shorttail.id/**`
- [ ] Added `https://shorttail.id/**`
- [ ] Saved configuration

### Environment Variables (Production)
- [ ] `NEXT_PUBLIC_SITE_URL=https://www.shorttail.id` added
- [ ] `NEXT_PUBLIC_APP_URL=https://www.shorttail.id` added
- [ ] Redeployed application after adding env vars

### Testing
- [ ] Forgot password works in development
- [ ] Reset link redirects to correct URL
- [ ] Password update form appears (not "invalid link")
- [ ] Can successfully update password
- [ ] Can login with new password

### Browser Console (Debug)
- [ ] Check console for "Session found" message
- [ ] No "No session found after 3 attempts" error
- [ ] Session establishment completes within 1-2 seconds

---

## Troubleshooting

### Issue: Still seeing "Invalid or expired" after fix

**Check 1**: Redirect URL mismatch
```bash
# In browser console, check the URL when error occurs
# Should be exactly:
https://www.shorttail.id/update-password?type=recovery&access_token=...

# NOT:
http://shorttail.id/update-password... (missing www)
http://www.shorttail.id/update-password?type=recovery (missing token)
```

**Check 2**: DNS/Network issues
- Ensure `www.shorttail.id` resolves correctly
- Check DNS propagation: https://www.nslookup.io/shorttail.id

**Check 3**: Token already used
- Supabase reset tokens are **one-time use**
- If user clicked link once, it's now invalid
- Request new password reset

**Check 4**: Token expired
- Check when email was sent
- If >1 hour ago (or your custom expiry), request new reset

---

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|--------|---------|
| "Invalid or expired" | Redirect URL not in Supabase | Add URL to Supabase Dashboard |
| "Auth session missing" | Session not established | Wait/retry (already fixed in code) |
| "Password reset link expired" | Link clicked after expiry | Request new reset link |
| "Invalid access_token" | Token malformed or already used | Request new reset link |

---

## Code Changes Made

### File: `src/app/(auth)/update-password/UpdatePasswordClient.tsx`

**Changed:**
- Added retry logic for session check (3 attempts)
- Added delays between retries (500ms, 1s, 1.5s)
- Added detailed console logging
- Improved error handling

**No further code changes needed** - just configure Supabase URLs.

---

## Summary: Required Actions

1. ✅ Go to Supabase Dashboard → Authentication → URL Configuration
2. ✅ Add all 3 redirect URLs (localhost, www.shorttail.id, shorttail.id)
3. ✅ Update production environment variables with correct site URL
4. ✅ Redeploy application
5. ✅ Test password reset flow

**Expected Result**: Password reset links work immediately, no more "invalid link" errors!

---

## Why This Fix Works

### Before (Broken):
```
User clicks link → Supabase checks if URL is authorized
                    ↓
              URL NOT in whitelist → REJECT → "Invalid link"
```

### After (Fixed):
```
User clicks link → Supabase checks if URL is authorized
                    ↓
              URL IS in whitelist → ACCEPT → Show password form ✅
```

---

## Support

If still having issues after applying fixes:
1. Check browser console for errors (F12)
2. Copy console logs showing "Password reset - Check session attempt"
3. Check Supabase logs in dashboard
4. Verify all redirect URLs are saved in Supabase Dashboard

---
