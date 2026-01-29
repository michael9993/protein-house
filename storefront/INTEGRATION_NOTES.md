# Official Saleor Storefront Integration

This is the **official Saleor Storefront** from [GitHub](https://github.com/saleor/storefront), integrated with your Saleor platform setup.

## What Changed

- **Replaced** custom storefront with official Saleor Storefront
- **Backed up** old storefront to `../storefront-backup/`
- **Updated** Docker configuration to work with the new storefront

## Technology Stack

- **Next.js 15** (latest)
- **React 19** (latest)
- **TypeScript** (strict mode)
- **GraphQL Codegen** (for type-safe GraphQL)
- **Tailwind CSS** (styling)
- **urql** (GraphQL client - different from Apollo Client)

## Key Features

✅ **Next.js 15 App Router** with React Server Components  
✅ **Type-safe GraphQL** with Codegen  
✅ **Single-page checkout**  
✅ **Payment integrations** (Adyen, Stripe)  
✅ **Product catalog** with variants and attributes  
✅ **Customer account** management  
✅ **SEO optimized**  
✅ **Responsive design**  

## Environment Variables

The storefront uses these environment variables (configured in `docker-compose.dev.yml`):

- `NEXT_PUBLIC_SALEOR_API_URL` - Your Saleor GraphQL endpoint (required)
- `NEXT_PUBLIC_DEFAULT_CHANNEL` - Default channel slug (defaults to "default-channel")
- `NEXT_PUBLIC_STOREFRONT_URL` - Storefront URL for canonical links (optional)
- `SALEOR_APP_TOKEN` - App token for authenticated requests (optional)

## Running the Storefront

The storefront is configured to run in Docker. To start it:

```bash
docker compose -f infra/docker-compose.dev.yml up saleor-storefront
```

Or start all services:

```bash
docker compose -f infra/docker-compose.dev.yml up
```

The storefront will be available at: **http://localhost:3000**

## Development

The storefront uses:
- **pnpm** (version 9.6.0) as package manager
- **GraphQL Codegen** runs automatically before dev/build (via `predev` and `prebuild` hooks)
- **Hot reload** enabled for development

## Differences from Custom Storefront

1. **GraphQL Client**: Uses `urql` instead of `@apollo/client`
2. **Auth SDK**: Uses `@saleor/auth-sdk` for authentication
3. **Structure**: More comprehensive with checkout, account pages, etc.
4. **Codegen**: Uses `.graphqlrc.ts` instead of `codegen.yml`

## Storefront Control fallback (sample-import as defaults)

When the Storefront Control API is unavailable, the storefront uses (in order): in-memory cache → localStorage → **storefront-cms-config.json** → hardcoded `defaultStoreConfig`. To use **Storefront Control sample-import** values (channel/brand-appropriate, e.g. ILS vs EN) as the fallback instead of the hardcoded defaults:

From the **repo root**:

```bash
node storefront/scripts/build-fallback-from-samples.cjs
```

This reads `apps/apps/storefront-control/sample-config-import.json` (ILS/Hebrew) and `sample-config-import-en.json` (English) and writes `storefront/storefront-cms-config.json` with channels `ils` and `default`. Run after updating the sample configs so the storefront fallback stays in sync.

## Next Steps

1. **Restart the storefront container** to apply changes:
   ```bash
   docker compose -f infra/docker-compose.dev.yml restart saleor-storefront
   ```

2. **Access the storefront** at http://localhost:3000

3. **Verify connection** to your Saleor API (should work automatically)

4. **Customize** the storefront as needed - all code is in `src/`

## Documentation

- Official Storefront Docs: https://docs.saleor.io/docs/3.x/storefront
- GitHub Repository: https://github.com/saleor/storefront
- Live Demo: https://storefront.saleor.io

