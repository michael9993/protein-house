# Saleor Invoice App

Generates PDF invoices for orders when `INVOICE_REQUESTED` webhook is triggered.

## Features

- Listens to `INVOICE_REQUESTED` webhook events
- Generates PDF invoices using order data
- Updates invoice in Saleor with PDF URL

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Fetch GraphQL schema:
```bash
pnpm run fetch-schema
```

3. Generate GraphQL types:
```bash
pnpm run generate
```

4. Start development server:
```bash
pnpm dev
```

## Installation in Saleor

1. Go to Dashboard → Apps
2. Click "Install external app"
3. Provide manifest URL: `http://localhost:3003/api/manifest` (or tunnel URL)
4. The app will register the `INVOICE_REQUESTED` webhook

## How It Works

1. Staff requests invoice for an order
2. Saleor triggers `INVOICE_REQUESTED` webhook
3. App receives webhook and generates PDF
4. App updates invoice with PDF URL
5. Invoice is ready to be sent to customer

