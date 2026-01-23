# Footer Integration Architecture

## Overview

The footer integration follows a clear separation of concerns:
- **Storefront-Control**: Controls **visibility/structure** (which sections to show)
- **Dashboard**: Manages **content, translations, and paths** (menu items, labels, URLs)
- **Storefront**: Renders footer using both sources

## Architecture

### 1. Footer Menu Management (Dashboard)

**Location**: Dashboard → Navigation → Menus

**Channel-Specific Menus**:
- Each channel should have its own footer menu with slug: `footer-{channelSlug}`
- Example: For channel "ils", create menu with slug "footer-ils"
- Falls back to generic "footer" menu if channel-specific doesn't exist

**Menu Structure**:
- Menu items are managed in the Saleor Dashboard
- Supports categories, collections, pages, and custom URLs
- Translations are handled by Saleor's translation system
- Menu names and paths are set in the dashboard

### 2. Footer Visibility Control (Storefront-Control)

**Location**: Storefront-Control → Footer Settings

**Controls**:
- `showNewsletter` - Show/hide newsletter signup section
- `showSocialLinks` - Show/hide social media links
- `showContactInfo` - Show/hide contact information section
- `copyrightText` - Custom copyright text (optional)

**What Storefront-Control Does NOT Control**:
- ❌ Menu item names, URLs, or structure
- ❌ Footer text translations
- ❌ Menu content or paths
- ❌ Social media URLs (managed in Integrations)

### 3. Footer Rendering (Storefront)

**File**: `storefront/src/ui/components/Footer.tsx`

**Channel-Specific Menu Fetching**:
```typescript
// Tries "footer-{channel}" first, falls back to "footer"
const channelSpecificSlug = `footer-${channel}`;
```

**Sections Rendered**:
1. **Brand Column** - Logo, store name, tagline, social links (if enabled)
2. **Menu Links** - Dynamic menu items from dashboard (channel-specific)
3. **Newsletter** - If `showNewsletter` is true (content from CMS)
4. **Contact Info** - If `showContactInfo` is true (data from store config)

## Setup Instructions

### Step 1: Create Channel-Specific Footer Menu in Dashboard

1. Go to **Dashboard → Navigation → Menus**
2. Create a new menu with slug: `footer-{channelSlug}`
   - Example: For channel "ils", create menu with slug "footer-ils"
3. Add menu items (categories, collections, pages, or custom URLs)
4. Set menu item names (these will be translated if translations are available)
5. Organize items into parent/child structure as needed

### Step 2: Configure Footer Visibility in Storefront-Control

1. Go to **Storefront-Control → Footer**
2. Toggle sections:
   - ✅ Newsletter Signup
   - ✅ Social Media Links
   - ✅ Contact Information
3. Optionally set custom copyright text

### Step 3: Configure Content (Storefront-Control → Content)

Footer text comes from content configuration:
- Newsletter title/description/button text
- Footer link labels (track order, privacy policy, etc.)
- Contact section labels

## How It Works

### Menu Fetching Flow

```
Storefront Footer Component
  ↓
Fetches menu with slug "footer-{channel}"
  ↓
If not found, falls back to "footer"
  ↓
Renders menu items with names/URLs from dashboard
```

### Visibility Control Flow

```
Storefront-Control Footer Config
  ↓
Controls which sections to display
  ↓
Storefront checks footerConfig.showNewsletter, etc.
  ↓
Renders sections conditionally
```

### Content Sources

| Content Type | Source | Managed In |
|-------------|--------|------------|
| Menu Items | Dashboard | Dashboard → Navigation → Menus |
| Menu Names | Dashboard | Dashboard (with translations) |
| Menu URLs | Dashboard | Dashboard (category/collection/page slugs) |
| Section Visibility | Storefront-Control | Storefront-Control → Footer |
| Newsletter Text | Storefront-Control | Storefront-Control → Content |
| Footer Labels | Storefront-Control | Storefront-Control → Content |
| Social Links | Storefront-Control | Storefront-Control → Integrations |
| Contact Info | Storefront-Control | Storefront-Control → Store |

## Examples

### Example 1: Channel "ils" Footer

1. **Dashboard**: Create menu "footer-ils" with Hebrew menu items
2. **Storefront-Control**: Enable newsletter, social links, contact info
3. **Result**: Footer shows Hebrew menu items + enabled sections

### Example 2: Channel "usd" Footer

1. **Dashboard**: Create menu "footer-usd" with English menu items
2. **Storefront-Control**: Enable only newsletter
3. **Result**: Footer shows English menu items + newsletter only

## Troubleshooting

### Menu Not Showing

1. **Check menu slug**: Must be `footer-{channelSlug}` (e.g., "footer-ils")
2. **Check menu is published**: Menu must be active in dashboard
3. **Check channel**: Verify channel slug matches menu slug suffix
4. **Check fallback**: System falls back to "footer" if channel-specific not found

### Sections Not Showing

1. **Check Storefront-Control**: Verify section is enabled in footer settings
2. **Check content config**: Ensure content text is configured
3. **Check browser console**: Look for errors in footer rendering

### Dropdown Selection Not Working

Fixed in `FilterPresetsSelect.tsx` - the selection handler now properly checks for remove button clicks before allowing selection.

## Benefits

✅ **Separation of Concerns**: Content vs. visibility clearly separated  
✅ **Channel-Specific**: Each channel can have its own footer structure  
✅ **Translation Support**: Menu names use Saleor's translation system  
✅ **Flexible**: Easy to add/remove sections without code changes  
✅ **Consistent**: All channels use the same footer component with different configs
