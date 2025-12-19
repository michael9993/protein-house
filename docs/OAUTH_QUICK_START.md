# OAuth Quick Start Guide

Quick setup guide for Google and Facebook login.

---

## ✅ What's Implemented

- ✅ Google Sign-In button (replaces disabled placeholder)
- ✅ Facebook Sign-In button (replaces GitHub)
- ✅ OAuth callback handler
- ✅ Token management
- ✅ Error handling

---

## 🚀 Quick Setup (5 Steps)

### 1. Create OAuth Apps

**Google:**
- [Google Cloud Console](https://console.cloud.google.com/)
- Create OAuth 2.0 Client ID
- Add redirect URI: `https://your-api.com/plugins/openid-connect/callback`

**Facebook:**
- [Facebook Developers](https://developers.facebook.com/)
- Create App → Add Facebook Login
- Add redirect URI: `https://your-api.com/plugins/openid-connect/callback`

### 2. Install OpenID Connect Plugin

**Dashboard → Configuration → Plugins → OpenID Connect → Activate**

### 3. Configure Plugin for Google

```
Authorization URL: https://accounts.google.com/o/oauth2/v2/auth
Access Token URL: https://oauth2.googleapis.com/token
User Info URL: https://openidconnect.googleapis.com/v1/userinfo
Client ID: [Your Google Client ID]
Client Secret: [Your Google Client Secret]
JSON Web Key Set URL: https://www.googleapis.com/oauth2/v3/certs
```

### 4. Configure Plugin for Facebook

```
Authorization URL: https://www.facebook.com/v18.0/dialog/oauth
Access Token URL: https://graph.facebook.com/v18.0/oauth/access_token
User Info URL: https://graph.facebook.com/me?fields=id,email,first_name,last_name
Client ID: [Your Facebook App ID]
Client Secret: [Your Facebook App Secret]
JSON Web Key Set URL: https://www.facebook.com/.well-known/openid_configuration
```

### 5. Test

1. Go to: `http://localhost:3000/default-channel/login`
2. Click "Google" or "Facebook" button
3. Complete OAuth flow
4. Should be logged in!

---

## 🔧 Optional: Custom Plugin IDs

If you have separate plugin instances, set environment variables:

```env
GOOGLE_OAUTH_PLUGIN_ID=your-google-plugin-id
FACEBOOK_OAUTH_PLUGIN_ID=your-facebook-plugin-id
```

---

## 📁 Files Changed

- `storefront/src/app/[channel]/(main)/login/LoginClient.tsx` - Updated buttons
- `storefront/src/app/[channel]/(main)/login/actions.ts` - OAuth functions
- `storefront/src/app/[channel]/(main)/auth/callback/page.tsx` - Callback handler
- `storefront/src/graphql/ExternalAuthenticationUrl.graphql` - New query
- `storefront/src/graphql/ExternalObtainAccessTokens.graphql` - New query

---

## 🐛 Common Issues

**"Failed to get OAuth URL"**
→ Check plugin is active and plugin ID is correct

**"Redirect URI mismatch"**
→ Add exact callback URL to OAuth app settings

**"Plugin not found"**
→ Verify plugin ID in Dashboard → Plugins

---

*See `docs/OAUTH_SETUP.md` for detailed instructions*

