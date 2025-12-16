# Fix: Stripe Webhook Limit Reached

## Problem

When trying to save a Stripe configuration, you get this error:

```
TRPCClientError: Failed to create Stripe webhook. Please validate your credentials or contact support.
```

The actual error in the logs is:

```
"You have reached the maximum of 16 test webhook endpoints."
```

## Solution: Delete Old Webhook Endpoints

Stripe has a limit of **16 test webhook endpoints** per account. You need to delete old/unused webhooks.

### Steps:

1. **Go to Stripe Dashboard:**

   - Visit: https://dashboard.stripe.com/test/webhooks
   - Or: https://dashboard.stripe.com → **Developers** → **Webhooks**

2. **Delete Old Webhooks:**

   - Look for webhooks pointing to your app (they'll have URLs like `https://your-tunnel-url.trycloudflare.com/api/webhooks/stripe`)
   - Click on each old/unused webhook
   - Click **Delete** button
   - Confirm deletion

3. **Keep Only Active Webhooks:**

   - Only keep webhooks that are currently in use
   - You can identify active ones by checking which configurations are currently saved in your Saleor dashboard

4. **Try Saving Configuration Again:**
   - Go back to your Saleor dashboard
   - Try saving the Stripe configuration again
   - It should work now

## Alternative: Use Stripe CLI for Local Development

If you're developing locally, you can use Stripe CLI instead of creating webhook endpoints:

1. **Install Stripe CLI** (if not already installed)
2. **Run:**
   ```powershell
   stripe listen --forward-to http://localhost:3002/api/webhooks/stripe
   ```
3. **Use the webhook secret** from the CLI output (starts with `whsec_`)
4. **Add it to your `.env` file:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

This way, you don't need to create webhook endpoints in Stripe Dashboard for local development.

## Prevention

- Regularly clean up unused webhook endpoints
- Use Stripe CLI for local development instead of creating webhooks
- Delete webhooks when you delete Stripe configurations from your app
