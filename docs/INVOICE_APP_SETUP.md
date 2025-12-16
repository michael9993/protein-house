# Invoice App Setup Guide

## Overview

The Invoice App generates PDF invoices for orders when `INVOICE_REQUESTED` webhook is triggered. It works alongside the SMTP app:

- **Invoice App**: Generates PDF invoices
- **SMTP App**: Sends invoice emails to customers

## Prerequisites

1. The `apps` repository should be cloned in the parent directory:

   ```powershell
   cd ..
   git clone https://github.com/saleor/apps.git
   ```

2. The invoice app is located at `apps/apps/invoices/`

## Step 1: Add Environment Variables

Add to your `infra/.env` file:

```env
# Invoice App
INVOICE_APP_PORT=3003
```

## Step 2: Start the Invoice App

The invoice app has been added to `infra/docker-compose.dev.yml`. To start it:

```powershell
cd infra
docker-compose -f docker-compose.dev.yml up -d saleor-invoice-app
```

Verify it's running:

```powershell
docker-compose -f docker-compose.dev.yml logs saleor-invoice-app
```

The app will be available at `http://localhost:3003`

## Step 3: Create Tunnel (Optional but Recommended)

If you need external access for webhook testing:

```powershell
cd infra
.\scripts\tunnel-invoice.ps1
```

This will create a Cloudflare tunnel and display the URL. Add it to your `.env`:

```env
INVOICE_APP_TUNNEL_URL=https://your-invoice-app-tunnel.trycloudflare.com
```

Then run the update script:

```powershell
.\update-urls-from-tunnels.ps1
```

## Step 4: Install Invoice App in Saleor Dashboard

1. **Get the manifest URL:**

   - Local: `http://localhost:3003/api/manifest`
   - Or use your tunnel URL: `https://your-tunnel-url.trycloudflare.com/api/manifest`

2. **Install the app:**
   - Go to Dashboard → Apps
   - Click "Install external app"
   - Paste the manifest URL
   - The app will register the `INVOICE_REQUESTED` webhook

## Step 5: Test Invoice Generation

1. Go to Dashboard → Orders
2. Open an order
3. Click "Request Invoice" button
4. The invoice app will:
   - Receive the `INVOICE_REQUESTED` webhook
   - Generate a PDF invoice
   - Update the invoice with the PDF URL
5. The invoice will appear in the order with a download link

## How It Works

1. **Staff requests invoice** → Saleor triggers `INVOICE_REQUESTED` webhook
2. **Invoice app receives webhook** → Generates PDF using order data
3. **PDF is stored** → Temporarily stored in memory (in production, use S3 or similar)
4. **Invoice is updated** → Saleor invoice record is updated with PDF URL
5. **Invoice is ready** → Staff can download or send the invoice via email

## Troubleshooting

### "No app or plugin is configured to handle invoice requests"

- Make sure the invoice app is installed in the Dashboard
- Check that the webhook is registered: Dashboard → Apps → Invoice App → Webhooks
- Verify the app is running: `docker-compose logs saleor-invoice-app`

### PDF not generating

- Check app logs: `docker-compose logs saleor-invoice-app`
- Verify the webhook is being received
- Check that order data is complete (billing address, order lines, etc.)

### Invoice URL not updating

- Verify the app has `MANAGE_ORDERS` permission
- Check GraphQL mutation errors in app logs
- Ensure the invoice ID matches the webhook payload

## Production Considerations

For production, you should:

1. **Use proper file storage** (S3, Azure Blob, etc.) instead of in-memory storage
2. **Add authentication** to the PDF download endpoint
3. **Implement retry logic** for failed invoice generations
4. **Add monitoring** and alerting for invoice generation failures
5. **Customize PDF template** to match your brand

## Next Steps

After setting up the invoice app:

1. Configure the SMTP app to send invoice emails (see `FULFILLMENT_EMAIL_SETUP.md`)
2. Customize the PDF template in `src/lib/generate-invoice-pdf.ts`
3. Add your company logo and branding
4. Test the full flow: Request invoice → Generate PDF → Send email
