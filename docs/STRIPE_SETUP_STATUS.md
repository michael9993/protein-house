# Stripe App Setup Status

## ✅ Completed Steps

1. **Apps Repository Cloned**
   - Location: `C:\Users\micha\apps\apps\stripe`
   - Status: ✓ Ready

2. **Docker Compose Configured**
   - Stripe app service added to `infra/docker-compose.dev.yml`
   - Stripe API keys added (publishable and secret)
   - Port: 3002 (different from storefront)
   - Status: ✓ Ready

3. **Stripe API Keys Configured**
   - Publishable Key: `pk_test_51SbW3vRSxEtO1KfpqhsltJmFB7nzWVmCMR92tD7weRQ3OS0vyHWY8albZ5ADoUhhz2D9TIDVfvcZ7WGDJXdW3grG00x2nFVujr`
   - Secret Key: `sk_test_51SbW3vRSxEtO1Kfp8lvBmDfIDZiBvqUGYBdVeIUF5h06gRhSnW0id5XWPeBqNYKdoIiEDBCLP96XLK8PQMaU4GFR00IkOnDtc0`
   - Status: ✓ Configured

## ⏳ Manual Steps Required

### Step 1: Install Stripe CLI

**Option A: Download Manually (Recommended)**
1. Go to: https://github.com/stripe/stripe-cli/releases/latest
2. Download: `stripe_X.X.X_windows_x86_64.zip`
3. Extract to a folder (e.g., `C:\tools\stripe`)
4. Add to PATH or use full path

**Option B: Using Scoop (if installed)**
```powershell
scoop install stripe
```

### Step 2: Get Saleor App Token

**Option A: Via Dashboard (Easiest)**
1. Open: http://localhost:9000
2. Go to: **Apps** → **Create App**
3. Name: `Stripe`
4. App Type: `Custom` or `Third-party`
5. Click **Create**
6. **Copy the App Token** (starts with `eyJ...`)

**Option B: Via GraphQL Playground**
1. Open: http://localhost:8000/graphql/
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

### Step 3: Get Webhook Secret

1. **Login to Stripe CLI:**
   ```powershell
   stripe login
   ```

2. **Start webhook forwarding:**
   ```powershell
   stripe listen --forward-to http://localhost:3002/api/webhooks/stripe
   ```

3. **Copy the webhook secret** that appears (starts with `whsec_...`)

   **Important:** Keep this terminal window open! The webhook forwarding must stay running.

### Step 4: Add Token and Secret

Add these to `infra/docker-compose.dev.yml`:

```yaml
SALEOR_APP_TOKEN: ${STRIPE_APP_TOKEN:-your_token_here}
STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-whsec_your_secret_here}
```

Or create a `.env` file in project root:
```env
STRIPE_APP_TOKEN=your_token_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 5: Start the Stripe App

```powershell
docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app
```

Check logs:
```powershell
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app -f
```

### Step 6: Configure in Dashboard

1. **Open Dashboard:** http://localhost:9000
2. **Go to Apps:** Click on **Apps** in sidebar
3. **Find Stripe:** You should see the Stripe app listed
4. **Open Configuration:**
   - Click on the Stripe app
   - Click **Add Configuration**
5. **Fill in:**
   - **Configuration Name:** `Development`
   - **Stripe Publishable Key:** `pk_test_51SbW3vRSxEtO1KfpqhsltJmFB7nzWVmCMR92tD7weRQ3OS0vyHWY8albZ5ADoUhhz2D9TIDVfvcZ7WGDJXdW3grG00x2nFVujr`
   - **Stripe Restricted Key:** Create in Stripe Dashboard with:
     - Payment Intents: Write
     - All Webhook: Write
     - Charges: Write
6. **Save Configuration**
7. **Assign to Channel:**
   - In Stripe app settings, assign configuration to your channel
   - Make sure channel has **"Use Transaction flow when marking order as paid"** enabled
   - Go to **Channels** → Select channel → **Payment providers** → Enable transaction flow

## 🧪 Testing

1. **Create a test product** in Saleor Dashboard
2. **Add to cart** in storefront (http://localhost:3000)
3. **Proceed to checkout**
4. **Select Stripe** as payment method
5. **Use test card:** `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
6. **Complete payment** and verify order is created

## 📝 Quick Reference

**Files Modified:**
- `infra/docker-compose.dev.yml` - Stripe app service configured

**Files Created:**
- `docs/STRIPE_APP_SETUP.md` - Full setup guide
- `docs/STRIPE_APP_QUICKSTART.md` - Quick start guide
- `docs/STRIPE_WEBHOOK_SETUP.md` - Webhook setup guide
- `infra/scripts/complete-stripe-setup.ps1` - Setup automation script
- `infra/scripts/get-app-token.ps1` - App token helper
- `infra/env-stripe-template.txt` - Environment variables template

**Services:**
- Stripe App: http://localhost:3002
- Saleor API: http://localhost:8000
- Dashboard: http://localhost:9000
- Storefront: http://localhost:3000

## 🆘 Troubleshooting

### App Not Connecting
- Verify `SALEOR_APP_TOKEN` is correct
- Check `SALEOR_API_URL` is `http://saleor-api:8000/graphql/`
- Ensure Saleor API is running: `docker compose -f infra/docker-compose.dev.yml ps saleor-api`

### Webhooks Not Working
- Make sure Stripe CLI is running: `stripe listen --forward-to http://localhost:3002/api/webhooks/stripe`
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe CLI output
- Check Stripe app logs for errors

### Payment Methods Not Showing
- Verify Stripe configuration is assigned to channel
- Check channel has transaction flow enabled
- Ensure Stripe keys are correct

