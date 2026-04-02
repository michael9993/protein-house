# Bulk Manager

## Overview

Bulk Manager is a comprehensive CSV/Excel import, export, and delete tool for managing Saleor store data at scale. It supports 7 entity types with intelligent field mapping, validation, and bulk operations.

**Container:** `aura-bulk-manager-app-dev` | **Port:** 3007

## Quick Start

```bash
# Start development server
docker exec -it aura-bulk-manager-app-dev pnpm dev

# Build for production
docker exec -it aura-bulk-manager-app-dev pnpm build

# Type check
docker exec -it aura-bulk-manager-app-dev pnpm type-check
```

Access at: http://localhost:3007

## Key Features

- **7 Entity Types:** Products, Categories, Collections, Customers, Orders, Vouchers, Gift Cards
- **Smart Import:** CSV parsing with auto-detect field mapping and column matching
- **Excel Export:** Formatted XLSX generation with proper data types
- **Bulk Delete:** Mass deletion with confirmation dialogs and progress tracking
- **Dynamic Templates:** Download entity-specific CSV templates with sample data
- **Advanced Product Import:**
  - Multi-image support (up to 5 images via imageUrl1-5 columns)
  - Generic attributes (attr:AttributeName / variantAttr:AttributeName)
  - Multi-warehouse stock management (stock:WarehouseName)
  - SEO fields, collections, tax class, metadata
  - Upsert mode (update existing products by slug/SKU)
- **Category Management:** Topological parent sorting, SEO, metadata
- **Collection Management:** Product assignment by slug/SKU, channel publishing
- **Customer Management:** Shipping + billing addresses with auto-creation, language, metadata
- **Voucher Management:** Channel listings, catalogue assignment (categories/collections/products)
- **Gift Card Management:** Balance, tags, expiry, channel currency resolution
- **CSV Conventions:**
  - Semicolons (`;`) for multi-value fields
  - `key:value` pairs for metadata
  - Column prefixes: `attr:`, `variantAttr:`, `stock:`

## File Structure

```
src/
├── modules/
│   ├── trpc/
│   │   └── routers/
│   │       ├── products-router.ts       # Product import/export/delete
│   │       ├── categories-router.ts     # Category operations
│   │       ├── collections-router.ts    # Collection operations
│   │       ├── customers-router.ts      # Customer operations
│   │       ├── orders-router.ts         # Order operations + bulk cancel
│   │       ├── vouchers-router.ts       # Voucher operations
│   │       ├── gift-cards-router.ts     # Gift card operations
│   │       └── shared.ts                # Shared utilities
│   ├── import/
│   │   ├── field-mapper.ts              # Auto-detect field mapping
│   │   └── handlers/                    # Entity-specific handlers
│   └── export/
│       └── excel-generator.ts           # XLSX generation
├── pages/
│   ├── index.tsx                        # Entity selection dashboard
│   ├── products.tsx                     # Products page
│   ├── categories.tsx                   # Categories page
│   ├── collections.tsx                  # Collections page
│   ├── customers.tsx                    # Customers page
│   ├── orders.tsx                       # Orders page
│   ├── vouchers.tsx                     # Vouchers page
│   └── gift-cards.tsx                   # Gift cards page
└── components/
    ├── bulk-delete-tab.tsx              # Shared bulk delete UI
    └── generate-template.ts             # Dynamic CSV template generation
```

## Development

**Restart after changes:**
```bash
docker compose -f infra/docker-compose.dev.yml restart aura-bulk-manager-app-dev
```

**View logs:**
```bash
docker compose -f infra/docker-compose.dev.yml logs -f aura-bulk-manager-app-dev
```

**Required permissions:** MANAGE_PRODUCTS, MANAGE_ORDERS, MANAGE_USERS, MANAGE_DISCOUNTS, MANAGE_GIFT_CARD

## Related Docs

- PRD.md section 9.7 — Bulk Manager specifications
- AGENTS.md — Container restart rules and development patterns
- apps/.github/copilot-instructions.md — Apps architecture patterns
