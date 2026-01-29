# Storefront Control App

A Saleor Dashboard extension app that manages storefront UI configuration per channel.

## Features

- **Store Info**: Configure store name, tagline, contact info, address
- **Branding**: Logo, colors, typography, border radius, button styles
- **Features**: Toggle 17+ features (wishlist, reviews, newsletter, etc.)
- **Homepage**: Enable/disable sections, set limits
- **Filters**: Configure product filters and quick filter cards
- **Pages**: Enable/disable static pages
- **Integrations**: Analytics, marketing, support, social media
- **SEO**: Title templates, meta descriptions, OG images

## Installation

### Prerequisites

- Saleor 3.20 or higher
- Node.js 18+
- pnpm

### Local Development

1. Navigate to the app directory:

   ```bash
   cd apps/apps/storefront-control
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create `.env.local`:

   ```env
   APL=file
   SECRET_KEY=your-secret-key-for-encryption
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

   The app runs on http://localhost:3001

5. Install in Saleor Dashboard:
   - Go to Settings → Apps → Install new app
   - Enter manifest URL: `http://localhost:3001/api/manifest`

### Production

For production, configure:

```env
APL=saleor-cloud
REST_APL_ENDPOINT=https://your-apl-endpoint
REST_APL_TOKEN=your-apl-token
SECRET_KEY=your-production-secret-key
```

## Import/Export Configuration

The app supports importing and exporting configuration files for easy backup, migration, or environment synchronization.

### Export

1. Go to any channel's configuration overview page
2. Click the **Export** button in the header
3. A JSON file will be downloaded with the current configuration

The exported file includes:

- `schemaVersion`: For compatibility checking
- `exportedAt`: Timestamp
- `channelSlug`: Source channel
- `config`: The full configuration object

### Import

1. Go to the channel where you want to import configuration
2. Click the **Import** button in the header
3. Select a JSON configuration file
4. Review the preview showing what fields will change
5. Click **Apply** to save or **Cancel** to discard

**Validation rules:**

- The file must be valid JSON
- `schemaVersion` must match the current version (1)
- Unknown fields are not allowed (strict mode)
- All required config fields must be present

### Example Configuration File

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-01-16T12:00:00Z",
  "channelSlug": "default-channel",
  "config": {
    "version": 1,
    "channelSlug": "default-channel",
    "store": {
      "name": "My Store",
      "tagline": "Welcome to our store",
      ...
    },
    ...
  }
}
```

## Storefront Integration

The storefront automatically fetches configuration from this app when installed.

### Environment Variables (Optional)

If you want to skip app discovery, set the app URL directly:

```env
STOREFRONT_CONTROL_APP_URL=https://your-app-url
```

### Configuration API

Public endpoint for storefront:

```
GET /api/config/[channelSlug]?saleorApiUrl=https://your-saleor.example.com/graphql/
```

Returns configuration JSON with 60s cache headers.

## Architecture

```
src/
├── pages/
│   ├── api/
│   │   ├── manifest.ts       # App manifest
│   │   ├── register.ts       # Token registration
│   │   ├── trpc/[trpc].ts    # TRPC router
│   │   └── config/
│   │       └── [channelSlug].ts  # Public config endpoint
│   ├── index.tsx             # Channel selector
│   └── [channelSlug]/
│       ├── store.tsx         # Store info form
│       ├── branding.tsx      # Branding form
│       ├── features.tsx      # Feature toggles
│       ├── homepage.tsx      # Homepage sections
│       ├── filters.tsx       # Filters & quick filters
│       ├── pages.tsx         # Page toggles
│       ├── integrations.tsx  # Integrations
│       └── seo.tsx           # SEO settings
├── modules/
│   ├── config/
│   │   ├── schema.ts         # Zod schemas
│   │   ├── defaults.ts       # Default values
│   │   ├── config-manager.ts # Metadata storage
│   │   ├── import-schema.ts  # Import validation & diff
│   │   └── export.ts         # Export utilities
│   ├── trpc/
│   │   ├── router.ts         # TRPC routes
│   │   └── ...
│   └── ui/
│       ├── app-layout.tsx    # Navigation
│       ├── form-field.tsx    # Form components
│       └── config-import.tsx # Import modal UI
└── saleor-app.ts             # APL configuration
```

## Sample config files (ILS / EN)

Default configuration is loaded from language-specific sample files:

- **ILS (Hebrew)**: `sample-config-import.json` — used when `channelSlug` is `ils` or `he`. All content strings (account, checkout, etc.) should be in **Hebrew**.
- **EN (English)**: `sample-config-import-en.json` — used for other channels (e.g. `usd`, `default-channel`). Content strings should be in **English**.

When you add or change schema fields in Storefront Control:

1. **Update `src/modules/config/defaults.ts`** — add the new keys to the fallback config (used when sample files are missing).
2. **Update both sample files** — add the new keys in the correct language:
   - `sample-config-import.json`: Hebrew text for ILS channel.
   - `sample-config-import-en.json`: English text for EN channels.
3. **Optional**: In the Dashboard, open each channel (e.g. ILS, USD), then use **Update sample config** to write the current config back to the corresponding sample file. This keeps the JSON files in sync with the schema after manual edits.

## Configuration Schema

Configuration is stored per-channel in Saleor app private metadata.

Key: `storefront-config-v1-{channelSlug}`

See `src/modules/config/schema.ts` for the full schema.

## Permissions

Required: `MANAGE_APPS`

## Docker

To run in Docker alongside Saleor:

```yaml
# docker-compose.yml
storefront-control:
  build: ./apps/apps/storefront-control
  environment:
    - APL=file
    - SECRET_KEY=${SECRET_KEY}
  ports:
    - "3001:3000"
```

## License

BSD-3-Clause
