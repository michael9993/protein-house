# Saleor Platform Documentation

Welcome to the Saleor Platform documentation. This directory contains guides and references for setting up, configuring, and using the Saleor e-commerce platform.

## 📚 Documentation Index

### Getting Started
- [Platform Setup](../infra/README.md) - Docker-based development environment setup

### Content Management
- **[Content Modeling Guide](./SALEOR_CONTENT_MODELING.md)** - Complete guide to managing storefront content through the Dashboard
  - Collections & Homepage sections
  - Navigation menus
  - CMS Pages
  - Categories & Attributes
  - Metadata usage
  - GraphQL queries reference
- **[CMS Testing Guide](./CMS_TESTING_GUIDE.md)** - Step-by-step browser testing instructions
  - Test categories, hero banner, testimonials, brands
  - Troubleshooting common issues
  - Browser DevTools testing
- **[Adding CMS Features](./ADDING_CMS_FEATURES.md)** - Guide for adding new Dashboard-controlled content
  - Patterns and best practices
  - Code examples
  - Reusable templates
- **[CMS Quick Test](./CMS_QUICK_TEST.md)** - 5-minute quick test checklist
- **[Newsletter Example](./CMS_EXAMPLE_NEWSLETTER.md)** - Complete practical example

### Configuration
- [Store Configuration](../storefront/src/config/README.md) - Storefront theming and branding
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - All configuration options

### Development
- [Storefront Development](../storefront/README.md) - Next.js storefront guide
- [Dashboard Development](../dashboard/README.md) - Dashboard customization
- [Apps Development](../apps/README.md) - Saleor apps (Stripe, SMTP, Invoices)

---

## Quick Links

| Resource | Description | URL |
|----------|-------------|-----|
| Dashboard | Admin interface | `http://localhost:9000` |
| Storefront | Customer-facing store | `http://localhost:3000` |
| GraphQL Playground | API explorer | `http://localhost:8000/graphql/` |
| Stripe App | Payment processing | `http://localhost:3002` |
| SMTP App | Email notifications | `http://localhost:3001` |
| Invoices App | PDF invoice generation | `http://localhost:3003` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      SALEOR PLATFORM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Saleor     │  │   Saleor     │  │  Next.js     │          │
│  │   API Core   │  │  Dashboard   │  │  Storefront  │          │
│  │  (Django)    │  │   (React)    │  │              │          │
│  │  Port: 8000  │  │  Port: 9000  │  │  Port: 3000  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    GraphQL API                                  │
│                           │                                     │
│  ┌──────────────┐  ┌──────┴───────┐  ┌──────────────┐          │
│  │  Stripe App  │  │  SMTP App    │  │ Invoices App │          │
│  │  (Payments)  │  │  (Email)     │  │  (PDFs)      │          │
│  │  Port: 3002  │  │  Port: 3001  │  │  Port: 3003  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Infrastructure                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │   Celery     │          │
│  │  (Database)  │  │   (Cache)    │  │  (Tasks)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Content Management Flow

```
Dashboard                          Storefront
┌─────────────────┐               ┌─────────────────┐
│                 │               │                 │
│  Create/Edit    │   GraphQL    │   Display       │
│  Content        │──────────────▶│   Content       │
│                 │               │                 │
├─────────────────┤               ├─────────────────┤
│ • Products      │               │ • Product Pages │
│ • Categories    │               │ • Category View │
│ • Collections   │               │ • Homepage      │
│ • Pages (CMS)   │               │ • Static Pages  │
│ • Menus         │               │ • Navigation    │
│ • Attributes    │               │ • Filters       │
└─────────────────┘               └─────────────────┘
```

---

## Common Tasks

### Add products to homepage
1. Dashboard → Catalog → Collections
2. Open/Create `featured-products` collection
3. Click "Assign Products"
4. Select products → Save

### Create navigation menu
1. Dashboard → Content → Navigation
2. Create menu with slug `navbar`
3. Add items (categories, collections, pages)
4. Save and publish

### Create a new page
1. Dashboard → Content → Pages
2. Click "Create Page"
3. Set title, slug, content
4. Toggle "Published" → Save

### Add a product filter
1. Dashboard → Configuration → Attributes
2. Create attribute (e.g., "Size")
3. Enable "Filterable in Storefront"
4. Assign to Product Type
5. Add values to products

---

## Support

- **Saleor Documentation**: https://docs.saleor.io
- **GitHub Issues**: Report bugs or request features
- **Community Discord**: https://discord.gg/saleor

---

*Documentation maintained by the development team*

