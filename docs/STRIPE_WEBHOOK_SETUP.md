# Stripe Webhook Setup for Local Development

For local development, you need to use Stripe CLI to forward webhooks from Stripe to your local Stripe app.

## Step 1: Install Stripe CLI

### Windows (using Scoop)
```powershell
scoop install stripe
```

### Windows (using Chocolatey)
```powershell
choco install stripe
```

### Windows (Manual)
1. Download from: https://github.com/stripe/stripe-cli/releases
2. Extract and add to PATH

### macOS
```bash
brew install stripe/stripe-cli/stripe
```

### Linux
```bash
# Download and install
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_X.X.X_linux_x86_64.tar.gz
tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

## Step 2: Login to Stripe

```bash
stripe login
```

This will open your browser to authenticate with Stripe.

## Step 3: Forward Webhooks to Local App

Start forwarding webhooks to your local Stripe app:

```bash
stripe listen --forward-to http://localhost:3002/api/webhooks/stripe
```

**Important**: Make sure your Stripe app is running on port 3002!

## Step 4: Copy the Webhook Secret

When you run `stripe listen`, you'll see output like:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

Copy the webhook secret (starts with `whsec_`) and add it to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Step 5: Restart the Stripe App

After adding the webhook secret, restart the Stripe app:

```powershell
docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app
```

## Step 6: Test Webhooks

1. Make a test payment in your storefront
2. You should see webhook events in the Stripe CLI output
3. Check the Stripe app logs to verify webhooks are being received:

```powershell
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app -f
```

## Troubleshooting

### Webhook Secret Not Working
- Make sure you copied the entire secret (it's long)
- Verify the Stripe app restarted after adding the secret
- Check that `stripe listen` is still running

### Webhooks Not Reaching App
- Verify the Stripe app is running: `docker compose -f infra/docker-compose.dev.yml ps saleor-stripe-app`
- Check the app is accessible on port 3002
- Verify the webhook endpoint path: `/api/webhooks/stripe`

### Stripe CLI Not Connecting
- Make sure you're logged in: `stripe login`
- Check your internet connection
- Verify Stripe CLI is up to date: `stripe --version`

## Production Setup

For production, you'll need to:
1. Set up webhooks in Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Add your production webhook endpoint URL
3. Copy the webhook signing secret from Stripe Dashboard
4. Update `STRIPE_WEBHOOK_SECRET` in your production environment

