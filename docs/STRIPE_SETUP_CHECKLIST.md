# Stripe App Setup Checklist

Follow these steps in order. Check off each one as you complete it.

## ✅ Step 1: Install Stripe CLI

- [ ] Go to: https://github.com/stripe/stripe-cli/releases/latest
- [ ] Download: `stripe_X.X.X_windows_x86_64.zip`
- [ ] Extract to a folder (e.g., `C:\tools\stripe`)
- [ ] Test: Open PowerShell and run `C:\tools\stripe\stripe.exe --version`
- [ ] (Optional) Add to PATH for easier access

**Current Status:** ⏳ Waiting for installation

---

## ✅ Step 2: Get Saleor App Token

- [ ] Open Dashboard: http://localhost:9000
- [ ] Login with admin credentials
- [ ] Navigate to: **Apps** → **Create App**
- [ ] Fill in:
  - Name: `Stripe`
  - App Type: `Custom` or `Third-party`
- [ ] Click **Create**
- [ ] **Copy the App Token** (starts with `eyJ...`)
- [ ] Save it somewhere safe

**App Token:** `_________________________` (fill this in)

---

## ✅ Step 3: Get Webhook Secret

- [ ] Open PowerShell
- [ ] Run: `stripe login` (or `C:\tools\stripe\stripe.exe login` if not in PATH)
- [ ] Authenticate in browser
- [ ] Run: `stripe listen --forward-to http://localhost:3002/api/webhooks/stripe`
- [ ] **Copy the webhook secret** (starts with `whsec_...`)
- [ ] **Keep this terminal window open!** (webhook forwarding must stay running)

**Webhook Secret:** `_________________________` (fill this in)

---

## ✅ Step 4: Add Credentials to Configuration

**Option A: Use Helper Script (Easiest)**
- [ ] Open PowerShell in project directory
- [ ] Run:
  ```powershell
  .\infra\scripts\add-stripe-credentials.ps1 -AppToken "your_token_here" -WebhookSecret "whsec_your_secret_here"
  ```
  (Replace with your actual values from Steps 2 and 3)

**Option B: Manual Edit**
- [ ] Open: `infra/docker-compose.dev.yml`
- [ ] Find line 283: `SALEOR_APP_TOKEN: ${STRIPE_APP_TOKEN:-}`
- [ ] Replace with: `SALEOR_APP_TOKEN: ${STRIPE_APP_TOKEN:-your_token_here}`
- [ ] Find line 290: `STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-}`
- [ ] Replace with: `STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-whsec_your_secret_here}`

---

## ✅ Step 5: Start Stripe App

- [ ] Open PowerShell in project directory
- [ ] Run:
  ```powershell
  docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app
  ```
- [ ] Check logs:
  ```powershell
  docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app
  ```
- [ ] Verify you see connection messages (no errors)

---

## ✅ Step 6: Configure in Dashboard

- [ ] Open Dashboard: http://localhost:9000
- [ ] Go to: **Apps** → **Stripe**
- [ ] Click **Add Configuration**
- [ ] Fill in:
  - **Configuration Name:** `Development`
  - **Stripe Publishable Key:** `pk_test_51SbW3vRSxEtO1KfpqhsltJmFB7nzWVmCMR92tD7weRQ3OS0vyHWY8albZ5ADoUhhz2D9TIDVfvcZ7WGDJXdW3grG00x2nFVujr`
  - **Stripe Restricted Key:** 
    - Go to: https://dashboard.stripe.com/test/apikeys
    - Click "Create restricted key"
    - Permissions: Payment Intents (Write), All Webhook (Write), Charges (Write)
    - Copy the restricted key
- [ ] Click **Save**
- [ ] **Assign to Channel:**
  - In Stripe app settings, assign configuration to your channel
  - Go to **Channels** → Select channel → **Payment providers**
  - Enable **"Use Transaction flow when marking order as paid"**

---

## ✅ Step 7: Test the Integration

- [ ] Create a test product in Dashboard
- [ ] Go to storefront: http://localhost:3000
- [ ] Add product to cart
- [ ] Proceed to checkout
- [ ] Select **Stripe** as payment method
- [ ] Use test card: `4242 4242 4242 4242`
  - Expiry: Any future date (e.g., 12/25)
  - CVC: Any 3 digits (e.g., 123)
- [ ] Complete payment
- [ ] Verify order is created in Dashboard

---

## 🎉 Done!

Your Stripe app should now be fully configured and working!

## 📚 Helpful Commands

```powershell
# View Stripe app logs
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app -f

# Restart Stripe app
docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app

# Stop Stripe app
docker compose -f infra/docker-compose.dev.yml stop saleor-stripe-app

# Check all services
docker compose -f infra/docker-compose.dev.yml ps
```

## 🆘 Troubleshooting

- **Stripe CLI not found:** Make sure you extracted it and can run it
- **App not connecting:** Check App Token is correct, verify Saleor API is running
- **Webhooks not working:** Make sure `stripe listen` is still running
- **Payment methods not showing:** Verify configuration is assigned to channel and transaction flow is enabled

