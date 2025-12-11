# Stripe App Setup - Manual Steps Guide

Follow these steps in order to complete the Stripe app setup.

## Step 1: Install Stripe CLI

### Option A: Manual Download (Recommended)
1. Go to: https://github.com/stripe/stripe-cli/releases/latest
2. Download: `stripe_X.X.X_windows_x86_64.zip`
3. Extract to a folder (e.g., `C:\tools\stripe`)
4. Add to PATH:
   - Open System Properties → Environment Variables
   - Add `C:\tools\stripe` to PATH
   - Or use full path: `C:\tools\stripe\stripe.exe`

### Option B: Using Scoop (if installed)
```powershell
scoop install stripe
```

### Verify Installation
```powershell
stripe --version
```

---

## Step 2: Get Saleor App Token

### Via Dashboard (Easiest)
1. Open: **http://localhost:9000**
2. Login with your admin credentials
3. Click **Apps** in the left sidebar
4. Click **Create App** button
5. Fill in:
   - **Name:** `Stripe`
   - **App Type:** `Custom` or `Third-party`
6. Click **Create**
7. **Copy the App Token** (starts with `eyJ...`)

### Via GraphQL Playground (Alternative)
1. Open: **http://localhost:8000/graphql/**
2. Run this mutation:
```graphql
mutation {
  appCreate(
    input: {
      name: "Stripe"
    }
  ) {
    authToken
    app {
      id
      name
    }
    errors {
      field
      message
    }
  }
}
```
3. Copy the `authToken` value

---

## Step 3: Get Webhook Secret

1. **Login to Stripe CLI:**
   ```powershell
   stripe login
   ```
   This will open your browser to authenticate.

2. **Start webhook forwarding:**
   ```powershell
   stripe listen --forward-to http://localhost:3002/api/webhooks/stripe
   ```

3. **Copy the webhook secret:**
   You'll see output like:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
   ```
   Copy the `whsec_...` value.

   **⚠️ Important:** Keep this terminal window open! The webhook forwarding must stay running.

---

## Step 4: Add Credentials to Configuration

You have two options:

### Option A: Use the Helper Script
```powershell
.\infra\scripts\add-stripe-credentials.ps1 -AppToken "your_token_here" -WebhookSecret "whsec_your_secret_here"
```

### Option B: Manual Edit
Edit `infra/docker-compose.dev.yml` and update these lines (around line 283 and 290):

```yaml
SALEOR_APP_TOKEN: ${STRIPE_APP_TOKEN:-your_token_here}
STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-whsec_your_secret_here}
```

Replace:
- `your_token_here` with your App Token from Step 2
- `whsec_your_secret_here` with your webhook secret from Step 3

---

## Step 5: Start the Stripe App

```powershell
docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app
```

### Check Logs
```powershell
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app -f
```

You should see the app connecting to Saleor API. If you see errors, check:
- App Token is correct
- Saleor API is running: `docker compose -f infra/docker-compose.dev.yml ps saleor-api`

---

## Step 6: Configure in Dashboard

1. **Open Dashboard:** http://localhost:9000
2. **Go to Apps:** Click **Apps** in sidebar
3. **Find Stripe:** You should see the Stripe app listed
4. **Open Configuration:**
   - Click on the Stripe app
   - Click **Add Configuration**
5. **Fill in:**
   - **Configuration Name:** `Development`
   - **Stripe Publishable Key:** `pk_test_51SbW3vRSxEtO1KfpqhsltJmFB7nzWVmCMR92tD7weRQ3OS0vyHWY8albZ5ADoUhhz2D9TIDVfvcZ7WGDJXdW3grG00x2nFVujr`
   - **Stripe Restricted Key:** 
     - Go to https://dashboard.stripe.com/test/apikeys
     - Click "Create restricted key"
     - Set permissions:
       - Payment Intents: Write
       - All Webhook: Write
       - Charges: Write
     - Copy the restricted key
6. **Save Configuration**
7. **Assign to Channel:**
   - In Stripe app settings, assign configuration to your channel
   - Go to **Channels** → Select your channel → **Payment providers**
   - Enable **"Use Transaction flow when marking order as paid"**

---

## Step 7: Test the Integration

1. **Create a test product** in Saleor Dashboard
2. **Add to cart** in storefront (http://localhost:3000)
3. **Proceed to checkout**
4. **Select Stripe** as payment method
5. **Use test card:** `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/25)
   - Any 3-digit CVC (e.g., 123)
6. **Complete payment** and verify order is created

---

## Troubleshooting

### Stripe CLI Not Found
- Make sure you added it to PATH
- Or use full path: `C:\path\to\stripe.exe --version`

### App Not Connecting
- Verify App Token is correct
- Check Saleor API is running
- Check logs: `docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app`

### Webhooks Not Working
- Make sure Stripe CLI `listen` command is still running
- Verify webhook secret matches Stripe CLI output
- Check Stripe app is accessible on port 3001

### Payment Methods Not Showing
- Verify Stripe configuration is assigned to channel
- Check channel has transaction flow enabled
- Ensure Stripe keys are correct

---

## Quick Reference

**Services:**
- Stripe App: http://localhost:3002
- Saleor API: http://localhost:8000
- Dashboard: http://localhost:9000
- Storefront: http://localhost:3000

**Commands:**
```powershell
# Start Stripe app
docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app

# View logs
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app -f

# Stop Stripe app
docker compose -f infra/docker-compose.dev.yml stop saleor-stripe-app

# Restart Stripe app
docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app
```

