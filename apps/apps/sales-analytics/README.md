# Sales Analytics App

Professional sales analytics dashboard for Saleor with KPIs, charts, and multi-channel insights.

## Features

- **Key Performance Indicators (KPIs)**
  - Gross Revenue (GMV)
  - Total Orders
  - Average Order Value (AOV)
  - Items Sold
  - Unique Customers
  - Trend indicators comparing to previous period

- **Visualizations**
  - Revenue over time (Area Chart)
  - Top products by revenue (Bar List)
  - Sales by category (Donut Chart)
  - Recent orders table

- **Filters**
  - Time range presets (Today, Last 7 days, Last 30 days, etc.)
  - Custom date range picker
  - Channel filter (all channels or specific channel)

- **Dashboard Integration**
  - Main dashboard via `NAVIGATION_ORDERS` extension (APP_PAGE target)
  - Order details widget via `ORDER_DETAILS_WIDGETS` extension (WIDGET target)

## Requirements

- Saleor version: `>=3.22 <4` (required for WIDGET extension support)
- Permissions: `MANAGE_ORDERS`, `MANAGE_PRODUCTS`

## Installation

### 1. Install Dependencies

```bash
cd apps/sales-analytics
pnpm install
```

### 2. Generate GraphQL Types

```bash
pnpm generate
```

### 3. Environment Variables

Add to `infra/.env`:

```bash
SALES_ANALYTICS_APP_PORT=3006
SALES_ANALYTICS_APP_URL=http://localhost:3006
# Tunnel URL will be set by platform.ps1
SALES_ANALYTICS_APP_TUNNEL_URL=https://your-tunnel.trycloudflare.com
```

### 4. Docker Integration

The app is already configured in `infra/docker-compose.dev.yml`. Start with:

```bash
docker compose -f infra/docker-compose.dev.yml up -d aura-sales-analytics-app
```

### 5. Install in Dashboard

Use the installation script:

```powershell
.\infra\platform.ps1 install-apps
```

Or manually:
1. Go to Dashboard → Extensions → Apps
2. Click "Install App"
3. Enter the manifest URL: `https://your-tunnel.trycloudflare.com/api/manifest`
4. Complete the installation

## Development

### Start Dev Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000` (or port specified in Docker).

### Run Tests

```bash
pnpm test
```

### Build for Production

```bash
pnpm build
pnpm start
```

## Architecture

### Tech Stack

- **Next.js** (Pages Router) - Framework
- **tRPC** - Type-safe API layer
- **urql** - GraphQL client
- **Tremor** - Analytics UI components
- **Macaw UI** - App shell components
- **Tailwind CSS** - Styling
- **neverthrow** - Result-based error handling
- **Zod** - Schema validation
- **date-fns** - Date manipulation

### Project Structure

```
apps/sales-analytics/
├── graphql/              # GraphQL queries and fragments
├── generated/             # Generated GraphQL types
├── src/
│   ├── modules/
│   │   ├── analytics/    # Domain logic, calculators
│   │   ├── graphql/       # GraphQL provider
│   │   ├── trpc/          # tRPC router and procedures
│   │   └── ui/            # Tremor UI components
│   ├── pages/             # Next.js pages
│   │   ├── api/           # API routes (manifest, register, tRPC)
│   │   └── widget/        # Widget pages
│   └── styles/            # Global CSS
└── public/                # Static assets
```

### Key Files

- `src/pages/api/manifest.ts` - App manifest with extensions
- `src/modules/trpc/router.ts` - tRPC API endpoints
- `src/modules/analytics/domain/analytics-calculator.ts` - KPI calculations
- `src/pages/index.tsx` - Main dashboard page

## Usage

### Accessing the Dashboard

1. Open Saleor Dashboard
2. Navigate to Orders → Sales Analytics (in sidebar)
3. The full dashboard opens in an APP_PAGE iframe

### Using Filters

- **Time Range**: Click preset buttons or use the date picker
- **Channel**: Select a channel from the dropdown (defaults to "All Channels")

### Viewing Order Analytics

1. Open any order in the Dashboard
2. Scroll to the "Order Analytics" widget
3. View order-specific metrics (when implemented)

## Troubleshooting

### "Missing auth data" Error

1. Ensure the app installation status is ACTIVE (not PENDING)
2. Open the app in the dashboard at least once to trigger token exchange
3. Verify the app is accessible at its tunnel URL

### No Data Showing

1. Verify you have orders in the selected time range
2. Check that the selected channel has orders
3. Ensure `MANAGE_ORDERS` permission is granted

### GraphQL Errors

1. Run `pnpm generate` to regenerate GraphQL types
2. Verify the Saleor API is accessible
3. Check that the app token is valid

## License

Part of the Saleor Platform monorepo.
