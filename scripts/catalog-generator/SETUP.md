# Catalog Generator & Store Infrastructure Setup

Manages Mansour Shoes store infrastructure (product types, attributes, warehouses, shipping zones) as code via `@saleor/configurator`, plus generates product catalog Excel/CSV files for Bulk Manager import.

## Prerequisites

- Node.js >= 22.0.0
- A running Saleor instance (local Docker or remote)
- An API token with full permissions (Dashboard > Extensions > Add Extension)

## Quick Start

```bash
cd scripts/catalog-generator
cp .env.example .env          # Edit with your SALEOR_URL and SALEOR_TOKEN
npm install                    # Installs deps + auto-applies patches
npm run setup                  # deploy + translate + generate (full pipeline)
```

Then upload the generated files via Bulk Manager (Dashboard > Apps > Bulk Manager):
1. **Categories** tab > Import > `output/categories.csv`
2. **Collections** tab > Import > `output/collections.csv`
3. **Products** tab > Import > `output/mansour-catalog-100products.xlsx`

## Commands

| Command | What It Does |
|---------|-------------|
| `npm run setup` | Full pipeline: deploy + translate + generate |
| `npm run deploy` | Apply `config.yml` to Saleor (interactive confirmation) |
| `npm run deploy:ci` | Apply `config.yml` to Saleor (no confirmation, for CI/CD) |
| `npm run diff` | Preview what would change (dry run) |
| `npm run introspect` | Pull current Saleor state into `config.yml` |
| `npm run translate` | Add Hebrew translations to categories/collections |
| `npm run generate` | Generate product Excel + CSV files |

## What Each Step Does

### `deploy` — Infrastructure as Code

Reads `config.yml` and ensures the Saleor instance has the correct:

- **Channels**: `ils` (ILS/Israel) + `usd` (USD/International)
- **Product Types**: Shoes, Tops, Bottoms, Accessories
- **Attributes**: Brand (SINGLE_REFERENCE to brand page models), Gender, Material, Style, Apparel Type, Shoe size, Apparel Size, Color — with all predefined values
- **Warehouses**: Main Warehouse (Sakhnin, IL) + International Warehouse (New York, US)
- **Shipping Zones**: Israel Domestic (Standard/Express/Free) + International (Standard/Express/Free)
- **Shop Settings**: Store name, tax inclusion

The Configurator is **idempotent** — running deploy multiple times is safe. It compares local YAML with remote state and only applies differences.

### `translate` — Hebrew Translations

Reads bilingual data from `src/config/categories.ts` and `src/config/collections.ts` (which have `name_he`, `description_he` fields), fetches entities from Saleor by slug, and calls `categoryTranslate` / `collectionTranslate` mutations for the Hebrew language code.

### `generate` — Product Catalog Files

Generates three files in `output/`:
- `mansour-catalog-100products.xlsx` — 100 products with variants, pricing, stock, images, attributes
- `categories.csv` — Category hierarchy for Bulk Manager
- `collections.csv` — Collections for Bulk Manager

Excel column headers match Bulk Manager conventions: `attr:Brand`, `variantAttr:Shoe size`, `stock:Main Warehouse`, etc.

## File Structure

```
scripts/catalog-generator/
├── config.yml                    # Store infrastructure YAML (source of truth)
├── .env                          # SALEOR_URL + SALEOR_TOKEN (gitignored)
├── .env.example                  # Credential template
├── package.json                  # Scripts + dependencies
├── patches/
│   └── @saleor+configurator+1.1.0.patch  # Patches for SINGLE_REFERENCE + shipping fix
├── src/
│   ├── run-configurator.ts       # Cross-platform Configurator CLI wrapper
│   ├── add-translations.ts       # Hebrew translation script
│   ├── excel-generator.ts        # Product Excel/CSV generator
│   ├── csv-generator.ts          # Standalone CSV generator
│   ├── config/
│   │   ├── products.ts           # 100 product definitions (7 brands x ~14 products)
│   │   ├── additional-products.ts# Extra product definitions
│   │   ├── categories.ts         # 35+ bilingual categories with hierarchy
│   │   ├── collections.ts        # 18 bilingual collections
│   │   └── images.ts             # Product image URLs
│   └── generators/
│       ├── descriptions.ts       # Product description templates
│       ├── pricing.ts            # ILS/USD price + discount logic
│       └── stock.ts              # Multi-warehouse stock distribution
└── output/                       # Generated files (gitignored)
```

## Common Scenarios

### Full reset after DB wipe
```bash
npm run setup
# Upload output files via Bulk Manager UI
```

### Added a new product type or attribute
Edit `config.yml`, then:
```bash
npm run diff          # Preview changes
npm run deploy:ci     # Apply
```

### Added new categories or collections
Add to `src/config/categories.ts` / `src/config/collections.ts`, then:
```bash
npm run translate     # Apply Hebrew translations
npm run generate      # Regenerate CSVs
```

### Changed products, pricing, or stock
Edit files in `src/config/` or `src/generators/`, then:
```bash
npm run generate
```

### Migrating to a new server
```bash
cp .env.example .env  # Edit with new SALEOR_URL + SALEOR_TOKEN
npm run setup
# Upload output files via Bulk Manager UI
```

### Capture current live state
```bash
npm run introspect    # Overwrites config.yml with what's in Saleor
```

## Patches

`@saleor/configurator` v1.1.0 has two bugs we patch via `patch-package` (auto-applied on `npm install`):

1. **SINGLE_REFERENCE / MULTI_REFERENCE** — The Configurator doesn't support these attribute types (added in Saleor 3.21+). Our patch adds support for reading, diffing, and deploying these types.
2. **Shipping zone minimumOrderPrice** — The Configurator sends `{amount, currency}` objects but Saleor expects `PositiveDecimal` strings. Our patch fixes all three code paths.

If upgrading `@saleor/configurator`, check if these are fixed upstream and remove the patch if so.

## Config YAML Reference

The `config.yml` follows the `@saleor/configurator` schema. Key patterns:

```yaml
# Inline attribute definition (created + assigned to product type)
productTypes:
  - name: "Shoes"
    productAttributes:
      - name: "Brand"
        inputType: SINGLE_REFERENCE    # References brand page models
        entityType: PAGE
      - name: "Gender"
        inputType: DROPDOWN
        values:
          - name: Men
          - name: Women

# Warehouse with shipping zone linkage
warehouses:
  - name: "Main Warehouse"
    slug: main-warehouse
    address:
      streetAddress1: "Industrial Zone"
      city: "Sakhnin"
      countryArea: "North District"     # Required field
      postalCode: "20173"
      country: IL
    shippingZones:
      - "Israel Domestic"

# Shipping methods with channel-specific pricing
shippingZones:
  - name: "Israel Domestic"
    countries: [IL]
    channels: [ils]
    shippingMethods:
      - name: "Free Shipping"
        type: PRICE
        channelListings:
          - channel: ils
            price: 0
            minimumOrderPrice: 299      # Free above 299 ILS
```

## Relationship to Other Tools

| Tool | Role | Where |
|------|------|-------|
| **Catalog Generator** (this) | Creates infrastructure + generates import files | `scripts/catalog-generator/` |
| **Bulk Manager** | Imports the generated files into Saleor | Dashboard > Apps > Bulk Manager |
| **Storefront Control** | Configures storefront UI/UX (separate CMS system) | Dashboard > Apps > Storefront Control |
| **Saleor Dashboard** | Manual store management | http://localhost:9000 |
