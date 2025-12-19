# Direct OAuth Implementation (No Plugins Required)

This implementation handles Google and Facebook OAuth **directly in the storefront** without requiring Saleor plugins or extensions.

---

## 🎯 How It Works

1. **User clicks "Sign in with Google/Facebook"**
2. **Storefront redirects to OAuth provider** (Google/Facebook)
3. **User authorizes the app**
4. **OAuth provider redirects back** to our callback API route
5. **Storefront exchanges code for user info**
6. **Storefront creates user account** (if new) or handles existing user
7. **User is logged in** via Saleor's standard authentication

---

## ⚙️ Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Storefront URL (for callbacks)
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000
```

### 2. Google OAuth Setup

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Create OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/google/callback
     https://your-domain.com/api/auth/google/callback
     ```
3. **Copy Client ID and Secret** to `.env`

### 3. Facebook OAuth Setup

1. **Go to**: [Facebook Developers](https://developers.facebook.com/)
2. **Create App** → Add Facebook Login
3. **Configure OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/auth/facebook/callback
   https://your-domain.com/api/auth/facebook/callback
   ```
4. **Copy App ID and Secret** to `.env`

---

## 📁 File Structure

```
storefront/src/app/
├── api/
│   └── auth/
│       ├── google/
│       │   ├── route.ts              # Step 1: Redirect to Google
│       │   └── callback/
│       │       └── route.ts           # Step 2: Handle callback
│       └── facebook/
│           ├── route.ts               # Step 1: Redirect to Facebook
│           └── callback/
│               └── route.ts          # Step 2: Handle callback
└── [channel]/(main)/
    └── login/
        ├── LoginClient.tsx           # OAuth buttons
        └── actions.ts                # getOAuthUrl() function
```

---

## 🔄 OAuth Flow

### Google Flow

```
1. User clicks "Sign in with Google"
   ↓
2. GET /api/auth/google?redirect_uri=/default-channel
   ↓
3. Redirect to Google OAuth
   ↓
4. User authorizes
   ↓
5. Google redirects to /api/auth/google/callback?code=xxx&state=xxx
   ↓
6. Exchange code for access token
   ↓
7. Get user info from Google API
   ↓
8. Create user account (if new) or handle existing
   ↓
9. Sign in user via Saleor
   ↓
10. Redirect to /default-channel
```

### Facebook Flow

```
1. User clicks "Sign in with Facebook"
   ↓
2. GET /api/auth/facebook?redirect_uri=/default-channel
   ↓
3. Redirect to Facebook OAuth
   ↓
4. User authorizes
   ↓
5. Facebook redirects to /api/auth/facebook/callback?code=xxx&state=xxx
   ↓
6. Exchange code for access token
   ↓
7. Get user info from Facebook Graph API
   ↓
8. Create user account (if new) or handle existing
   ↓
9. Sign in user via Saleor
   ↓
10. Redirect to /default-channel
```

---

## ⚠️ Current Limitations

### Existing Users

**If a user already has an account** with the same email:
- They will see: "Account already exists. Please use email/password login."
- OAuth login for existing accounts is not yet implemented

**Future Enhancement Options:**
1. **Link OAuth to existing accounts** - Allow users to link Google/Facebook to their existing account
2. **Passwordless tokens** - Store OAuth provider info and allow passwordless login
3. **Account merge** - Automatically merge OAuth accounts with existing accounts

### Security Considerations

- **Random passwords** are generated for OAuth users (they don't need to remember them)
- **Passwords are secure** but stored in Saleor (users can reset via email if needed)
- **OAuth tokens** are not stored long-term (only used during authentication)

---

## 🧪 Testing

### Test Google Login

1. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
2. Go to: `http://localhost:3000/default-channel/login`
3. Click "Google" button
4. Complete OAuth flow
5. Should be logged in and redirected

### Test Facebook Login

1. Set `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` in `.env`
2. Go to: `http://localhost:3000/default-channel/login`
3. Click "Facebook" button
4. Complete OAuth flow
5. Should be logged in and redirected

---

## 🔧 Troubleshooting

### "Google OAuth is not configured"

**Solution**: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

### "Facebook OAuth is not configured"

**Solution**: Set `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` in `.env`

### "Redirect URI mismatch"

**Solution**: Add exact callback URL to OAuth app settings:
- Google: `http://localhost:3000/api/auth/google/callback`
- Facebook: `http://localhost:3000/api/auth/facebook/callback`

### "Account already exists"

**Solution**: This is expected for existing users. They should use email/password login, or you can implement account linking (see Future Enhancements).

---

## 📝 Code Examples

### Getting OAuth URL

```typescript
// In LoginClient.tsx
const result = await getOAuthUrl("google", callbackUrl);
if (result.url) {
  window.location.href = result.url;
}
```

### API Route (Google)

```typescript
// /api/auth/google/route.ts
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
```

---

## ✅ Advantages of This Approach

1. **No plugins required** - Works with any Saleor installation
2. **No extensions needed** - Pure Next.js implementation
3. **Full control** - Customize OAuth flow as needed
4. **Easy to debug** - All code in storefront
5. **Works with self-hosted** - No Saleor Cloud required

---

## 🚀 Next Steps

1. **Set environment variables** (see Setup Instructions)
2. **Configure OAuth apps** (Google & Facebook)
3. **Test OAuth flow** end-to-end
4. **Implement account linking** (optional, for existing users)

---

*Last updated: December 2024*

