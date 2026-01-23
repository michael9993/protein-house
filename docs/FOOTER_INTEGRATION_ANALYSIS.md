# Footer Integration Analysis

## Overview

This document analyzes the footer integration between **storefront-control**, **Saleor Dashboard**, and the **storefront** to establish clear separation of concerns and channel-specific functionality.

## Architecture

### Separation of Concerns

#### 1. **Storefront-Control** (Visibility & Structure)
**Responsibility**: Controls **WHAT** sections to display in the footer
- `showNewsletter` - Toggle newsletter signup section
- `showSocialLinks` - Toggle social media icons
- `showContactInfo` - Toggle contact information section
- `copyrightText` - Custom copyright text (optional)

**Location**: `apps/apps/storefront-control/src/pages/[channelSlug]/footer.tsx`
**Storage**: Saved in Saleor app metadata per channel

#### 2. **Saleor Dashboard** (Content & Navigation)
**Responsibility**: Manages **CONTENT**, **TRANSLATIONS**, and **PATHS** for footer menus
- Menu items (categories, collections, pages, custom URLs)
- Menu item names (translated via dashboard)
- Menu structure and hierarchy
- Navigation paths

**Location**: Dashboard → Navigation → Menus
**Storage**: Saleor database (Menu model)

#### 3. **Storefront** (Rendering)
**Responsibility**: Renders footer based on configuration from both sources
- Fetches menu content from GraphQL (dashboard-managed)
- Reads visibility settings from storefront-control config
- Combines both to render the final footer

**Location**: `storefront/src/ui/components/Footer.tsx` & `FooterClient.tsx`

## Channel-Specific Implementation

### Menu Slug Pattern

The footer uses **channel-specific menu slugs** to support different menu structures per channel:

```
Pattern: footer-{channelSlug}
Examples:
  - Channel "ils" → Menu slug: "footer-ils"
  - Channel "usd" → Menu slug: "footer-usd"
  - Channel "default-channel" → Menu slug: "footer-default-channel"
```

### Implementation Flow

1. **Storefront Footer Component** (`Footer.tsx`):
   ```typescript
   // Tries channel-specific menu first
   const channelSpecificSlug = `footer-${channel}`;
   let footerLinks = await executeGraphQL(MenuGetBySlugDocument, {
     variables: { slug: channelSpecificSlug, channel },
   });
   
   // Falls back to generic "footer" menu if channel-specific doesn't exist
   if (!footerLinks.menu?.items?.length) {
     footerLinks = await executeGraphQL(MenuGetBySlugDocument, {
       variables: { slug: "footer", channel },
     });
   }
   ```

2. **Storefront-Control Config** (per channel):
   - Each channel has its own footer visibility settings
   - Stored in: `storefront-config-v1-{channelSlug}` metadata
   - Accessed via: `/api/config/{channelSlug}`

3. **Dashboard Menu Management**:
   - Create menus with slug: `footer-{channelSlug}` for each channel
   - Menu items support translations via dashboard
   - Menu structure (parent/child) managed in dashboard

## Current Implementation Status

### ✅ Completed

1. **Channel-Specific Menu Fetching**
   - Footer.tsx already implements `footer-{channel}` pattern
   - Falls back gracefully to generic "footer" menu

2. **Storefront-Control Visibility Control**
   - Footer schema includes: `showNewsletter`, `showSocialLinks`, `showContactInfo`
   - FooterClient.tsx respects these flags
   - Newsletter section added with GraphQL mutation

3. **Dashboard Menu Content Management**
   - Menus are created/edited in Dashboard → Navigation
   - Menu items support categories, collections, pages, and custom URLs
   - Translations handled via dashboard's translation system

4. **SMTP App Branding Integration**
   - All email templates now fetch branding from storefront-control
   - Dynamic branding per channel
   - Template variables replaced with actual branding values

### ⚠️ Issues Identified

1. **Dropdown Selection Bug** (FilterPresetsSelect)
   - Issue: Selected preset value not visually indicated
   - Location: `dashboard/src/components/FilterPresetsSelect/FilterPresetsSelect.tsx`
   - Status: Needs investigation

2. **Menu Creation Documentation**
   - Need to document that menus should be created with `footer-{channelSlug}` naming
   - Dashboard UI doesn't enforce this pattern

## Data Flow Diagram

```
┌─────────────────────┐
│  Storefront-Control │
│  (Per Channel)      │
│                     │
│  - showNewsletter   │
│  - showSocialLinks  │
│  - showContactInfo  │
│  - copyrightText    │
└──────────┬──────────┘
           │
           │ Config API
           │ /api/config/{channel}
           │
           ▼
┌─────────────────────┐
│   Storefront        │
│   Footer Component  │
│                     │
│   1. Fetch config   │
│   2. Fetch menu     │
│   3. Render         │
└──────────┬──────────┘
           │
           │ GraphQL Query
           │ menu(slug: "footer-{channel}")
           │
           ▼
┌─────────────────────┐
│  Saleor Dashboard   │
│  Menu Management    │
│                     │
│  - Menu items       │
│  - Translations    │
│  - Paths/URLs       │
│  - Structure        │
└─────────────────────┘
```

## How to Use

### Setting Up Channel-Specific Footer

1. **In Dashboard**:
   - Navigate to: Navigation → Menus
   - Create a new menu with slug: `footer-ils` (for "ils" channel)
   - Add menu items (categories, pages, etc.)
   - Set translations for menu item names

2. **In Storefront-Control**:
   - Navigate to: Footer tab for the channel
   - Toggle sections: Newsletter, Social Links, Contact Info
   - Set custom copyright text if needed

3. **Result**:
   - Storefront automatically uses `footer-ils` menu for "ils" channel
   - Only sections enabled in storefront-control are displayed
   - Menu content comes from dashboard with proper translations

### Fallback Behavior

- If `footer-{channel}` menu doesn't exist → Falls back to `footer` menu
- If storefront-control config unavailable → Uses default visibility (all sections shown)
- If menu has no items → Footer still renders with other sections (newsletter, contact, etc.)

## Benefits

✅ **Separation of Concerns**: Clear boundaries between visibility (storefront-control) and content (dashboard)
✅ **Channel Flexibility**: Each channel can have different menu structure
✅ **Translation Support**: Menu names translated via dashboard's translation system
✅ **Centralized Control**: Footer visibility managed in one place (storefront-control)
✅ **Content Management**: Menu content managed in familiar dashboard interface

## Files Modified

### Storefront
- `storefront/src/ui/components/Footer.tsx` - Channel-specific menu fetching
- `storefront/src/ui/components/FooterClient.tsx` - Newsletter section, visibility control

### Storefront-Control
- `apps/apps/storefront-control/src/pages/[channelSlug]/footer.tsx` - Visibility settings UI
- `apps/apps/storefront-control/src/modules/config/schema.ts` - Footer schema

### Dashboard
- No changes needed (uses existing menu management)

### SMTP App
- `apps/apps/smtp/src/modules/branding/branding-service.ts` - Branding fetching
- `apps/apps/smtp/src/modules/branding/template-branding-processor.ts` - Template processing
- All webhook handlers - Pass `saleorApiUrl` for branding
