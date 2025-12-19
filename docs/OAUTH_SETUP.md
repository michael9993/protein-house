# OAuth Authentication Setup Guide

Complete guide for setting up Google and Facebook login in your Saleor storefront.

---

## 🎯 Overview

The storefront now supports OAuth authentication with:

- ✅ **Google Sign-In**
- ✅ **Facebook Sign-In**

Users can sign in using their Google or Facebook accounts without creating a separate password.

---

## 📋 Prerequisites

1. **Saleor API** running and accessible
2. **OAuth plugins** installed in Saleor (OpenID Connect plugin)
3. **OAuth app credentials** from Google/Facebook

---

## 🔧 Step 1: Configure OAuth Apps

### Google OAuth Setup

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a new project** or select existing
3. **Enable Google+ API**:
   - APIs & Services → Library
   - Search "Google+ API"
   - Click "Enable"
4. **Create OAuth Credentials**:
   - APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Saleor Storefront"
   - **Authorized redirect URIs**:
     ```
     https://your-saleor-api.com/plugins/openid-connect/callback
     http://localhost:8000/plugins/openid-connect/callback (for local dev)
     ```
5. **Save**:
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `xxxxx`

### Facebook OAuth Setup

1. **Go to**: [Facebook Developers](https://developers.facebook.com/)
2. **Create a new app**:
   - My Apps → Create App
   - Choose "Consumer" or "Business"
   - App name: "Saleor Storefront"
3. **Add Facebook Login**:
   - Products → Add Product → Facebook Login → Set Up
4. **Configure OAuth Settings**:
   - Settings → Basic
   - **App Domains**: Your domain
   - **Valid OAuth Redirect URIs**:
     ```
     https://your-saleor-api.com/plugins/openid-connect/callback
     http://localhost:8000/plugins/openid-connect/callback (for local dev)
     ```
5. **Save**:
   - App ID: `xxxxx`
   - App Secret: `xxxxx`

---

## 🔌 Step 2: Install OpenID Connect Plugin in Saleor

### Option A: Using Dashboard (Recommended)

1. **Go to**: `Dashboard → Configuration → Plugins`
2. **Find**: "OpenID Connect" plugin
3. **Click**: "Activate"
4. **Configure** for each provider:

#### Google Configuration

```
Plugin Name: OpenID Connect (Google)
Authorization URL: https://accounts.google.com/o/oauth2/v2/auth
Access Token URL: https://oauth2.googleapis.com/token
User Info URL: https://openidconnect.googleapis.com/v1/userinfo
Client ID: [Your Google Client ID]
Client Secret: [Your Google Client Secret]
JSON Web Key Set URL: https://www.googleapis.com/oauth2/v3/certs
Use Scope Permissions: false
```

#### Facebook Configuration

```
Plugin Name: OpenID Connect (Facebook)
Authorization URL: https://www.facebook.com/v18.0/dialog/oauth
Access Token URL: https://graph.facebook.com/v18.0/oauth/access_token
User Info URL: https://graph.facebook.com/me?fields=id,email,first_name,last_name
Client ID: [Your Facebook App ID]
Client Secret: [Your Facebook App Secret]
JSON Web Key Set URL: https://www.facebook.com/.well-known/openid_configuration
Use Scope Permissions: false
```

### Option B: Using Environment Variables

Add to `infra/.env`:

```env
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxxx

# Facebook OAuth
FACEBOOK_OAUTH_APP_ID=xxxxx
FACEBOOK_OAUTH_APP_SECRET=xxxxx
```

---

## 🔑 Step 3: Get Plugin IDs

After installing the plugins, you need to find their IDs:

1. **Go to**: `Dashboard → Configuration → Plugins`
2. **Find** the OpenID Connect plugin
3. **Click** on it to see details
4. **Note the Plugin ID** (e.g., `mirumee.authentication.openidconnect`)

Or query via GraphQL:

```graphql
query {
  plugins(first: 100) {
    edges {
      node {
        id
        name
        active
      }
    }
  }
}
```

---

## ⚙️ Step 4: Update Storefront Configuration

### Update Plugin IDs

**File**: `storefront/src/app/[channel]/(main)/login/actions.ts`

Update the `pluginIds` object with your actual plugin IDs:

```typescript
const pluginIds: Record<string, string> = {
  google: "mirumee.authentication.openidconnect", // Replace with your Google plugin ID
  facebook: "mirumee.authentication.openidconnect", // Replace with your Facebook plugin ID
};
```

**Note**: If you have separate plugins for Google and Facebook, use different IDs.

---

## 🧪 Step 5: Test OAuth Login

### Test Google Login

1. **Open**: `http://localhost:3000/default-channel/login`
2. **Click**: "Google" button
3. **Expected**: Redirects to Google login
4. **Sign in** with Google account
5. **Expected**: Redirects back to storefront, logged in

### Test Facebook Login

1. **Open**: `http://localhost:3000/default-channel/login`
2. **Click**: "Facebook" button
3. **Expected**: Redirects to Facebook login
4. **Sign in** with Facebook account
5. **Expected**: Redirects back to storefront, logged in

---

## 🐛 Troubleshooting

### Issue: "Failed to get OAuth URL"

**Causes:**

- Plugin not activated
- Wrong plugin ID
- Missing OAuth credentials

**Solutions:**

1. Check plugin is active in Dashboard
2. Verify plugin ID matches
3. Check OAuth credentials are correct

### Issue: "OAuth authentication failed"

**Causes:**

- Invalid redirect URI
- OAuth app not configured correctly
- Missing scopes

**Solutions:**

1. Verify redirect URI matches exactly in OAuth app settings
2. Check OAuth app is in "Live" mode (or use test mode)
3. Ensure required scopes are requested

### Issue: Redirect URI Mismatch

**Error**: `redirect_uri_mismatch`

**Solution:**

- Add exact redirect URI to OAuth app:
  ```
  https://your-saleor-api.com/plugins/openid-connect/callback
  ```

### Issue: Plugin Not Found

**Error**: `Plugin with given ID does not exist`

**Solution:**

1. Check plugin is installed and active
2. Verify plugin ID in `actions.ts` matches Dashboard
3. Query plugins via GraphQL to get correct ID

---

## 📝 OAuth Flow

```
1. User clicks "Sign in with Google/Facebook"
   ↓
2. Storefront calls getOAuthUrl()
   ↓
3. Saleor returns OAuth authorization URL
   ↓
4. User redirected to Google/Facebook
   ↓
5. User authorizes app
   ↓
6. Google/Facebook redirects to callback URL with code
   ↓
7. Storefront calls handleOAuthCallback()
   ↓
8. Saleor exchanges code for tokens
   ↓
9. User logged in, redirected to storefront
```

---

## 🔒 Security Considerations

### Production Checklist

- [ ] Use HTTPS for all OAuth redirects
- [ ] Store OAuth credentials securely (environment variables)
- [ ] Use secure, httpOnly cookies for tokens
- [ ] Enable CSRF protection
- [ ] Validate OAuth state parameter
- [ ] Set proper CORS headers
- [ ] Use production OAuth apps (not test mode)

### Cookie Settings

Tokens are stored in secure cookies:

```typescript
cookieStore.set("saleor.accessToken", token, {
  httpOnly: true, // Prevents XSS attacks
  secure: true, // HTTPS only (production)
  sameSite: "lax", // CSRF protection
  path: "/",
});
```

---

## 📚 GraphQL Mutations Used

### Get OAuth URL

```graphql
mutation ExternalAuthenticationUrl($pluginId: String!, $input: JSONString!) {
  externalAuthenticationUrl(pluginId: $pluginId, input: $input) {
    authenticationData
    errors {
      field
      message
      code
    }
  }
}
```

### Exchange Code for Tokens

```graphql
mutation ExternalObtainAccessTokens($pluginId: String!, $input: JSONString!) {
  externalObtainAccessTokens(pluginId: $pluginId, input: $input) {
    token
    refreshToken
    csrfToken
    user {
      id
      email
      firstName
      lastName
    }
    errors {
      field
      message
      code
    }
  }
}
```

---

## 🎨 Customization

### Change Button Styles

**File**: `storefront/src/app/[channel]/(main)/login/LoginClient.tsx`

Modify the `SocialLoginButton` component styles:

```typescript
className =
  "flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50";
```

### Add More Providers

To add more OAuth providers (e.g., Apple, Twitter):

1. Add provider to `pluginIds` in `actions.ts`
2. Add provider info to `providers` object in `LoginClient.tsx`
3. Configure plugin in Saleor Dashboard
4. Set up OAuth app with provider

---

## ✅ Verification Checklist

- [ ] Google OAuth app created and configured
- [ ] Facebook OAuth app created and configured
- [ ] OpenID Connect plugin installed in Saleor
- [ ] Plugin IDs updated in storefront code
- [ ] Redirect URIs match exactly
- [ ] OAuth credentials stored securely
- [ ] Test login works for both providers
- [ ] Error handling works correctly
- [ ] Tokens stored in secure cookies

---

## 📖 Related Documentation

- [Saleor Authentication](https://docs.saleor.io/docs/developer/authentication)
- [OpenID Connect Plugin](https://github.com/saleor/saleor/tree/main/saleor/plugins/openid_connect)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login)

---

_Last updated: December 2024_
