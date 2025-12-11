# Stripe App Setup via Manifest URL

Since your Dashboard uses "Extensions" instead of "Apps", you'll need to add the Stripe app using its manifest URL.

## Step 1: Start the Stripe App

First, make sure the Stripe app is running so the manifest endpoint is accessible:

```powershell
docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app
```

Wait for it to start (check logs):
```powershell
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app -f
```

You should see the Next.js dev server starting. Once you see "Ready" or the app is listening on port 3000, proceed.

## Step 2: Get the Manifest URL

The Stripe app exposes its manifest at:
```
http://localhost:3002/api/manifest
```

**Note:** Port 3002 is the external port (mapped from container's port 3000).

## Step 3: Add Extension via Manifest in Dashboard

1. **Open Dashboard:** http://localhost:9000
2. **Go to Extensions:** Click on **Extensions** in the sidebar
3. **Add Extension:** Click **Add Extension** or **Install Extension**
4. **Enter Manifest URL:**
   - Paste: `http://localhost:3002/api/manifest`
   - Or if prompted for a manifest file, use the URL above
5. **Click Install/Add**

The Dashboard will:
- Fetch the manifest from the Stripe app
- Register the app with Saleor
- Create the necessary webhooks
- Generate an App Token automatically

## Step 4: Verify Installation

After installation:
1. The Stripe extension should appear in your Extensions list
2. You should see an App Token generated automatically
3. The app should be connected and ready to configure

## Step 5: Configure Stripe

1. **Open the Stripe Extension** in Dashboard
2. **Add Configuration:**
   - Click **Add Configuration**
   - Fill in:
     - **Configuration Name:** `Development`
     - **Stripe Publishable Key:** `pk_test_51SbW3vRSxEtO1KfpqhsltJmFB7nzWVmCMR92tD7weRQ3OS0vyHWY8albZ5ADoUhhz2D9TIDVfvcZ7WGDJXdW3grG00x2nFVujr`
     - **Stripe Restricted Key:** Create in Stripe Dashboard with:
       - Payment Intents: Write
       - All Webhook: Write
       - Charges: Write
3. **Save Configuration**
4. **Assign to Channel:**
   - Assign the configuration to your channel
   - Enable **"Use Transaction flow when marking order as paid"** in channel settings

## Troubleshooting

### Manifest URL Not Accessible
- Make sure Stripe app is running: `docker compose -f infra/docker-compose.dev.yml ps saleor-stripe-app`
- Check the app is listening: `docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app`
- Verify port 3001 is accessible: Open `http://localhost:3002/api/manifest` in browser (should return JSON)

### Extension Installation Fails
- Check Stripe app logs for errors
- Verify the manifest URL is correct: `http://localhost:3002/api/manifest`
- Make sure Saleor API is running and accessible

### App Token Not Generated
- The token should be generated automatically during installation
- Check the Extensions page for the token
- If missing, you may need to manually create an app (see alternative method below)

## Alternative: Manual App Creation (if manifest doesn't work)

If the manifest method doesn't work, you can create the app manually:

1. **Create App via GraphQL:**
   - Go to: http://localhost:8000/graphql/
   - Run:
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
     }
   }
   ```
2. **Copy the `authToken`**
3. **Add to docker-compose.dev.yml:**
   - Update `SALEOR_APP_TOKEN` with the token
4. **Restart Stripe app**

## Quick Reference

**Manifest URL:** `http://localhost:3002/api/manifest`

**Stripe App:** http://localhost:3002

**Dashboard:** http://localhost:9000 → Extensions

**Commands:**
```powershell
# Start Stripe app
docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app

# Check logs
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app -f

# Test manifest endpoint
curl http://localhost:3002/api/manifest
```

