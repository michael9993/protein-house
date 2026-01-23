# Newsletter Management App

A dedicated Saleor app for managing newsletter subscribers, email templates, and promotional campaigns.

## Features

- **Subscriber Management**: View and manage newsletter subscribers with filtering and search
- **Image Library**: Upload and manage images for email templates (local storage or S3)
- **Email Templates**: Create and manage MJML-based email templates (coming soon)
- **Campaigns**: Schedule and send promotional emails (coming soon)

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables (see `.env.example`):
- `SECRET_KEY`: Secret key for encrypting app metadata
- `NEWSLETTER_IMAGE_STORAGE`: `local` or `s3` (default: `local`)
- `REDIS_URL`: Redis connection string for BullMQ (default: `redis://saleor-redis:6379`)

For S3 storage:
- `NEWSLETTER_S3_ENDPOINT`
- `NEWSLETTER_S3_ACCESS_KEY_ID`
- `NEWSLETTER_S3_SECRET_ACCESS_KEY`
- `NEWSLETTER_S3_BUCKET`
- `NEWSLETTER_S3_REGION` (optional)
- `NEWSLETTER_CDN_URL` (optional)

3. Run development server:
```bash
pnpm dev
```

## Docker

The app is configured in `infra/docker-compose.dev.yml` and runs on port 3005 by default.

## Architecture

- **Backend**: Next.js API routes with tRPC
- **Frontend**: React with Macaw UI
- **Storage**: App metadata via Saleor SettingsManager
- **Image Storage**: Local filesystem (dev) or S3-compatible storage (production)
- **Queue**: BullMQ with Redis for campaign processing

## Current Status

✅ **Completed:**
- App structure and configuration
- Subscriber management (list, stats, export)
- Image upload and storage (local & S3)
- Basic UI pages

🚧 **In Progress:**
- Email template builder
- Campaign scheduler
- Unsubscribe handling

## Notes

This app was extracted from the SMTP app to provide dedicated newsletter management functionality. The SMTP app now focuses solely on email configuration.
