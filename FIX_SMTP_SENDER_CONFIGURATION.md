# 🔧 Fix SMTP Sender Configuration

## 🐛 The Error

```
Configuration is invalid: missing sender data
InvalidSenderConfigError: Missing sender name or email
```

**This means:** Your SMTP configuration doesn't have a "From" email address and sender name configured!

---

## ✅ What You Need to Do

### Go to Dashboard and Update SMTP Configuration

1. **Open Saleor Dashboard**
2. **Navigate to:** Apps → SMTP
3. **Open your SMTP configuration**
4. **Look for these fields:**

---

## 📋 Required Fields

### Field #1: Sender Email Address (From Email)

**What it is:** The email address that appears in the "From:" field  
**Example:** `noreply@yourstore.com` or `orders@yourstore.com`

**Important:** This should be:

- A real email address from your domain
- Authorized to send through your SMTP server
- Professional looking (not a personal email)

---

### Field #2: Sender Name (From Name)

**What it is:** The friendly name that appears in the "From:" field  
**Example:** `Your Store Name` or `Your Company Orders`

**Important:** This should be:

- Your company/store name
- What customers will see as the sender
- Professional and recognizable

---

## 🎯 How to Fix

### Step 1: Access SMTP Configuration

```
Dashboard → Apps → SMTP → [Your Configuration]
```

### Step 2: Find Sender Settings

Look for fields like:

- **"Sender Email"** or **"From Email"**
- **"Sender Name"** or **"From Name"**

These are usually at the top of the configuration form.

### Step 3: Fill In Values

**Example Configuration:**

```
Sender Name:     Your Professional Store
Sender Email:    noreply@yourstore.com

(Or)

Sender Name:     Acme Store Orders
Sender Email:    orders@acme.com

(Or)

Sender Name:     Customer Service
Sender Email:    support@myshop.com
```

### Step 4: Save Configuration

Click **"Save"** or **"Update"**

### Step 5: Test

Generate a new invoice or place a test order to verify emails work!

---

## 📧 What These Fields Do

### Sender Email (From Email):

This is the email address that appears in the customer's inbox as the sender.

**In the email client, customers will see:**

```
From: noreply@yourstore.com
```

### Sender Name (From Name):

This is the friendly display name that appears before the email address.

**In the email client, customers will see:**

```
From: Your Professional Store <noreply@yourstore.com>
```

**Much better than:**

```
From: noreply@yourstore.com
```

---

## ⚠️ Common Mistakes

### Mistake #1: Using Personal Email

❌ **Don't use:** `john@gmail.com`  
✅ **Use:** `orders@yourstore.com`

### Mistake #2: Not Matching SMTP Server

If your SMTP server is `mail.yourstore.com`, the sender email should probably be `@yourstore.com`

### Mistake #3: Leaving Fields Empty

Both fields are **required**. You must fill in both!

### Mistake #4: Using Invalid Email Format

❌ **Don't use:** `Your Store` (not an email)  
✅ **Use:** `noreply@yourstore.com`

---

## 🔍 Different SMTP Providers

### If Using Gmail SMTP:

```
Sender Name:     Your Store Name
Sender Email:    your-gmail-account@gmail.com
```

### If Using SendGrid:

```
Sender Name:     Your Store Name
Sender Email:    verified-sender@yourstore.com
```

**Note:** SendGrid requires sender verification!

### If Using Your Own Domain:

```
Sender Name:     Your Store Name
Sender Email:    noreply@yourdomain.com
```

### If Using Mailgun:

```
Sender Name:     Your Store Name
Sender Email:    noreply@yourdomain.com
```

---

## 📊 Example: Complete SMTP Configuration

Here's what a complete configuration looks like:

```
Configuration Name:  Production Email
Active:              ✓ Yes

Sender Settings:
  Sender Name:       Professional E-Commerce Store
  Sender Email:      orders@mystore.com

SMTP Server Settings:
  SMTP Host:         smtp.gmail.com (or your SMTP server)
  SMTP Port:         587
  SMTP Username:     your-smtp-username
  SMTP Password:     your-smtp-password
  Encryption:        TLS

Channels:
  ✓ default-channel

Events:
  ✓ All events enabled (or configure per event)
```

---

## 🧪 Quick Test

After configuring sender settings:

1. **Generate an invoice** for any order
2. **Check logs** - should NOT see "missing sender data" error
3. **Check your email** - should receive the invoice email!
4. **Check the "From" field** - should show your sender name and email

---

## 🎯 Visual Guide

### What You're Looking For in Dashboard:

```
┌─────────────────────────────────────────┐
│ SMTP Configuration                      │
├─────────────────────────────────────────┤
│                                         │
│ Configuration Name: [Production Email] │
│                                         │
│ ┌───────────────────────────────────┐ │
│ │ SENDER SETTINGS                   │ │
│ │                                   │ │
│ │ Sender Name: [Your Store Name]   │ │ ← Fill this in!
│ │                                   │ │
│ │ Sender Email: [orders@store.com] │ │ ← Fill this in!
│ └───────────────────────────────────┘ │
│                                         │
│ ┌───────────────────────────────────┐ │
│ │ SMTP SERVER SETTINGS              │ │
│ │ SMTP Host: [smtp.gmail.com]      │ │
│ │ SMTP Port: [587]                 │ │
│ │ ... etc ...                       │ │
│ └───────────────────────────────────┘ │
│                                         │
│         [Save Configuration]            │
└─────────────────────────────────────────┘
```

---

## 💡 Recommended Sender Emails

### For E-Commerce:

- `orders@yourstore.com` - For order confirmations
- `noreply@yourstore.com` - For automated notifications
- `support@yourstore.com` - For customer service
- `billing@yourstore.com` - For invoices and billing

### Sender Names:

- `Your Store Name` - Simple and clear
- `Your Store Orders` - Specific to orders
- `Your Store Team` - Personal touch
- `Your Company Name` - Corporate

---

## 🚨 Troubleshooting

### Error Still Appears After Configuring:

1. Make sure you clicked **"Save"** after filling in the fields
2. Refresh the Dashboard page
3. Check that both fields are filled (not just one)
4. Restart SMTP app if needed:
   ```bash
   docker-compose -f docker-compose.dev.yml restart saleor-smtp-app
   ```

### Can't Find Sender Fields in Dashboard:

1. Make sure you're editing the configuration (not just viewing)
2. Look for "Edit" or "Configure" button
3. Scroll to the top of the configuration form
4. The fields should be near the top, before SMTP server settings

### Emails Still Not Sending:

After configuring sender settings, check:

1. SMTP server settings are correct (host, port, credentials)
2. SMTP server allows sending from that sender email
3. No firewall blocking SMTP connection
4. Check SMTP app logs for other errors

---

## ✅ Checklist

```
□ Opened Dashboard → Apps → SMTP
□ Opened SMTP configuration
□ Found "Sender Name" field
□ Found "Sender Email" field
□ Filled in Sender Name (e.g., "Your Store Name")
□ Filled in Sender Email (e.g., "orders@yourstore.com")
□ Saved configuration
□ Tested by generating invoice
□ Email sent successfully!
```

---

## 📚 Related Documentation

- **SMTP Configuration:** Check your SMTP provider's documentation for sender requirements
- **Email Best Practices:** Use a professional sender name and email
- **SPF/DKIM:** Consider setting up email authentication for better deliverability

---

## 🎊 After Fixing

Once you configure sender settings:

✅ Invoices will be emailed successfully  
✅ Customers will see your professional sender name  
✅ No more "missing sender data" errors  
✅ All email templates will work perfectly

---

**Bottom Line:**

The SMTP configuration needs TWO pieces of information for sending emails:

1. **Who to send FROM** (Sender Name & Email) ← **THIS IS MISSING!**
2. **How to send** (SMTP Server Settings) ← You probably have this

Just add the sender info and you're all set! 🚀

---

_Remember: Both Sender Name AND Sender Email are required!_
