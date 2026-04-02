---
description:
alwaysApply: true
---

# Dashboard

React 18 + Vite + TypeScript admin dashboard. All commands run inside Docker.

## Commands

```bash
docker exec -it aura-dashboard-dev pnpm dev            # Start dev server (port 9000)
docker exec -it aura-dashboard-dev pnpm build           # Production build
docker exec -it aura-dashboard-dev pnpm generate        # Regenerate GraphQL types
docker exec -it aura-dashboard-dev pnpm check-types     # TypeScript type check
docker exec -it aura-dashboard-dev pnpm lint            # ESLint + Prettier
docker exec -it aura-dashboard-dev pnpm test            # Jest unit tests
docker exec -it aura-dashboard-dev pnpm test:watch      # Watch mode
docker exec -it aura-dashboard-dev pnpm e2e             # Playwright E2E tests
```

## Directory Structure

```
src/
├── App.tsx                  # Root app component
├── index.tsx                # Entry point
├── index.css                # Tailwind @theme + global styles
├── components/              # Shared UI components (100+)
│   ├── Table/               # Custom HTML table primitives (6 components)
│   ├── TableCellHeader/     # Sortable column header
│   ├── TableRowLink/        # Clickable row with Link wrapper
│   ├── AppLayout/           # Main layout shell
│   └── ...
├── <domain>/                # Feature modules (20+)
│   ├── attributes/          # Attribute management
│   ├── categories/          # Category management
│   ├── channels/            # Channel management
│   ├── customers/           # Customer management
│   ├── discounts/           # Vouchers & sales
│   ├── orders/              # Order management
│   ├── products/            # Product management
│   └── ...
├── graphql/                 # Generated types (main + staging schemas)
├── hooks/                   # Custom React hooks
├── icons/                   # Custom SVG icons
├── utils/                   # Shared utilities
│   ├── cn.ts                # clsx + twMerge class merger
│   ├── urls.ts              # withQs() utility for query strings
│   └── ...
└── macaw-ui/                # macaw-ui-next integration
```

## D6 Modernization Architecture

Migrated from MUI v5 to Tailwind CSS v4 + macaw-ui-next.

### Styling Stack
- **Tailwind CSS v4** with `@theme` overrides in `src/index.css`
- **macaw-ui-next** components (Input, Text, Divider, RadioGroup, etc.)
- **Lucide React** icons (replaced @mui/icons-material)
- **`cn()`** utility in `src/utils/cn.ts` for class merging

### Critical: Font Size Compatibility
macaw-ui sets `html { font-size: 50.782% }` making **1rem = ~8px**. Tailwind `@theme` overrides compensate:
- `--spacing: 4px` (so `p-4` = 16px, not 32px)
- All `--text-*` variables use **px values** (not rem)
- Always check `src/index.css` before adding font-size or spacing tokens

### Custom Table Components (`src/components/Table/`)
- `Table`, `TableHead`, `TableBody`, `TableFooter`, `TableRow`, `TableCell` — native HTML `<table>` wrappers
- `TableSectionContext` for automatic `<th>` vs `<td>` rendering
- `TableCellHeader` — sortable with ArrowSort icon (24x24px, `w-6 h-6`)
- `TableRowLink` — `<Link style={{ all: "inherit", display: "contents" }}>` (inline style required — Tailwind class combo breaks due to CSS generation order)

### URL Pattern
- `withQs(path, params)` in `src/utils/urls.ts` — prevents trailing `?` (React Router v7 rejects `?` in pathname)
- All 26 URL files use `withQs`
- `stringifyQs()` still used for iframe URLs in extensions

### Routing
- React Router v7 with **relative paths** (all nested routes converted from absolute)
- Feature module routes in `<domain>/urls.ts`

## GraphQL

Two schemas (main + staging). After schema changes:
```bash
docker exec -it aura-api-dev python manage.py build_schema
docker exec -it aura-dashboard-dev pnpm generate
```

## Code Style

- TypeScript strict, avoid `any`
- Functional components + hooks
- Named exports preferred
- Import sorting via `simple-import-sort` ESLint rule
- Prettier formatting
- Prefer `React.FC` only if existing file uses it; otherwise plain function components

## Gotchas

- **1rem = ~8px** — macaw-ui root font-size override. Never use rem for dashboard spacing/fonts without checking the effective size
- **TableRowLink inline style** — Must use `style={{ all: "inherit", display: "contents" }}`, NOT Tailwind classes (CSS generation order issue)
- **withQs required** — React Router v7 rejects trailing `?` in pathnames. Always use `withQs(path, params)` instead of manual query string building
- **~140 files still import MUI** — These are active macaw-ui-next dependencies, not migration leftovers. Future D7+ phases will address them
- **HMR unreliable** — Always restart `aura-dashboard-dev` after changes on Windows

## Testing

- **Jest** for unit tests (colocated with source files)
- **Playwright** for E2E tests
- Import sorting enforced by `simple-import-sort` ESLint rule
