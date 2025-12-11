# Critical JWT Signature Fix for Webhooks

## The Problem

When using tunnels (Cloudflare, ngrok, etc.) for external access to your self-hosted Saleor platform, webhook signature verification was failing with:

```
401 Unauthorized
SIGNATURE_VERIFICATION_FAILED: Fetching remote JWKS failed
```

This occurred specifically for Saleor webhooks like:

- `TRANSACTION_CHARGE_REQUESTED`
- `PAYMENT_LIST_GATEWAYS`
- `TRANSACTION_INITIALIZE_SESSION`

## Root Cause Analysis

### What Was Happening

1. **Saleor API** was using `localhost:8000` as its `PUBLIC_URL` (JWT issuer)
2. **Webhook requests** were being sent via tunnel URL (e.g., `https://abc123.trycloudflare.com`)
3. **JWT signature** included `localhost:8000` as the issuer in the token claims
4. **Stripe app** received the request via tunnel but tried to verify against a signature that claimed `localhost` as issuer
5. **Signature verification failed** because the issuer didn't match the actual request source

### Technical Details

#### JWT Token Structure

Saleor signs webhook requests with JWT tokens that include:

```json
{
  "iss": "http://localhost:8000",  // ← This is the problem
  "sub": "webhook",
  "exp": 1234567890,
  ...
}
```

The `iss` (issuer) claim is set to Saleor's `PUBLIC_URL` environment variable.

#### Signature Verification Process

```typescript
// In Stripe app: verify-signature.ts
export async function verifyWebhookSignature(
  jwks: string, // Contains or points to public keys
  signature: string, // JWT signature from Saleor
  rawBody: string // Webhook payload
) {
  // SDK tries to verify signature
  await verifySignatureWithJwks(jwks, signature, rawBody);

  // Verification fails if issuer in JWT doesn't match actual source
}
```

#### The Mismatch

```
┌─────────────────────────────────────────────────────────┐
│ Saleor API (PUBLIC_URL=localhost:8000)                 │
│   ↓                                                      │
│   Signs JWT with iss: "http://localhost:8000"          │
│   ↓                                                      │
│   Sends webhook via tunnel                              │
│   ↓                                                      │
│ Cloudflare Tunnel (trycloudflare.com)                  │
│   ↓                                                      │
│   Forwards to Stripe App                                │
│   ↓                                                      │
│ Stripe App receives:                                    │
│   - Host: abc123.trycloudflare.com                      │
│   - JWT issuer claim: localhost:8000  ← MISMATCH!      │
│   ↓                                                      │
│ Signature verification: FAILED ❌                        │
└─────────────────────────────────────────────────────────┘
```

## The Solution

### Set Saleor's PUBLIC_URL to Tunnel URL

**File**: `infra/docker-compose.dev.yml`

**Before**:

```yaml
environment:
  PUBLIC_URL: ${PUBLIC_URL:-}
```

**After**:

```yaml
environment:
  PUBLIC_URL: ${SALEOR_API_TUNNEL_URL:-http://localhost:8000}
```

**Configuration** (`infra/.env`):

```env
SALEOR_API_TUNNEL_URL=https://your-api-tunnel.trycloudflare.com
```

### Why This Works

Now the JWT token includes the tunnel URL as issuer:

```json
{
  "iss": "https://your-api-tunnel.trycloudflare.com",  // ✅ Matches!
  "sub": "webhook",
  "exp": 1234567890,
  ...
}
```

The verification flow becomes:

```
┌─────────────────────────────────────────────────────────┐
│ Saleor API (PUBLIC_URL=tunnel URL)                     │
│   ↓                                                      │
│   Signs JWT with iss: "https://abc123.trycloudflare.com" │
│   ↓                                                      │
│   Sends webhook via tunnel                              │
│   ↓                                                      │
│ Cloudflare Tunnel (trycloudflare.com)                  │
│   ↓                                                      │
│   Forwards to Stripe App                                │
│   ↓                                                      │
│ Stripe App receives:                                    │
│   - Host: abc123.trycloudflare.com                      │
│   - JWT issuer claim: abc123.trycloudflare.com ✅       │
│   ↓                                                      │
│ Signature verification: SUCCESS ✅                       │
└─────────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Update Environment Configuration

```powershell
# Create or update infra/.env
cd infra

# Add your tunnel URL (get this from cloudflared output)
# NOTE: No /graphql/ suffix!
echo "SALEOR_API_TUNNEL_URL=https://your-api-tunnel.trycloudflare.com" >> .env
```

### 2. Restart Saleor API

```powershell
# Restart to pick up new PUBLIC_URL
docker compose -f docker-compose.dev.yml restart saleor-api

# Verify PUBLIC_URL is set correctly
docker compose -f docker-compose.dev.yml exec saleor-api printenv PUBLIC_URL
# Should output: https://your-api-tunnel.trycloudflare.com
```

### 3. Reinstall Stripe App

**Important**: You must reinstall the app after changing `PUBLIC_URL` because the app stores the JWKS (public keys) during installation.

1. Open Saleor Dashboard: `http://localhost:9000`
2. Go to **Apps** > Your Stripe app > **Delete**
3. Go to **Apps** > **Install App**
4. Enter manifest URL: `https://your-stripe-app-tunnel.trycloudflare.com/api/manifest`
5. Complete installation
6. Copy the app token
7. Update `.env`: `STRIPE_APP_TOKEN=your-new-token`
8. Restart Stripe app: `docker compose -f docker-compose.dev.yml restart saleor-stripe-app`

### 4. Test Webhook Signature Verification

```powershell
# Watch Stripe app logs
docker compose -f docker-compose.dev.yml logs -f saleor-stripe-app

# In another terminal, trigger a payment from storefront
# You should see successful signature verification in logs:
# ✓ Signature verification succeeded
```

## Related Code Changes

### 1. Enhanced Webhook Signature Verification

**File**: `apps/apps/stripe/src/app/api/webhooks/saleor/verify-signature.ts`

**What it does**:

- Intercepts JWKS URL fetching
- If JWKS URL is `localhost`, replaces it with tunnel URL from `NEXT_PUBLIC_SALEOR_API_URL`
- Fetches JWKS JSON from the correct endpoint
- Passes JSON to SDK for signature verification

**Key code**:

```typescript
// Check if JWKS URL is localhost
if (jwks.includes("localhost:8000")) {
  const envSaleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
  if (envSaleorApiUrl) {
    // Use tunnel URL instead
    const tunnelUrl = envSaleorApiUrl.replace(/\/graphql\/?$/, "");
    saleorBaseUrl = tunnelUrl;
  }
}

// Fetch JWKS from correct URL
const jwksEndpoint = `${saleorBaseUrl}/.well-known/jwks.json`;
const response = await fetch(jwksEndpoint);
const jwksJson = await response.json();
```

### 2. Updated App Registration

**File**: `apps/apps/stripe/src/app/api/register/route.ts`

**What it does**:

- During app installation, if `saleorApiUrl` is `localhost`, fetches JWKS from tunnel URL
- Stores JWKS as JSON in database (not as URL)

### 3. Unified Environment Variables

**File**: `infra/docker-compose.dev.yml`

**All services now use**:

- `SALEOR_API_TUNNEL_URL` - Single source of truth
- Consistent fallback: `tunnel → localhost`

## Verification Checklist

After implementing the fix, verify:

- [ ] `PUBLIC_URL` environment variable is set to tunnel URL (not localhost)
- [ ] Saleor API restarted after changing `PUBLIC_URL`
- [ ] Stripe app reinstalled after changing `PUBLIC_URL`
- [ ] Stripe app token updated in `.env`
- [ ] Stripe app restarted after updating token
- [ ] Webhook signature verification succeeds (check logs)
- [ ] Payment transactions complete successfully
- [ ] No 401 Unauthorized errors in logs

## Testing

### Manual Test

1. **Start tunnels**:

   ```powershell
   # Terminal 1
   cloudflared tunnel --url localhost:8000

   # Terminal 2
   cloudflared tunnel --url localhost:3002
   ```

2. **Update configuration**:

   ```powershell
   cd infra

   # Update .env with tunnel URLs
   notepad .env
   ```

3. **Restart services**:

   ```powershell
   docker compose -f docker-compose.dev.yml restart saleor-api saleor-stripe-app
   ```

4. **Reinstall Stripe app** (see steps above)

5. **Test payment**:

   - Go to storefront: `http://localhost:3000`
   - Add item to cart
   - Proceed to checkout
   - Select Stripe payment
   - Complete payment

6. **Check logs**:

   ```powershell
   docker compose -f docker-compose.dev.yml logs -f saleor-stripe-app | Select-String "signature"
   ```

   Should see:

   ```
   ✓ Signature verification succeeded
   ```

### Automated Test

```powershell
# Run Stripe app webhook tests
docker compose -f docker-compose.dev.yml exec saleor-stripe-app sh -c "cd apps/stripe && pnpm test webhooks"
```

## Common Issues

### Issue 1: Still Getting 401 After Fix

**Cause**: Saleor API not restarted or app not reinstalled

**Solution**:

```powershell
# Restart Saleor API
docker compose -f docker-compose.dev.yml restart saleor-api

# Verify PUBLIC_URL
docker compose -f docker-compose.dev.yml exec saleor-api printenv PUBLIC_URL

# Reinstall Stripe app
# (Follow steps in section 3 above)
```

### Issue 2: JWKS Fetch Fails

**Cause**: Tunnel URL incorrect or tunnel not running

**Solution**:

```powershell
# Verify tunnel is running
# Check cloudflared output for the actual URL

# Test JWKS endpoint directly
curl https://your-api-tunnel.trycloudflare.com/.well-known/jwks.json

# Should return JSON with "keys" array
```

### Issue 3: Environment Variable Not Set

**Cause**: Typo in `.env` or Docker not restarted

**Solution**:

```powershell
# Check .env file
cat infra\.env | Select-String "TUNNEL_URL"

# Restart with forced recreation
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-api

# Verify variable inside container
docker compose -f docker-compose.dev.yml exec saleor-api printenv | Select-String "PUBLIC_URL"
```

## Why This is Critical

### Security Implications

JWT signature verification is a **security feature** that:

- Ensures webhooks come from authorized Saleor instance
- Prevents unauthorized parties from triggering payment actions
- Protects against replay attacks

**Failing signature verification** means:

- ❌ All webhook requests are rejected (401 Unauthorized)
- ❌ Payments cannot be processed
- ❌ Refunds cannot be issued
- ❌ Transaction updates don't work

### Production Considerations

For production deployments:

1. **Use proper domain names** (not temporary tunnel URLs)

   ```env
   SALEOR_API_TUNNEL_URL=https://api.your-domain.com
   ```

2. **Set up SSL certificates** for HTTPS

3. **Configure load balancer** to forward correct headers

4. **Document your `PUBLIC_URL`** in deployment guide

5. **Never change `PUBLIC_URL`** without reinstalling all apps

## Summary

✅ **Problem**: JWT signature verification failing due to `localhost` issuer vs tunnel URL  
✅ **Root Cause**: Saleor's `PUBLIC_URL` was not set to tunnel URL  
✅ **Solution**: Set `SALEOR_API_TUNNEL_URL` environment variable  
✅ **Result**: Webhook signature verification now succeeds

This fix is **critical** for:

- ✅ Stripe payment processing
- ✅ Webhook handling
- ✅ External service integration
- ✅ Production deployments

---

**Next Steps**: Follow the [Implementation Steps](#implementation-steps) to apply this fix to your platform.
