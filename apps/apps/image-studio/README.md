# Image Studio

## Overview

AI-powered image editor with Fabric.js canvas, Saleor product integration, and advanced AI capabilities including background removal, upscaling, generation, and enhancement.

**Container:** `saleor-image-studio-app-dev` | **Port:** 3008

## Quick Start

```bash
# Start development server
docker exec -it saleor-image-studio-app-dev pnpm dev

# Build for production
docker exec -it saleor-image-studio-app-dev pnpm build

# Type check
docker exec -it saleor-image-studio-app-dev pnpm type-check
```

Access at: http://localhost:3008

**Prerequisites:** Requires AI service containers (rembg on port 7000, Real-ESRGAN on port 7001) and `GEMINI_API_KEY` environment variable for background generation.

## Key Features

- **Fabric.js v6 Canvas:**
  - Image, text, and shape objects with full manipulation
  - Undo/redo system (50-step history)
  - Zoom, pan, and object alignment
  - Export to PNG/JPEG with quality settings
- **Saleor Product Integration:**
  - Browse and search products with GraphQL
  - Edit product images directly
  - Save edited images back to Saleor via multipart upload
  - Auto-update product media
- **AI Background Removal:** Remove backgrounds using rembg service (port 7000)
- **AI Image Upscaling:** 2x/4x upscaling via Real-ESRGAN service (port 7001)
- **AI Background Generation:** Generate backgrounds using Google Gemini API
- **Image Enhancement:** Server-side Sharp processing
  - Brightness, contrast, saturation adjustments
  - Resize and crop
  - Format conversion (PNG/JPEG/WebP)
- **12 Built-in Templates:** Product showcase, social media, banners, lifestyle across 4 categories
- **Advanced Canvas Features:**
  - Layers panel with drag-to-reorder
  - Visibility toggle and object locking
  - Context menu (right-click)
  - Keyboard shortcuts (Ctrl+Z, Delete, etc.)
  - Auto-save to IndexedDB (draft recovery)

## File Structure

```
src/
├── components/
│   ├── editor/
│   │   ├── Canvas.tsx                   # Main Fabric.js canvas component
│   │   ├── Toolbar.tsx                  # Top toolbar with actions
│   │   ├── LayersPanel.tsx              # Layers panel with reordering
│   │   └── hooks/
│   │       ├── useCanvas.ts             # Canvas state and operations
│   │       ├── useHistory.ts            # Undo/redo management
│   │       ├── useKeyboardShortcuts.ts  # Keyboard event handlers
│   │       └── useAutoSave.ts           # IndexedDB auto-save
│   ├── ai/
│   │   ├── BackgroundRemoval.tsx        # rembg integration
│   │   ├── BackgroundGeneration.tsx     # Gemini API integration
│   │   ├── Enhance.tsx                  # Sharp enhancement panel
│   │   └── Upscale.tsx                  # Real-ESRGAN integration
│   ├── products/
│   │   ├── ProductBrowser.tsx           # Saleor product search
│   │   └── ProductImageEditor.tsx       # Product image editing UI
│   └── templates/
│       └── TemplateGallery.tsx          # Template browser and loader
├── modules/
│   ├── trpc/
│   │   └── routers/
│   │       ├── ai.ts                    # AI service endpoints
│   │       ├── products.ts              # Saleor product queries
│   │       ├── media.ts                 # Media upload/management
│   │       └── enhance.ts               # Sharp enhancement
│   └── templates/
│       ├── types.ts                     # Template type definitions
│       └── built-in.ts                  # 12 built-in templates
└── pages/
    ├── index.tsx                        # Main editor page
    └── products.tsx                     # Product image editor page
```

## Development

**Key Dependencies:**
- Fabric.js v6 — Canvas rendering and object manipulation
- Sharp — Server-side image processing
- idb-keyval — IndexedDB for auto-save
- react-colorful — Color picker
- shadcn/ui + Tailwind — UI components

**Restart after changes:**
```bash
docker compose -f infra/docker-compose.dev.yml restart saleor-image-studio-app-dev
```

**View logs:**
```bash
docker compose -f infra/docker-compose.dev.yml logs -f saleor-image-studio-app-dev
```

**AI Services Setup:**
```bash
# Start rembg (background removal)
docker compose -f infra/docker-compose.dev.yml up -d rembg

# Start Real-ESRGAN (upscaling)
docker compose -f infra/docker-compose.dev.yml up -d esrgan
```

## Related Docs

- PRD.md section 9.9 — Image Studio specifications
- AGENTS.md — Container restart rules and development patterns
- apps/.github/copilot-instructions.md — Apps architecture patterns
