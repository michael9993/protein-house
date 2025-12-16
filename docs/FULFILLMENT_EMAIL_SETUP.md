# Fulfillment Email Setup Guide

## Overview

Saleor sends fulfillment emails to customers when orders are fulfilled. This requires:

1. **UserEmailPlugin** to be enabled and active
2. **SMTP configuration** to be set up
3. **"Notify customer" checkbox** to be checked when fulfilling/approving

## How Fulfillment Emails Work

### Flow:

1. When you fulfill an order (or approve a fulfillment), the `notifyCustomer` parameter is passed
2. If `notifyCustomer=True`, Saleor calls `send_fulfillment_confirmation_to_customer()`
3. This triggers the `UserEmailPlugin` to send an email via the configured SMTP server

### Where `notifyCustomer` is Set:

1. **When Fulfilling an Order:**

   - In the "Fulfill Order" page, there's a checkbox "Send fulfillment email to customer"
   - This is controlled by `formData.sendInfo` in `OrderFulfill.tsx`
   - The checkbox is checked by default (`sendInfo: true`)

2. **When Approving a Fulfillment:**
   - In the "Approve Fulfillment" dialog, there's a checkbox "Send fulfillment email to customer"
   - This defaults to `true` in `OrderFulfillmentApproveDialog.tsx`
   - The value is passed as `notifyCustomer` to the mutation

## Configuration Steps

### Step 1: Configure SMTP in Environment Variables

Edit `infra/.env` and set up SMTP:

**Option A: Using EMAIL_URL (Recommended)**

```env
EMAIL_URL=smtp://username:password@smtp.gmail.com:587/?tls=True
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

**Option B: Using USER_EMAIL_URL (For UserEmailPlugin specifically)**

```env
USER_EMAIL_URL=smtp://username:password@smtp.gmail.com:587/?tls=True
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

**Gmail Example:**

```env
EMAIL_URL=smtp://your-email@gmail.com:your-app-password@smtp.gmail.com:587/?tls=True
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**Note:** For Gmail, you need to:

1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password (not your regular password) in EMAIL_URL

### Step 2: Enable UserEmailPlugin in Dashboard

1. Navigate to **Configuration** → **Plugins** in the Saleor Dashboard
2. Find **"User emails"** plugin (ID: `mirumee.notifications.user_email`)
3. Click on it to open configuration
4. Ensure it's **Active** (toggle should be ON)
5. If using `USER_EMAIL_URL`, the plugin will auto-configure from environment
6. If not using `USER_EMAIL_URL`, manually configure:
   - **SMTP host**: e.g., `smtp.gmail.com`
   - **SMTP port**: e.g., `587`
   - **SMTP user**: Your email address
   - **Password**: Your app password
   - **Sender name**: Your store name
   - **Sender email**: Your email address
   - **Use TLS**: `True` (for port 587)
   - **Use SSL**: `False` (for port 587)

### Step 3: Verify Email Template

1. In the **User emails** plugin configuration
2. Check that **"Order fulfillment confirmation"** template is set
3. It should be set to `"DEFAULT"` or a custom template
4. If it's empty, emails won't be sent

### Step 4: Restart Services

After updating `.env`:

```powershell
cd infra
docker-compose -f docker-compose.dev.yml restart saleor-api
```

## Troubleshooting

### Check if Plugin is Active

Run this GraphQL query in the Saleor GraphQL Playground:

```graphql
query {
  plugins(first: 100) {
    edges {
      node {
        id
        name
        active
        configuration {
          name
          value
        }
      }
    }
  }
}
```

Look for `mirumee.notifications.user_email` and verify `active: true`.

### Check Email Configuration

The plugin should have these configuration fields populated:

- `host` - SMTP host
- `port` - SMTP port
- `username` - SMTP username
- `password` - SMTP password (will be masked)
- `sender_address` - From email address
- `use_tls` or `use_ssl` - Encryption setting

### Check Logs

Check Saleor API logs for email errors:

```powershell
docker-compose -f docker-compose.dev.yml logs saleor-api | Select-String -Pattern "email|smtp|EMAIL" -Context 3
```

### Test Email Sending

You can test by:

1. Creating a test order
2. Fulfilling it with "Send fulfillment email to customer" checked
3. Check the customer's email inbox
4. Check Saleor API logs for any errors

### Common Issues

1. **EMAIL_URL is set to `consolemail://`**

   - This only prints emails to console, doesn't actually send them
   - Change to a real SMTP URL

2. **Plugin is not active**

   - Enable it in Dashboard → Configuration → Plugins

3. **SMTP credentials are wrong**

   - Double-check username/password
   - For Gmail, use App Password, not regular password

4. **"Notify customer" checkbox is unchecked**

   - Make sure it's checked when fulfilling/approving

5. **Email template is empty**
   - Set it to `"DEFAULT"` in plugin configuration

## Alternative: Using SMTP App

If you prefer using the SMTP App instead of the built-in plugin:

1. Install the SMTP App from the Apps Marketplace
2. Configure SMTP settings in the app
3. The app will handle fulfillment emails via webhooks
4. Make sure webhooks are properly configured

## Code References

- Fulfillment email trigger: `saleor/saleor/order/actions.py:692-701`
- Email sending: `saleor/saleor/order/notifications.py:484-496`
- UserEmailPlugin: `saleor/saleor/plugins/user_email/plugin.py`
- Dashboard checkbox: `dashboard/src/orders/components/OrderFulfillmentApproveDialog/OrderFulfillmentApproveDialog.tsx:34`
