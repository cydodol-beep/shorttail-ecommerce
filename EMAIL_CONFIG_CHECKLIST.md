# Email Configuration Checklist

## Test Steps

### 1. Verify SMTP Configuration
- [ ] Supabase SMTP settings saved
- [ ] Test email sent successfully from dashboard
- [ ] Check email inbox (and spam folder)

### 2. Verify DNS Records
Run these commands in terminal:
```bash
# Check SPF
dig txt yourdomain.com

# Check DMARC (may take 24-48 hours to propagate)
dig txt _dmarc.yourdomain.com
```

- [ ] SPF record exists
- [ ] DMARC record exists

### 3. Test Email Delivery
Send password reset from your app:
- [ ] Email arrives in Inbox (not Spam)
- [ ] No "dangerous" warning
- [ ] Link works correctly
- [ ] Sender shows your domain

### 4. Gmail Postmaster Check
1. Go to https://gmail.com/postmaster
2. Add your domain
3. Check for delivery issues
- [ ] No spam reports
- [ ] Delivery rate > 95%

### 5. SendGrid/Gmail Headers
Inspect email headers (in Gmail: Show original → check):
- [ ] SPF: PASS
- [ ] DKIM: PASS
- [ ] DMARC: PASS

## Common Issues

### Issue: "This message may be dangerous"
**Cause**: Missing SPF/DKIM authentication
**Fix**: Add DNS records, wait 24-48 hours

### Issue: Emails go to spam
**Cause**: Poor domain reputation or aggressive content
**Fix**:
- Warm up domain (send 10-20/day, increase gradually)
- Check content triggers (avoid "urgent", "click now")
- Use plain text alternative

### Issue: Link doesn't work
**Cause**: Redirect URL not whitelisted
**Fix**:
1. Supabase → Authentication → URL Configuration
2. Add `yourdomain.com/update-password` to allowed redirect URLs
