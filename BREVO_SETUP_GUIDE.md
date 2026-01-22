# Brevo SMTP Setup for shorttail.id

## Step 1: Create Brevo Account

1. Go to https://www.brevo.com
2. Sign up for free account
3. Verify your email address

---

## Step 2: Verify Your Domain (shorttail.id)

### Option A: Verify shorttail.id (Recommended)
1. Go to Brevo Dashboard → **Senders** → **Domains**
2. Click **"Add a domain"**
3. Enter: `shorttail.id`
4. Brevo will show DNS records to add:
   - TXT record for domain verification
   - TXT record for SPF
   - CNAME for DKIM (optional but recommended)

5. Add these records to your DNS at your domain registrar:
   - GoDaddy
   - Namecheap
   - Cloudflare
   - Or wherever you manage shorttail.id DNS

6. Wait for DNS propagation (24-48 hours)
7. Click "Verify" in Brevo

### Option B: Verify shorttail.id@gmail.com (Easiest)
1. Go to Brevo Dashboard → **Senders** → **Email Addresses**
2. Click **"Add an email address"**
3. Enter: `shorttail.id@gmail.com`
4. Brevo will send a verification email
5. Click the link in that email

---

## Step 3: Get Brevo SMTP Credentials

1. Go to Brevo Dashboard → **SMTP & API**
2. Under **SMTP** tab:
   ```
   Host: smtp-relay.brevo.com
   Port: 587
   Login: [Your Brevo login email]
   Password: [Your Master Password or API Key]
   ```

3. Copy these credentials

---

## Step 4: Update Supabase SMTP Settings

Go to Supabase Dashboard → Authentication → SMTP Settings

### Replace Current Settings with Brevo:

| Field | Value (Brevo) | Old Value (Gmail) |
|-------|-----------------|-------------------|
| Host | `smtp-relay.brevo.com` | smtp.gmail.com |
| Port | `587` | 587 |
| Username | `your-brevo-login@brevo.com` | shorttail.id@gmail.com |
| Password | `[Brevo password/API key]` | ••••••• |
| Sender Email | `shorttail.id@gmail.com` ✅ OR `noreply@shorttail.id` ✅ | shorttail.id@gmail.com |
| Sender Name | `ShortTail.id` | ShortTail.id |

### Note on Sender Email:

**Option 1**: Use `shorttail.id@gmail.com` (Easiest, no domain verification needed)
- Emails come from your Gmail
- Users recognize it
- Still better than Gmail SMTP because Brevo handles deliverability

**Option 2**: Use `noreply@shorttail.id` (Professional)
- Requires domain verification in Brevo
- Looks more professional
- Brevo adds proper DKIM signatures

---

## Step 5: Test Email

1. Save SMTP settings in Supabase
2. Go to Authentication → Email Templates
3. Click **"Test Email"** for Reset Password template
4. Send to: your-shorttail.id@gmail.com
5. Check inbox (and spam folder)

**Should work without "dangerous" warning!** ✅

---

## Comparison: Gmail SMTP vs Brevo

| Feature | Gmail SMTP | Brevo (Free) |
|---------|-------------|----------------|
| Daily Limit | 500 emails | 300 emails (can upgrade) |
| Transactional Emails | ⚠️ Sometimes flagged | ✅ Designed for this |
| DKIM Signing | ❌ Limited | ✅ Automatic |
| SPF/DKIM | ✅ Gmail domain only | ✅ Your domain |
| Delivered to Inbox | ⚠️ 80-90% | ✅ 95-98% |
| Cost | Free | Free (300/day) |
| Professional | ❌ Personal use | ✅ Transactional use |

---

## DNS Records for shorttail.id (if using noreply@shorttail.id)

### After verifying domain in Brevo, add these to your DNS:

### SPF Record
```
Type: TXT
Host: @
Value: v=spf1 include:spf.brevo.com ~all
```

### DKIM Record (Brevo will provide this after domain verification)
```
Type: CNAME
Host: brevo._domainkey
Value: brevo-domainkey.brevo.com
```

### DMARC Record
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@shorttail.id
```

---

## Troubleshooting

### Email still flagged?
1. Wait 24-48 hours after DNS changes
2. Verify all 3 DNS records are active (use nslookup.io)
3. Try sending to a different email address (not Gmail) to test
4. Check Brevo dashboard for delivery status
5. Ensure email template looks professional (not "urgent")

### Emails not arriving?
1. Check SMTP logs in Brevo Dashboard → Logs
2. Check sender reputation (may take time to build)
3. Start with small volume (10-20/day) to "warm up"
4. Check spam folder

---

## Why Brevo Solves Your Problem

| Issue with Gmail | Brevo Solution |
|----------------|----------------|
| Gmail flags password resets as suspicious | Brevo is trusted transactional provider |
| Personal SMTP detected by recipients | Professional sender reputation |
| Daily limit too low | Higher limits with paid plans |
| No proper DKIM for custom domains | Automatic DKIM signing |
| "Dangerous message" warnings | Better deliverability = no warnings |

---

## Quick Reference: Brevo SMTP Settings

| Setting | Value |
|---------|--------|
| Host | smtp-relay.brevo.com |
| Port | 587 |
| Encryption | TLS |
| Authentication | Normal |
| Username | your-email@brevo.com |
| Password | [Your Brevo password/API key] |
| From | shorttail.id@gmail.com or noreply@shorttail.id |
| Reply-to | shorttail.id@gmail.com |
