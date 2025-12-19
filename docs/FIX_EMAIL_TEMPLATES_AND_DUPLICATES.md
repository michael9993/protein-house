# 🔧 Fix Email Templates & Duplicate Emails

## 🎯 The Real Problem

**Email templates are stored in the Saleor Dashboard configuration**, not just in the code!

When you updated `default-templates.ts`, it only affects **NEW** configurations. Your **existing** SMTP configuration still has the **old templates** stored in the database.

---

## ✅ Solution 1: Delete and Recreate SMTP Configuration

### This will apply the new templates from the code!

### Step 1: Access SMTP App in Dashboard

1. Go to Saleor Dashboard
2. Navigate to **Apps** section
3. Click on **"SMTP"** app
4. You'll see the SMTP configuration page

---

### Step 2: Note Your SMTP Settings (Save These!)

Before deleting, **write down** your current SMTP settings:

```
□ SMTP Host: _________________
□ SMTP Port: _________________
□ SMTP Username: _________________
□ SMTP Password: _________________
□ From Email: _________________
□ Encryption: _________________
□ Channels: _________________
```

**IMPORTANT:** Take a screenshot or write these down!

---

### Step 3: Delete Existing Configuration

1. In the SMTP app, find your configuration
2. Look for a **"Delete"** or trash icon button
3. Click it to delete the configuration
4. Confirm the deletion

---

### Step 4: Create New Configuration

1. Click **"Add Configuration"** or **"Create New"**
2. Enter your SMTP settings (use the ones you wrote down)
3. Enter configuration name (e.g., "Production Email")
4. Configure SMTP server details
5. Select channels
6. **DO NOT customize templates yet** - they'll use the new professional ones automatically!
7. Save the configuration

---

### Step 5: Test

1. Place a test order
2. Check your email
3. 🎉 You should see the **NEW professional templates**!

---

## ✅ Solution 2: Fix Duplicate Emails

### Check for Multiple Configurations

1. Go to **Dashboard → Apps → SMTP**
2. Check if you have **multiple SMTP configurations**
3. You should only have **ONE active configuration**
4. If you see multiple:
   - **Deactivate** or **delete** the extra ones
   - Keep only ONE active configuration

---

### Check for Duplicate Webhooks

1. **Option A: Via Dashboard UI** (if available)
   - Go to **Dashboard → Webhooks** (if this section exists)
   - Look for duplicate webhook registrations
   - Delete any duplicates

2. **Option B: Via GraphQL** (more reliable)
   
   I'll create a script to check this for you...

---

## 🔍 Check Webhooks via GraphQL

### Run this GraphQL query:

1. Go to: `https://your-dashboard-url/graphql`
2. Or use the GraphQL Playground
3. Run this query:

```graphql
query {
  apps(first: 100) {
    edges {
      node {
        id
        name
        isActive
        webhooks {
          id
          name
          targetUrl
          asyncEvents {
            eventType
          }
          syncEvents {
            eventType
          }
        }
      }
    }
  }
}
```

### What to Look For:

Check the **SMTP app** in the results. Look for:
- **Multiple webhooks** for the same event (e.g., multiple `ORDER_CREATED` webhooks)
- **Duplicate target URLs** pointing to the same endpoint

### If You Find Duplicates:

Delete the duplicate webhooks using this mutation:

```graphql
mutation {
  webhookDelete(id: "WEBHOOK_ID_HERE") {
    webhookErrors {
      field
      message
      code
    }
  }
}
```

Replace `WEBHOOK_ID_HERE` with the ID of the duplicate webhook.

---

## 🚨 Quick Fix: Deactivate Duplicate Configs

If you don't want to delete configurations yet:

1. Go to **Dashboard → Apps → SMTP**
2. Find your SMTP configurations
3. **Deactivate** all but ONE configuration
4. Mark only ONE as "Active"
5. Test by placing an order

You should now receive only ONE email!

---

## 📋 Troubleshooting Checklist

### For Templates Not Updating:

```
□ Deleted old SMTP configuration
□ Created new SMTP configuration
□ New config uses default templates (don't customize yet)
□ Tested with a NEW order
□ Checked email shows new professional design
```

### For Duplicate Emails:

```
□ Only ONE active SMTP configuration exists
□ No duplicate webhooks for SMTP app
□ No duplicate app installations
□ Tested and receiving only ONE email per event
```

---

## 🎯 Alternative: Manually Update Templates in Dashboard

If you don't want to delete/recreate:

1. Go to **Dashboard → Apps → SMTP**
2. Open your SMTP configuration
3. For each event type (ORDER_CREATED, ORDER_FULFILLED, etc.):
   - Click **"Edit Template"** or similar
   - **Delete the OLD template content**
   - **Copy the NEW template** from the code file
4. Save each template
5. Test

**Warning:** This is tedious - you need to update 14 templates manually!

---

## 📄 Where Are the New Templates?

The new professional templates are in:
```
apps/apps/smtp/src/modules/smtp/default-templates.ts
```

Lines to copy for each event:
- **ORDER_CREATED**: Lines 134-235
- **ORDER_FULFILLED**: Lines 237-295
- **ORDER_CONFIRMED**: Lines 297-360
- **ORDER_FULLY_PAID**: Lines 362-425
- **ORDER_REFUNDED**: Lines 427-498
- **ORDER_CANCELLED**: Lines 500-570
- **ORDER_FULFILLMENT_UPDATE**: Lines 572-641
- **GIFT_CARD_SENT**: Lines 643-708
- **INVOICE_SENT**: (already updated separately)
- **ACCOUNT_CONFIRMATION**: Lines 710-788
- **ACCOUNT_PASSWORD_RESET**: Lines 790-873
- **ACCOUNT_CHANGE_EMAIL_REQUEST**: Lines 875-959
- **ACCOUNT_CHANGE_EMAIL_CONFIRM**: Lines 961-1024
- **ACCOUNT_DELETE**: Lines 1026-1124

---

## 💡 Recommended Approach

**EASIEST & FASTEST:**

1. ✅ **Delete** existing SMTP configuration
2. ✅ **Create new** SMTP configuration (uses new templates automatically)
3. ✅ **Check for duplicates** (configs & webhooks)
4. ✅ **Test** with a new order

**Total Time:** 5 minutes

---

## 🎊 After Fixing

Once templates are updated and duplicates removed:

1. Place a test order
2. You should receive **ONE beautiful professional email**
3. Then customize company branding:
   ```typescript
   const COMPANY_NAME = "Your Company";
   const COMPANY_EMAIL = "hello@company.com";
   const PRIMARY_COLOR = "#your-color";
   ```
4. Delete old config, create new one
5. New emails will use YOUR branding!

---

## ❓ Need Help?

If you're unsure about any step, let me know and I can:
- Create a script to check for duplicates
- Provide exact GraphQL mutations
- Guide you through the Dashboard UI

---

**Bottom Line:**
- 🔄 **Templates**: Delete & recreate SMTP config
- 📧 **Duplicates**: Keep only ONE active config
- 🎉 **Result**: Professional emails, no duplicates!

