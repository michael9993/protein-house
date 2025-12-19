# OAuth Setup with Cloudflare Tunnel

When using a Cloudflare tunnel (or any tunnel service), you need to configure OAuth redirect URIs to match your tunnel URL.

---

## 🔗 Redirect URIs

### For Your Current Tunnel

**Tunnel URL**: `https://stayed-urw-closing-apartment.trycloudflare.com`

**Google OAuth Redirect URI**:
```
https://stayed-urw-closing-apartment.trycloudflare.com/api/auth/google/callback
```

**Facebook OAuth Redirect URI**:
```
https://stayed-urw-closing-apartment.trycloudflare.com/api/auth/facebook/callback
```

---

## ⚙️ Configuration Steps

### 1. Google Cloud Console

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Navigate to**: APIs & Services → Credentials
3. **Click** on your OAuth 2.0 Client ID
4. **Add Authorized redirect URI**:
   ```
   https://stayed-urw-closing-apartment.trycloudflare.com/api/auth/google/callback
   ```
5. **Save**

**Note**: You can add multiple redirect URIs:
- `http://localhost:3000/api/auth/google/callback` (for local development)
- `https://stayed-urw-closing-apartment.trycloudflare.com/api/auth/google/callback` (for tunnel)

### 2. Facebook Developers

1. **Go to**: [Facebook Developers](https://developers.facebook.com/)
2. **Navigate to**: Your App → Settings → Basic
3. **Add Valid OAuth Redirect URIs**:
   ```
   https://stayed-urw-closing-apartment.trycloudflare.com/api/auth/facebook/callback
   ```
4. **Save Changes**

**Note**: You can add multiple redirect URIs:
- `http://localhost:3000/api/auth/facebook/callback` (for local development)
- `https://stayed-urw-closing-apartment.trycloudflare.com/api/auth/facebook/callback` (for tunnel)

---

## 🔄 If Your Tunnel URL Changes

Cloudflare tunnel URLs can change. If you get a new tunnel URL:

1. **Update OAuth App Settings**:
   - Google: Update redirect URI in Google Cloud Console
   - Facebook: Update redirect URI in Facebook App Settings

2. **No Code Changes Needed**: The storefront code automatically uses the current request origin, so it will work with any tunnel URL.

---

## 🧪 Testing

1. **Ensure tunnel is running**: `https://stayed-urw-closing-apartment.trycloudflare.com`
2. **Go to**: `https://stayed-urw-closing-apartment.trycloudflare.com/default-channel/login`
3. **Click**: "Sign in with Google" or "Sign in with Facebook"
4. **Should redirect** to OAuth provider
5. **After authorization**, should redirect back to your tunnel URL

---

## ⚠️ Important Notes

### Tunnel URL Stability

- **Cloudflare tunnels** generate new URLs each time (unless using a custom domain)
- **For production**, consider:
  - Using a custom domain with Cloudflare
  - Or using a stable tunnel service
  - Or setting up a permanent domain

### Multiple Environments

You can configure multiple redirect URIs in OAuth apps:
- `http://localhost:3000/api/auth/google/callback` (local)
- `https://your-tunnel-url.trycloudflare.com/api/auth/google/callback` (tunnel)
- `https://yourdomain.com/api/auth/google/callback` (production)

All will work - OAuth providers will accept any of the configured URIs.

---

## 🔍 Troubleshooting

### "Redirect URI mismatch" Error

**Cause**: Redirect URI not added to OAuth app settings

**Solution**: 
1. Check exact URL in error message
2. Add it to OAuth app settings
3. Wait a few minutes for changes to propagate
4. Try again

### "Invalid redirect_uri" Error

**Cause**: Redirect URI doesn't match exactly (including protocol, domain, path)

**Solution**:
- Ensure `https://` (not `http://`) for tunnel URLs
- Ensure exact path: `/api/auth/google/callback` (not `/api/auth/google/callback/`)
- No trailing slashes

---

*Last updated: December 2024*

