# External Integrations

**Analysis Date:** 2026-02-15

## APIs & External Services

**Payment Processing:**
- Stripe - Payment gateway and card processing
  - SDK: `@stripe/stripe-js` (7.3.0), `@stripe/react-stripe-js` (3.7.0)
  - Python: `stripe` (>=3.0.0, <4)
  - Auth: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (env vars)
  - Implementation: `aura-stripe-app` (App in `apps/apps/stripe/`) + Saleor payment gateway
  - Features: Card payment, saved payment methods, webhook processing
  - Status: Full integration, multi-channel support

- Adyen - Alternative payment processor
  - SDK: `@adyen/adyen-web` (5.53.3), `@adyen/api-library` (15.0.0-beta)
  - Python: `Adyen` (>=4.0.0, <5)
  - Auth: Merchant account credentials, API keys
  - Implementation: Checkout payment option (`storefront/src/app/checkout/`)
  - Features: Drop-in UI, alternative payment methods (Apple Pay, Google Pay, iDEAL, etc.)
  - Status: Integrated in checkout

**Email & Communications:**
- SendGrid - Transactional email delivery
  - SDK: `sendgrid` (>=6.7.1, <7) - Python
  - Python: `python-http-client` (>=3.3.7, <4)
  - Auth: `SENDGRID_API_KEY` (via EMAIL_URL env var)
  - Implementation: Saleor settings.py EMAIL_URL configuration
  - Features: Order notifications, invoice emails, transactional sends
  - Status: Primary email backend

- SMTP - Generic SMTP email support (fallback)
  - Auth: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`
  - Implementation: Django EMAIL_URL or manual SMTP configuration
  - Features: Generic email delivery via SMTP
  - Status: Fallback option, Newsletter app uses this

- Newsletter App - Email campaign management
  - Container: `aura-newsletter-app-dev` (port 3005)
  - Location: `apps/apps/newsletter/`
  - Features: Subscriber management, MJML templates, campaign scheduling
  - Message Queue: Redis via BullMQ for campaign processing
  - Configuration: APL file-based, metadata-driven
  - Status: Fully functional

- SMTP App - Email notification relay
  - Container: `aura-smtp-app-dev` (port 3001)
  - Location: `apps/apps/smtp/`
  - Features: Webhook-driven email for fulfillment, invoices, welcome emails
  - Auth: `APP_SECRET_KEY` for metadata encryption
  - Status: Fully functional

**Product & Catalog Services:**
- Algolia - Product search and faceting
  - Status: "search" app in `apps/apps/search/`
  - Features: Webhook-driven product indexing, faceted search
  - Note: Not Dockerized locally (external SaaS)

- AvaTax - Tax calculation service
  - Status: "avatax" app in `apps/apps/avatax/`
  - Features: Tax rate calculation, compliance
  - Note: Not Dockerized locally

**Analytics & Intelligence:**
- Sales Analytics App - Built-in analytics dashboard
  - Container: `aura-sales-analytics-app-dev` (port 3006)
  - Location: `apps/apps/sales-analytics/`
  - Features: KPIs, GMV, AOV, revenue charts, top products
  - Status: Fully functional

- Google Cloud Storage - Optional file storage
  - SDK: `google-cloud-storage` (>=2.0.0, <3) - Python
  - Implementation: Django Storages backend option
  - Auth: Service account JSON via `GOOGLE_APPLICATION_CREDENTIALS`
  - Status: Optional, can be used instead of S3

- Google Cloud Pub/Sub - Event streaming (optional)
  - SDK: `google-cloud-pubsub` (>=1.7, <3.0) - Python
  - Status: Optional infrastructure

**Other Integrations:**
- Klaviyo - Email marketing platform
  - Status: "klaviyo" app in `apps/apps/klaviyo/`
  - Note: Not Dockerized locally

- Segment - Customer data platform
  - Status: "segment" app in `apps/apps/segment/`
  - Note: Not Dockerized locally

- CMS - Content management integration
  - Status: "cms" app in `apps/apps/cms/`
  - Features: Content sync, publishing workflow
  - Note: Not Dockerized locally

- NP Atobarai - Japanese payment method
  - Status: "np-atobarai" app in `apps/apps/np-atobarai/`
  - Note: Regional payment gateway for Japan

- Products Feed - Product syndication
  - Status: "products-feed" app in `apps/apps/products-feed/`
  - Features: Feed generation for marketplaces

## Data Storage

**Relational Database:**
- PostgreSQL 15
  - Connection: `DATABASE_URL=postgres://user:pass@postgres:5432/saleor`
  - Client: psycopg 3.2.9+ (Python)
  - ORM: Django ORM
  - Stripe app has separate database: `stripe_app` (auto-created)
  - Location in Docker: `postgres:5432`

**Cache & Session Store:**
- Redis 7-alpine
  - Connection: `REDIS_URL=redis://redis:6379/0`
  - Purpose: Session cache, Celery broker
  - Celery Broker: `CELERY_BROKER_URL=redis://redis:6379/1`
  - Celery Results: `CELERY_RESULT_BACKEND=redis://redis:6379/2`
  - Location in Docker: `redis:6379`
  - Newsletter: BullMQ queue on same Redis instance

**Optional Cloud Storage:**
- AWS S3 - File storage for product images, documents
  - SDK: `boto3` (~=1.28), `botocore` (~=1.37) - Python
  - Implementation: Django Storages with S3 backend
  - Auth: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
  - Fallback: Local filesystem (default in Docker)

- DynamoDB - Configuration storage (apps)
  - SDK: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb` - JavaScript
  - Purpose: Store app configuration (Stripe app, Klaviyo, etc.)
  - Auth: AWS credentials via `DATABASE_URL` or SDK env vars
  - Status: Optional, file-based APL used in development

- Azure Storage Blob - Alternative cloud storage
  - SDK: `azure-storage-blob` (>=12.23.1, <13), `azure-common` (>=1.1.28, <2)
  - Status: Supported but not used in this deployment

## Authentication & Identity

**Saleor Auth:**
- @saleor/auth-sdk - Custom authentication library
  - Version: 1.0.3
  - Location: `@saleor/auth-sdk` (npm package)
  - Implementation: `storefront/src/ui/components/AuthProvider.tsx`, `CheckoutAuthProvider.tsx`
  - Features: Cookie-based session management, OAuth support
  - Checkout: Separate Pages Router app with same auth instance

**OAuth Providers (via Saleor):**
- Google OAuth - User account creation/linking (optional)
- Facebook OAuth - User account creation/linking (optional)

**App Authentication:**
- API tokens: Saleor App tokens for webhook authentication
  - Env vars: `SALEOR_APP_TOKEN` (for accessing Saleor API as app)
  - Stripe app: `STRIPE_APP_TOKEN` (separate token)
  - JWT: Webhook signatures via `RSA_PRIVATE_KEY` / `RSA_PRIVATE_PASSWORD`

**Webhook Verification:**
- HMAC-SHA256 signature verification
  - Implementation: `storefront/src/app/api/webhooks/auto-confirm-oauth/route.ts`
  - Key: `WEBHOOK_SECRET_KEY` (shared between API and workers)
  - RSA JWS: For signed webhook payloads from apps

## Monitoring & Observability

**Error Tracking:**
- Sentry - Error monitoring and alerting
  - SDK: `@sentry/react` (8.55.0), `@sentry/nextjs` (apps), `sentry-sdk` (2.12, Python)
  - Public DSN: `NEXT_PUBLIC_SENTRY_DSN` (env var, empty in dev)
  - Python: Configured in Saleor settings
  - Status: Disabled in development (OTEL_ENABLED=false)

**Distributed Tracing & Metrics:**
- OpenTelemetry 1.32.1+
  - SDKs: `opentelemetry-api`, `opentelemetry-sdk`, `opentelemetry-distro[otlp]` - Python
  - JavaScript: `@opentelemetry/api`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/resources`
  - Configuration: Via env vars `OTEL_*` (disabled in dev by default)
  - Semantic conventions: `opentelemetry-semantic-conventions`
  - Status: Infrastructure for production observability

**Logging:**
- Python: `python-json-logger` (0.1.11+) - Structured JSON logging
- JavaScript: `@saleor/apps-logger` (workspace package) - Contextual logging
- Console logging for development

## CI/CD & Deployment

**Source Control:**
- Git repository hosting (GitHub recommended)
- Changesets for version management (`@changesets/cli` 2.26.2+)

**Deployment:**
- Docker containerization for all services
- Docker Compose for local development orchestration
- Cloud platforms: AWS (EC2, ECS, Lambda), Vercel, Railway, Heroku
- Status: No CI/CD automation configured in this repo (external to codebase)

**Build Automation:**
- Turborepo (2.4.4) - Task orchestration for apps monorepo
- Vite - Dashboard build bundler
- Next.js - Storefront and app build system

## Environment Configuration

**Required Environment Variables (Critical):**

**Saleor API:**
- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode (boolean)
- `ALLOWED_HOSTS` - Comma-separated host whitelist
- `ALLOWED_CLIENT_HOSTS` - Frontend hosts for CORS
- `ALLOWED_GRAPHQL_ORIGINS` - GraphQL origin whitelist
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection
- `CELERY_BROKER_URL` - Celery message broker
- `CELERY_RESULT_BACKEND` - Celery results storage
- `WEBHOOK_SECRET_KEY` - Webhook signature secret
- `RSA_PRIVATE_KEY`, `RSA_PRIVATE_PASSWORD` - JWS signing for webhooks
- `PUBLIC_URL` - Public API URL (for webhook issuer, token verification)
- `SALEOR_API_TUNNEL_URL` - Tunnel URL if using Cloudflare/ngrok

**Frontend (Storefront/Dashboard):**
- `NEXT_PUBLIC_SALEOR_API_URL` - Public GraphQL API endpoint
- `SALEOR_API_URL` - Server-side GraphQL API endpoint (Docker service name)
- `NEXT_PUBLIC_DEFAULT_CHANNEL` - Default sales channel slug
- `NEXT_PUBLIC_STOREFRONT_URL` - Public storefront URL
- `SALEOR_APP_TOKEN` - App token for server-to-server calls

**Payments:**
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_APP_TOKEN` - Saleor app token for Stripe app
- `STRIPE_APP_URL` / `STRIPE_APP_API_BASE_URL` - Stripe app endpoints

**Apps (Storefront Control, Newsletter, etc.):**
- `APP_SECRET_KEY` - Encryption key for app metadata
- `SALEOR_API_URL` - Saleor API for apps
- `NEXT_PUBLIC_SALEOR_API_URL` - Public Saleor API
- `{APP}_APP_URL` - App tunnel URL for registration
- `{APP}_APP_TUNNEL_URL` - Tunnel URL if using ngrok/Cloudflare

**Email:**
- `EMAIL_URL` - Email backend config (sendgrid:// or smtp://)
- `SENDGRID_API_KEY` - If using SendGrid
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - If using SMTP
- `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` - Email sender info

**AI Services (Image Studio):**
- `REMBG_URL` - Background removal service (http://aura-rembg:7000 in Docker)
- `ESRGAN_URL` - Image upscaling service (http://aura-esrgan:7001 in Docker)
- `GEMINI_API_KEY` - Google Gemini API key for image generation

**Observability:**
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking DSN
- `OTEL_ENABLED` - Enable OpenTelemetry (false in dev)
- `OTEL_EXPORTER_OTLP_ENDPOINT` - OTLP collector endpoint
- `OTEL_SERVICE_NAME` - Service name for tracing

**Secrets Location:**
- `.env` file in `infra/` directory - Docker Compose secrets (NEVER commit)
- Environment variables injected at runtime (production)
- `.env.local` in individual app directories (dev-only, NEVER commit)
- AWS Secrets Manager or HashiCorp Vault (production recommended)

## Webhooks & Callbacks

**Incoming Webhooks (To Saleor API):**
- App registration and management via Saleor Dashboard
- Payment apps (Stripe) register webhook endpoints
- Event subscriptions: product.created, product.updated, order.created, order.updated, order.confirmed, etc.
- Webhook signature verification: HMAC-SHA256 or RSA JWS

**Outgoing Webhooks (From Saleor):**
- **SMTP App** (`aura-smtp-app-dev:3001`) - Email event webhooks
  - Events: order.created, order.fulfilled, order.cancelled, fulfillment.created, etc.
  - Endpoint: `/api/webhooks/saleor/`
  - Purpose: Send transactional emails via SMTP

- **Stripe App** (`aura-stripe-app-dev:3002`) - Payment processing
  - Events: payment_authorize, payment_capture, payment_refund
  - Endpoint: `/api/webhooks/saleor/`
  - Database: Separate postgres DB for transaction tracking

- **Newsletter App** (`aura-newsletter-app-dev:3005`) - Newsletter sync
  - Events: customer.created, customer.updated
  - Endpoint: `/api/webhooks/saleor/`
  - Queue: BullMQ on Redis for campaign processing

- **Sales Analytics App** (`aura-sales-analytics-app-dev:3006`)
  - Events: order.created, order.updated for analytics aggregation
  - Endpoint: `/api/webhooks/saleor/`

- **Bulk Manager App** (`aura-bulk-manager-app-dev:3007`)
  - One-way app (no webhooks), import/export only

- **Image Studio App** (`aura-image-studio-app-dev:3008`)
  - One-way app (no webhooks), image editing only

- **Storefront Control App** (`aura-storefront-control-app-dev:3004`)
  - Webhook: `storefront-config-updated` - Notifies storefront of config changes
  - Implementation: Custom event via PostMessage iframe bridge

**Webhook Configuration:**
- Webhook URLs registered in Saleor Dashboard or via GraphQL mutation
- Tunnel URLs required for external webhook sources (Stripe, Adyen)
- Signature verification required for security
- RSA JWS signing for app-to-app communication

**Storefront Webhooks:**
- Auto-confirm OAuth endpoint: `storefront/src/app/api/webhooks/auto-confirm-oauth/route.ts`
- Purpose: OAuth token confirmation for third-party integrations
- Signature verification: HMAC-SHA256

---

*Integration audit: 2026-02-15*
