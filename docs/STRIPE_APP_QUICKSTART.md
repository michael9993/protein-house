# Stripe App Quick Start Guide

This guide will help you set up the Stripe payment app locally for your Saleor platform.

## Prerequisites

- Docker and Docker Compose installed
- Saleor platform running (API, Dashboard, Storefront)
- Stripe account (sign up at https://stripe.com)

## Step 1: Clone the Apps Repository

The Stripe app is part of the Saleor apps repository. Clone it to the parent directory of your `saleor-platform` folder:

```powershell
# From your saleor-platform directory
cd ..
git clone https://github.com/saleor/apps.git
cd saleor-platform
```

Or use the setup script:
```powershell
.\infra\scripts\setup-stripe-app.ps1
```

## Step 2: Create a Saleor App

Before the Stripe app can connect to Saleor, you need to create an app in the Dashboard:

1. **Open the Dashboard**: http://localhost:9000
2. **Navigate to Apps**: Click on "Apps" in the sidebar
3. **Create App**: Click "Create App" button
4. **Configure**:
   - **Name**: `Stripe`
   - **App Type**: `Custom` or `Third-party`
   - Click "Create"
5. **Copy the App Token**: After creation, copy the `App Token` (starts with something like `eyJ...`)

## Step 3: Get Stripe API Keys

1. **Sign up/Login**: Go to https://dashboard.stripe.com
2. **Get Test Keys**: 
   - Go to **Developers** → **API keys**
   - Copy your **Publishable key** (starts with `pk_test_...`)
   - Copy your **Secret key** (starts with `sk_test_...`)
   - Click "Reveal test key" if needed

## Step 4: Configure Environment Variables

Create or update a `.env` file in your project root, or add these to `docker-compose.dev.yml`:

```env
# Stripe App Token (from Saleor Dashboard)
STRIPE_APP_TOKEN=eyJ...your_token_here

# Stripe API Keys (from Stripe Dashboard)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Optional: Webhook secret (for local development, use Stripe CLI)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Note**: The Stripe app service is already configured in `infra/docker-compose.dev.yml` and will use these environment variables.

## Step 5: Start the Stripe App

```powershell
docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app
```

Check the logs to ensure it's running:
```powershell
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app
```

You should see the app connecting to Saleor API.

## Step 6: Configure Stripe in Saleor Dashboard

1. **Go to Apps**: http://localhost:9000 → Apps
2. **Find Stripe**: You should see the Stripe app listed
3. **Open Configuration**: Click on the Stripe app
4. **Add Configuration**:
   - Click "Add Configuration"
   - **Configuration Name**: e.g., "Development"
   - **Stripe Publishable Key**: Your `pk_test_...` key
   - **Stripe Restricted Key**: Create a restricted key in Stripe Dashboard with:
     - Payment Intents: Write
     - All Webhook: Write
     - Charges: Write
   - Click "Save"

5. **Assign to Channel**:
   - In the Stripe app settings, assign the configuration to your channel
   - Make sure your channel has **"Use Transaction flow when marking order as paid"** enabled
   - Go to **Channels** → Select your channel → **Payment providers** → Enable transaction flow

## Step 7: Set Up Webhooks (Local Development)

For local development, use Stripe CLI to forward webhooks:

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login**: `stripe login`
3. **Forward webhooks**:
   ```bash
   stripe listen --forward-to http://localhost:3002/api/webhooks/stripe
   ```
4. **Copy the webhook secret** (starts with `whsec_...`) and add it to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
5. **Restart the Stripe app** to pick up the webhook secret:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app
   ```

## Step 8: Test the Integration

1. **Create a Test Product** in Saleor Dashboard
2. **Add to Cart** in your storefront (http://localhost:3000)
3. **Proceed to Checkout**
4. **Select Stripe** as payment method
5. **Use Stripe Test Cards**:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0027 6000 3184`
   - Use any future expiry date and any 3-digit CVC

## Troubleshooting

### App Not Connecting
- Verify `SALEOR_API_URL` is correct in docker-compose
- Check `STRIPE_APP_TOKEN` is valid (from Dashboard)
- Ensure Saleor API is running: `docker compose -f infra/docker-compose.dev.yml ps saleor-api`

### Webhooks Not Working
- Use Stripe CLI for local development
- Verify webhook endpoint is accessible: `http://localhost:3002/api/webhooks/stripe`
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe CLI output

### Payment Methods Not Showing
- Verify Stripe configuration is assigned to the channel
- Check channel has transaction flow enabled
- Ensure Stripe keys are correct and active

### Apps Repository Not Found
- Make sure you cloned the apps repo to the parent directory
- Path should be: `../apps/apps/stripe` (relative to `infra/` directory)
- Verify the path in `docker-compose.dev.yml` is correct

## Next Steps

- Read the full [Stripe App Setup Guide](./STRIPE_APP_SETUP.md) for advanced configuration
- Check [Saleor Apps Documentation](https://docs.saleor.io/developer/app-store)
- Review [Stripe App Documentation](https://docs.saleor.io/developer/app-store/apps/stripe)

