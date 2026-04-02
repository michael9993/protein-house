# SMTP App Branding Integration with Storefront-Control

## Overview

The SMTP app now automatically fetches branding information (company name, email, colors, logo) from the **storefront-control** app to ensure all email templates use consistent branding that matches your storefront.

## How It Works

1. **Branding Fetching**: When sending an email, the SMTP app fetches branding configuration from storefront-control's API endpoint (`/api/config/[channelSlug]`)
2. **Template Processing**: Email templates are processed to replace branding variables (e.g., `${PRIMARY_COLOR}`, `${COMPANY_NAME}`) with actual values from storefront-control
3. **Fallback**: If storefront-control is unavailable, the app falls back to default branding values

## Branding Variables

The following variables in email templates are automatically replaced with values from storefront-control:

- `${PRIMARY_COLOR}` → `branding.colors.primary` (e.g., "#2563EB")
- `${SECONDARY_COLOR}` → `branding.colors.secondary` (e.g., "#1F2937")
- `${COMPANY_NAME}` → `store.name` (e.g., "Shoe Vault")
- `${COMPANY_EMAIL}` → `store.email` (e.g., "support@shoevault.com")
- `${COMPANY_WEBSITE}` → `store.website` (if available)
- `${COMPANY_TAGLINE}` → `store.tagline` (optional, e.g., "Shoes for the Whole Family")
- `${STOREFRONT_URL}` → `store.website` (for email action links, falls back to `${COMPANY_WEBSITE}`)
- `${LOGO_URL}` → `branding.logo` (store logo image URL)

## Configuration

### Environment Variables

You can optionally set the storefront-control URL via environment variable:

```bash
# Storefront Control URL (for fetching branding at email-send time)
STOREFRONT_CONTROL_URL=http://storefront-control:3000
# OR (Docker internal)
STOREFRONT_CONTROL_APP_INTERNAL_URL=http://aura-storefront-control-app:3000

# Fallback store branding (used if Storefront Control is unreachable)
STORE_NAME=Your Store
STORE_EMAIL=support@yourstore.com
STORE_TAGLINE=Your store tagline
STOREFRONT_URL=https://yourstore.com
STORE_PRIMARY_COLOR=#2563EB
STORE_SECONDARY_COLOR=#1F2937
STORE_LOGO_URL=https://yourstore.com/logo.png
```

If `STOREFRONT_CONTROL_URL` / `STOREFRONT_CONTROL_APP_INTERNAL_URL` is not set, the app will:
1. Try to use Docker internal service name (`aura-storefront-control-app:3000`) in development
2. Try to construct URL from Saleor API URL
3. Fall back to env-var-driven defaults (`STORE_NAME`, `STORE_EMAIL`, etc.)
4. Fall back to generic "Your Store" defaults if env vars are also not set

## Files Modified

### New Files
- `apps/apps/smtp/src/modules/branding/branding-service.ts` - Service to fetch branding from storefront-control
- `apps/apps/smtp/src/modules/branding/template-branding-processor.ts` - Processor to inject branding into templates

### Modified Files
- `apps/apps/smtp/src/modules/event-handlers/use-case/send-event-messages.use-case.ts` - Fetches branding and processes templates
- All webhook handlers - Pass `saleorApiUrl` to enable branding fetching

## How Templates Work

Email templates can use branding in two ways:

### 1. Template Literal Variables (Current Approach)
Templates use `${VARIABLE}` syntax which gets replaced before Handlebars compilation:

```mjml
<mj-section background-color="${PRIMARY_COLOR}" padding="40px 0">
  <mj-text>© 2024 ${COMPANY_NAME}</mj-text>
</mj-section>
```

### 2. Handlebars Variables (Future Enhancement)
Branding is also injected into the payload, so templates can use Handlebars syntax:

```mjml
<mj-section background-color="{{branding.primaryColor}}" padding="40px 0">
  <mj-text>© 2024 {{branding.companyName}}</mj-text>
</mj-section>
```

## Testing

To test the integration:

1. **Ensure storefront-control is running** and has branding configured for your channel
2. **Send a test email** (e.g., order confirmation, contact submission reply)
3. **Check logs** for branding fetch messages:
   ```
   [BrandingService] Successfully fetched branding from storefront-control
   [SendEventMessagesUseCase] Fetched branding for email
   ```
4. **Verify email** uses correct colors, company name, and email from storefront-control

## Troubleshooting

### Branding Not Applied

1. **Check storefront-control is accessible**:
   ```bash
   curl http://aura-storefront-control-app:3000/api/config/default-channel
   ```

2. **Check logs** for branding fetch errors:
   ```
   [BrandingService] Error fetching branding from storefront-control
   ```

3. **Verify channel slug** matches between SMTP app and storefront-control

4. **Check environment variables** if using custom storefront-control URL

### Using Default Branding

If branding fetch fails, the app will:
- Log a warning
- Continue with default branding values
- Still send the email successfully

Default values are read from environment variables (`STORE_NAME`, `STORE_EMAIL`, etc.) and defined in `BrandingService.getDefaultBranding()`.

## Benefits

✅ **Consistent Branding**: All emails automatically match your storefront design  
✅ **Single Source of Truth**: Branding managed in one place (storefront-control)  
✅ **Channel-Specific**: Different branding per channel if configured  
✅ **Graceful Fallback**: Works even if storefront-control is unavailable  
✅ **No Manual Updates**: Branding changes in storefront-control automatically apply to emails
