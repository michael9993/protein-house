# Stripe App Setup Guide for Saleor

This guide explains how to set up and use the Stripe payment app with your Saleor platform.

## Overview

Saleor Apps are separate services that extend Saleor's functionality. The Stripe app handles payment processing and integrates with Stripe's payment infrastructure.

## Two Approaches

### Option 1: Install from App Store (Recommended for Production)
- Install directly from the Saleor App Store via the Dashboard
- Managed by Saleor, automatically updated
- Easiest setup, no code management needed

### Option 2: Run Locally (Recommended for Development)
- Clone and run the Stripe app locally
- Full control over code and debugging
- Better for development and customization

## Local Development Setup

### Step 1: Clone the Saleor Apps Repository

```bash
# Clone the apps repository
git clone https://github.com/saleor/apps.git
cd apps/apps/stripe
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the `apps/apps/stripe` directory:

```env
# Saleor API Configuration
SALEOR_API_URL=http://localhost:8000/graphql/
SALEOR_APP_TOKEN=your_app_token_here

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
APP_ID=stripe
APP_NAME=Stripe
APP_ENV=development
```

### Step 3: Create a Saleor App

Before running the Stripe app, you need to create an app in Saleor:

1. **Via Dashboard:**
   - Go to `http://localhost:9000` (Dashboard)
   - Navigate to **Apps** → **Create App**
   - Name: "Stripe"
   - App type: "Custom"
   - Save and copy the **App Token**

2. **Via GraphQL API:**
```graphql
mutation {
  appCreate(
    input: {
      name: "Stripe"
      type: THIRDPARTY
    }
  ) {
    app {
      id
      name
      accessToken
    }
    errors {
      field
      message
    }
  }
}
```

### Step 4: Add Stripe App to Docker Compose

Add the Stripe app service to your `infra/docker-compose.dev.yml`:

```yaml
  saleor-stripe-app:
    build:
      context: ../apps/apps/stripe
      dockerfile: Dockerfile
    container_name: saleor-stripe-app-dev
    ports:
      - "3002:3000"  # Different port from storefront
    volumes:
      - ../apps/apps/stripe:/app
      - stripe-app-node-modules:/app/node_modules
    environment:
      # Saleor API connection
      SALEOR_API_URL: http://saleor-api:8000/graphql/
      SALEOR_APP_TOKEN: ${STRIPE_APP_TOKEN:-}
      
      # Stripe credentials (get from Stripe Dashboard)
      STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUBLISHABLE_KEY:-}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:-}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-}
      
      # App configuration
      APP_ID: stripe
      APP_NAME: Stripe
      APP_ENV: development
      
      NODE_ENV: development
    depends_on:
      saleor-api:
        condition: service_healthy
    networks:
      - saleor-network
    restart: unless-stopped

volumes:
  # ... existing volumes ...
  stripe-app-node-modules:
    driver: local
```

### Step 5: Configure Stripe in Saleor Dashboard

1. **Install the App:**
   - Go to Dashboard → **Apps** → **Stripe**
   - Click **Install** (if using App Store) or **Activate** (if running locally)

2. **Create Stripe Configuration:**
   - Go to **Apps** → **Stripe** → **Configuration**
   - Click **Add Configuration**
   - Fill in:
     - **Configuration Name**: e.g., "Development"
     - **Stripe Publishable Key**: Your Stripe publishable key (starts with `pk_`)
     - **Stripe Restricted Key**: A restricted API key with:
       - Payment Intents: Write
       - All Webhook: Write
       - Charges: Write

3. **Assign to Channel:**
   - In the Stripe app settings, assign the configuration to your channel
   - Ensure the channel has **"Use Transaction flow when marking order as paid"** enabled

### Step 6: Set Up Stripe Webhooks

The Stripe app automatically creates webhooks, but for local development you may need to use Stripe CLI:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local app
stripe listen --forward-to http://localhost:3002/api/webhooks/stripe
```

### Step 7: Test the Integration

1. **Create a Test Product** in Saleor
2. **Add to Cart** in the storefront
3. **Proceed to Checkout**
4. **Select Stripe** as payment method
5. **Use Stripe Test Cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0027 6000 3184`

## Environment Variables Reference

Add these to your `.env` file or `docker-compose.dev.yml`:

```env
# Stripe App Token (from Saleor Dashboard)
STRIPE_APP_TOKEN=your_token_here

# Stripe API Keys (from Stripe Dashboard)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Troubleshooting

### App Not Connecting to Saleor
- Verify `SALEOR_API_URL` is correct
- Check `SALEOR_APP_TOKEN` is valid
- Ensure Saleor API is accessible from the app container

### Webhooks Not Working
- Use Stripe CLI for local development: `stripe listen --forward-to http://localhost:3002/api/webhooks/stripe`
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe CLI output
- Check webhook endpoint is accessible

### Payment Methods Not Showing
- Verify Stripe configuration is assigned to the channel
- Check channel has transaction flow enabled
- Ensure Stripe keys are correct and active

## Production Deployment

For production:
1. Use the App Store version (managed by Saleor)
2. Or deploy the app as a separate service
3. Use production Stripe keys (`pk_live_...` and `sk_live_...`)
4. Set up proper webhook endpoints in Stripe Dashboard
5. Use HTTPS for all webhook endpoints

## Resources

- [Saleor Apps Documentation](https://docs.saleor.io/developer/app-store)
- [Stripe App Documentation](https://docs.saleor.io/developer/app-store/apps/stripe)
- [Stripe App Repository](https://github.com/saleor/apps/tree/HEAD/apps/stripe)
- [Stripe API Documentation](https://stripe.com/docs/api)

