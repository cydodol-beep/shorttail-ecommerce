# DNS Records for shorttail.id
# Add these records to your domain registrar (GoDaddy, Namecheap, etc.)

## 1. SPF Record (Required for Gmail)

### Record Type: TXT
### Host/Name: @ (or shorttail.id)
### Value:
```
v=spf1 include:_spf.google.com ~all
```

### TTL: 3600 (1 hour) or 14400 (4 hours)

---

## 2. DMARC Record (Recommended)

### Record Type: TXT
### Host/Name: _dmarc
### Value:
```
v=DMARC1; p=none; rua=mailto:admin@shorttail.id
```

### TTL: 3600 or 14400

### Explanation:
- `p=none` - Don't reject unauthenticated emails yet (monitor first)
- `rua=mailto:admin@shorttail.id` - Send DMARC reports to you

After 1-2 weeks of monitoring, change to `p=quarantine`, then `p=reject`.

---

## 3. Optional: CNAME for Mail (if using subdomain)

### Record Type: CNAME
### Host/Name: mail
### Value:
```
ghs.googlehosted.com
```

This allows mail.shorttail.id → Google.

---

## Important Notes About Gmail SMTP

### Problem with Gmail + Custom Domain
Gmail SMTP signs emails as `@gmail.com`, NOT `@shorttail.id`.

When you send:
- From: noreply@shorttail.id
- Via: smtp.gmail.com

Gmail sees mismatch and flags it.

### Solutions:

### Option 1: Send from Gmail Address (Easiest)
Update your Supabase SMTP Sender Email to:
```
your-actual-gmail@gmail.com
```

Then users see it's from your Gmail account (legitimate).

### Option 2: Use Brevo (Free 300/day) - Recommended
Brevo signs emails properly for your custom domain @shorttail.id.

Sign up: https://www.brevo.com
SMTP:
- Host: smtp-relay.brevo.com
- Port: 587
- Username: your-brevo-login
- Password: your-brevo-api-key
- Sender Email: noreply@shorttail.id

### Option 3: Google Workspace (Paid)
Upgrade to Google Workspace to get proper DKIM signing for shorttail.id.

---

## Verification Commands

After adding DNS (wait 24-48 hours for propagation):

### Check SPF:
```bash
dig txt shorttail.id
# Look for: v=spf1 include:_spf.google.com
```

### Check DMARC:
```bash
dig txt _dmarc.shorttail.id
# Look for: v=DMARC1; p=none;
```

### Online Tools:
- https://www.nslookup.io/
- https://mxtoolbox.com/spf.aspx
- https://dmarcian.com/dmarc-inspector

---

## Current Supabase Configuration Check

Go to your Supabase Dashboard and verify:

### Authentication → SMTP Settings
```
✓ Host: smtp.gmail.com
✓ Port: 587
✓ Username: your-gmail@gmail.com
✓ Password: [your 16-char app password]
✓ Sender Email: ??? (see options below)
✓ Sender Name: ShortTail.id
✓ Sender Name (Localized): ShortTail.id
```

### Important: Sender Email Choice

| Option | Sender Email | Result |
|--------|--------------|---------|
| A | noreply@shorttail.id | ⚠️ May flag (no DKIM for this domain) |
| B | your-gmail@gmail.com | ✅ Best for Gmail SMTP |
| C | info@shorttail.id | ⚠️ Same issue as A |

**Recommendation**: If staying with Gmail SMTP, use Option B (your actual Gmail address).

---

## Testing Checklist

- [ ] Added SPF record to shorttail.id DNS
- [ ] Added DMARC record to shorttail.id DNS
- [ ] Waited 24-48 hours for propagation
- [ ] Verified with dig/nslookup
- [ ] Sent test email from Supabase dashboard
- [ ] Checked Gmail inbox (and spam folder)
- [ ] Inspected email headers (Show original):
  - [ ] Authentication-Results: spf=pass
  - [ ] Authentication-Results: dkim=pass (may fail with Gmail SMTP)
