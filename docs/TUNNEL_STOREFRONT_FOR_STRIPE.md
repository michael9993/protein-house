# Tunneling Storefront for Stripe Payment Gateway

## Do You Need to Tunnel the Storefront?

**Short answer: Yes, you should tunnel the storefront** when using tunnel URLs for the API, especially for payment processing.

## Why Tunnel the Storefront?

### 1. CORS Issues

- Browser accessing `localhost:3000` trying to reach tunnel API (`https://*.trycloudflare.com`)
- Different origins can cause CORS errors
- Even with CORS configured, browser security might block cross-origin requests

### 2. Stripe 3DS Redirects

- Stripe 3D Secure authentication redirects back to your storefront
- If storefront is `localhost:3000`, Stripe can't redirect to it from external payment page
- Need a public URL for redirect callbacks

### 3. Payment Flow Completeness

- Some payment flows require the storefront to be publicly accessible
- Payment providers need to redirect users back after authentication

## How to Tunnel the Storefront

### Option 1: Use Existing Tunnel Script

If you have a tunnel script, add storefront (port 3000):

```powershell
# In your tunnel script, add:
cloudflared tunnel --url http://localhost:3000
```

### Option 2: Create Storefront Tunnel Script

Create `infra/scripts/tunnel-storefront.ps1`:

```powershell
# Tunnel Storefront (port 3000)
Write-Host "Starting tunnel for Storefront (port 3000)..." -ForegroundColor Cyan
Start-Process -NoNewWindow cloudflared -ArgumentList "tunnel", "--url", "http://localhost:3000"
Write-Host "Storefront tunnel started!" -ForegroundColor Green
Write-Host "Check the cloudflared output for the tunnel URL" -ForegroundColor Yellow
```

### Option 3: Update Existing Tunnel Script

If you have a script that tunnels multiple services, add storefront to it.

## Configuration After Tunneling

### 1. Update Environment Variables

Once you have the storefront tunnel URL, update `.env`:

```env
# API tunnel URL (already set)
DASHBOARD_API_URL=https://your-api-tunnel.trycloudflare.com/graphql/

# Storefront tunnel URL (add this)
STOREFRONT_URL=https://your-storefront-tunnel.trycloudflare.com
```

### 2. Update Docker Compose (Optional)

If you want to set it in `docker-compose.dev.yml`:

```yaml
saleor-storefront:
  environment:
    NEXT_PUBLIC_STOREFRONT_URL: ${STOREFRONT_URL:-http://localhost:3000}
    NEXT_PUBLIC_SALEOR_API_URL: ${DASHBOARD_API_URL:-http://localhost:8000/graphql/}
```

### 3. Restart Storefront

```powershell
cd infra
docker compose -f docker-compose.dev.yml restart saleor-storefront
```

## Verification Steps

### 1. Check Storefront is Accessible

- Open storefront tunnel URL in browser
- Should see the storefront homepage

### 2. Check API Connection

- Open browser console (F12)
- Go to Network tab
- Navigate to a product page
- Check if GraphQL requests are going to your API tunnel URL
- Should see requests to: `https://your-api-tunnel.trycloudflare.com/graphql/`

### 3. Check Payment Gateway

1. Add items to cart
2. Go to checkout
3. Fill in shipping/billing information
4. Check Payment section:
   - Should see Stripe payment option
   - Should see Stripe Elements form

## Troubleshooting

### Gateway Still Not Appearing

**Check:**

1. **Stripe configuration assigned to channel**:

   - Go to Stripe app → Channels configurations
   - Verify your channel has a Stripe config assigned

2. **Storefront can reach API**:

   - Check browser console for errors
   - Verify GraphQL requests are successful
   - Check Network tab for failed requests

3. **API returns payment gateways**:

   - In browser console on checkout page:

   ```javascript
   // Check available payment gateways
   console.log(checkout.availablePaymentGateways);
   ```

   - Should include: `{ id: "saleor.app.payment.stripe", ... }`

4. **CORS is configured**:
   - We already configured CORS to accept all origins
   - But verify API is accessible from storefront tunnel URL

### CORS Errors

If you see CORS errors:

1. **Check API CORS configuration**:

   - We already set `ALLOWED_GRAPHQL_ORIGINS` to `*`
   - Verify it's working

2. **Check API is accessible**:
   - Try accessing API tunnel URL directly in browser
   - Should see GraphQL playground or API response

### Payment Redirect Issues

If payment redirects fail:

1. **Verify storefront tunnel URL**:

   - Storefront must be publicly accessible
   - Stripe needs to redirect back to it

2. **Check redirect URL in Stripe**:
   - Stripe uses the storefront URL from the payment flow
   - Should match your tunnel URL

## Quick Setup Checklist

- [ ] Tunnel storefront (port 3000)
- [ ] Get storefront tunnel URL
- [ ] Update `STOREFRONT_URL` in `.env` (optional)
- [ ] Restart storefront container
- [ ] Verify storefront is accessible via tunnel
- [ ] Verify API connection works
- [ ] Assign Stripe config to channel
- [ ] Test payment gateway appears in checkout

## Alternative: Use Localhost (Not Recommended)

If you don't want to tunnel the storefront:

1. **Access everything via localhost**:

   - Storefront: `http://localhost:3000`
   - API: `http://localhost:8000` (not tunneled)
   - Dashboard: `http://localhost:9000` (not tunneled)

2. **Limitations**:
   - Can't test 3DS authentication properly
   - Payment redirects won't work
   - Can't access from other devices

**Recommendation**: Tunnel the storefront for a complete payment testing experience.
