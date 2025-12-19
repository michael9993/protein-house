# OAuth Auto-Confirmation Setup Guide

This guide explains how to set up automatic account confirmation for OAuth users (Google and Facebook sign-in).

## Problem

When users register via OAuth, Saleor requires email confirmation by default. However, since Google/Facebook already verified the user's email, we should auto-confirm OAuth users to provide a seamless experience.

## Solution

We use a Saleor webhook to listen for `ACCOUNT_CONFIRMATION_REQUESTED` events. When this event is triggered, the webhook automatically confirms the account using the token provided in the webhook payload.

## Setup Steps

### Step 1: Get Your Tunnel URL

If you're using a tunnel (Cloudflare, ngrok, etc.), get your public URL:
- Cloudflare: Check your tunnel status
- ngrok: Check the forwarding URL

Example: `https://stayed-urw-closing-apartment.trycloudflare.com`

### Step 2: Create Webhook in Saleor Dashboard

1. Open Saleor Dashboard: `http://localhost:9000` (or your dashboard URL)
2. Navigate to **Settings** → **Webhooks**
3. Click **Create Webhook**
4. Fill in:
   - **Name**: `Auto-Confirm OAuth Users`
   - **Target URL**: `https://your-tunnel-url/api/webhooks/auto-confirm-oauth`
   - **Events**: Select `ACCOUNT_CONFIRMATION_REQUESTED`
   - **Secret Key**: (Optional, but recommended for production)
5. Click **Save**

### Step 3: Test the Setup

1. Try signing in with Google or Facebook OAuth
2. Check the webhook logs in Saleor Dashboard
3. The user should be automatically confirmed and signed in

## How It Works

1. User clicks "Sign in with Google/Facebook"
2. OAuth flow completes, user is registered in Saleor
3. Saleor sends `ACCOUNT_CONFIRMATION_REQUESTED` webhook event
4. Our webhook handler receives the event with the confirmation token
5. Webhook handler calls `confirmAccount` mutation with the token
6. Account is confirmed automatically
7. User can now sign in immediately

## Alternative: Disable Email Confirmation

If you prefer to disable email confirmation entirely:

1. Go to Saleor Dashboard → **Settings** → **Customer Settings**
2. Disable **"Enable account confirmation by email"**
3. Save changes

This will allow all users (OAuth and regular) to sign in immediately without confirmation.

## Troubleshooting

### Webhook Not Receiving Events

- Check that the webhook URL is accessible from Saleor
- Verify the tunnel URL is correct
- Check webhook logs in Saleor Dashboard
- Ensure the event type is `ACCOUNT_CONFIRMATION_REQUESTED`

### Account Still Not Confirmed

- Check webhook handler logs
- Verify the confirmation token is valid
- Check if there are any errors in the `confirmAccount` mutation

### Webhook Returns 500 Error

- Check storefront logs: `docker logs saleor-storefront-dev`
- Verify the webhook handler is accessible
- Check that the GraphQL mutation is working correctly

## Security Notes

- In production, always use a webhook secret to verify requests
- Consider adding metadata to identify OAuth users vs regular users
- Only auto-confirm users who registered via OAuth (check metadata)

## Manual Confirmation (Fallback)

If the webhook fails, users can still confirm their account via the email link sent by Saleor.

