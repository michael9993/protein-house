# Check SMTP Configuration for Duplicate Emails

## Quick Fix Steps:

### 1. Check SMTP Configurations in Dashboard

1. Open Saleor Dashboard
2. Go to **Apps** → Find **SMTP App**
3. Click on the SMTP app to open configuration
4. Check if there are **multiple configurations** listed
5. Look for **duplicate channel configurations** (e.g., two configs for "default-channel")

### 2. Check SMTP Event Configuration

In the SMTP app configuration page:

1. Find the **INVOICE_SENT** event configuration
2. Check if it's:
   - Enabled in multiple channels
   - Listed more than once
   - Has duplicate entries

### 3. If Multiple Configurations Exist:

**Option A: Disable duplicate config**

- Disable or delete the duplicate INVOICE_SENT configuration
- Keep only ONE active configuration per channel

**Option B: Check webhooks in Saleor**

1. Go to Dashboard → **Configuration** → **Webhooks**
2. Filter by app or search for "invoice"
3. Look for duplicate INVOICE_SENT webhooks
4. Delete duplicates (keep only one)

### 4. Verify Fix

After removing duplicates:

1. Generate a new invoice
2. Send the invoice
3. Check your email - should receive only ONE email now

## Technical Explanation

The SMTP app processes INVOICE_SENT webhooks. If:

- Multiple SMTP configurations exist → Each config sends an email
- Multiple webhooks registered → Saleor triggers the event multiple times
- Result: Duplicate emails

## Logs to Monitor

```powershell
# Watch SMTP app logs
docker-compose -f docker-compose.dev.yml logs -f saleor-smtp-app | Select-String "Invoice sent"

# Count how many times webhook is called
# Should see only ONE "Webhook received" per invoice sent
```

Expected output (single email):

```
Invoice sent in Saleor  Webhook received
Invoice sent in Saleor  Attempting to download invoice PDF
Invoice sent in Saleor  Successfully sent email(s)
```

If you see this pattern **twice**, you have duplicate configurations.
