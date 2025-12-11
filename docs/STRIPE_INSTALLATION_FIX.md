# Fixing Stripe App Installation Error

## Problem

When installing the Stripe app from the Dashboard, you may see this error:

```
The auth data given during registration request could not be used to fetch app ID.
This usually means that App could not connect to Saleor during installation.
Saleor URL that App tried to connect: http://localhost:8000/graphql/
```

## Root Cause

The Stripe app is running inside Docker and trying to connect to `http://localhost:8000/graphql/`, but `localhost` inside a Docker container refers to the container itself, not the host machine where Saleor API is running.

## Solution

The docker-compose configuration has been updated to include:

1. **Internal Docker URL** (`SALEOR_API_URL`): `http://saleor-api:8000/graphql/` - for server-to-server communication
2. **Public URL** (`NEXT_PUBLIC_SALEOR_API_URL`): `http://localhost:8000/graphql/` - for client-side and installation callbacks
3. **App URL** (`APP_URL`): `http://localhost:3002` - where the app is publicly accessible

## Steps to Fix

1. **Restart the Stripe app** to pick up the new environment variables:

```powershell
docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app
```

2. **Verify the app is running**:

```powershell
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app
```

3. **Check the manifest endpoint** is accessible:

```powershell
# Should return JSON
curl http://localhost:3002/api/manifest
```

4. **Install via Manifest URL** (recommended):

   - Go to Dashboard: http://localhost:9000
   - Navigate to **Extensions** → **Add Extension**
   - Enter manifest URL: `http://localhost:3002/api/manifest`
   - Click **Install**

5. **Or install via App creation** (alternative):

   - Create an app in Dashboard first: **Apps** → **Create App**
   - Name: "Stripe"
   - Copy the App Token
   - Add to `.env` or `docker-compose.dev.yml` as `STRIPE_APP_TOKEN`
   - Restart the Stripe app
   - Then install the extension

## Verification

After installation, verify:

1. **Check app logs** for successful connection:

```powershell
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app | grep -i "connected\|registered\|installed"
```

2. **Check Dashboard**: The Stripe extension should appear in Extensions list

3. **Test connection**: Try to configure Stripe in the Dashboard

## Troubleshooting

### Still Getting Connection Error?

1. **Verify Saleor API is running**:

```powershell
docker compose -f infra/docker-compose.dev.yml ps saleor-api
```

2. **Check network connectivity** from Stripe app container:

```powershell
docker compose -f infra/docker-compose.dev.yml exec saleor-stripe-app wget -O- http://saleor-api:8000/graphql/
```

3. **Verify environment variables**:

```powershell
docker compose -f infra/docker-compose.dev.yml exec saleor-stripe-app env | grep SALEOR
```

4. **Check if App Token is set**:

```powershell
docker compose -f infra/docker-compose.dev.yml exec saleor-stripe-app env | grep STRIPE_APP_TOKEN
```

### Using Tunnel URL?

If you're using a tunnel (cloudflared/ngrok) for webhooks, you might need to:

1. Use the tunnel URL for `APP_URL` instead of localhost
2. Update the manifest URL to use the tunnel URL
3. Ensure the tunnel is running before installation

Example:

```yaml
APP_URL: https://your-tunnel-url.trycloudflare.com
```

## Additional Notes

- The app uses `SALEOR_API_URL` for internal Docker communication
- The app uses `NEXT_PUBLIC_SALEOR_API_URL` for client-side requests
- During installation, the Dashboard may pass URLs that need to be accessible from the app container
- Make sure all services are on the same Docker network (`saleor-network`)
