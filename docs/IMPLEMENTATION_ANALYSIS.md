# Implementation Analysis

## Overview
This document provides a comprehensive analysis of the work completed for:
1. **SMTP App Branding Integration** with storefront-control
2. **Footer Integration** between dashboard, storefront-control, and storefront
3. **Dropdown Bug Fix** in dashboard

---

## 1. SMTP App Branding Integration ✅ COMPLETE

### What Was Implemented

#### **Branding Service** (`apps/apps/smtp/src/modules/branding/branding-service.ts`)
- **Purpose**: Fetches branding information (company name, email, colors, logo) from storefront-control app
- **Features**:
  - Fetches config from storefront-control API endpoint: `/api/config/[channelSlug]`
  - Supports Docker internal URLs (`saleor-storefront-control-app:3000`)
  - Supports environment variables (`STOREFRONT_CONTROL_URL`)
  - Graceful fallback to default branding if storefront-control is unavailable
  - 5-second timeout to prevent hanging requests

#### **Template Branding Processor** (`apps/apps/smtp/src/modules/branding/template-branding-processor.ts`)
- **Purpose**: Processes email templates to inject branding values
- **Features**:
  - Replaces template variables: `${PRIMARY_COLOR}`, `${COMPANY_NAME}`, `${COMPANY_EMAIL}`, etc.
  - Also replaces hardcoded default values if templates were saved with defaults
  - Replaces colors in MJML attributes (`background-color`, `style` attributes)
  - Comprehensive logging for debugging
  - Injects branding into Handlebars payload for future use

#### **Integration Points**
- **All 10 webhook handlers** updated to pass `saleorApiUrl`:
  - `order-created.ts`
  - `order-confirmed.ts`
  - `order-fulfilled.ts`
  - `order-fully-paid.ts`
  - `order-cancelled.ts`
  - `order-refunded.ts`
  - `invoice-sent.ts`
  - `gift-card-sent.ts`
  - `notify.ts`
  - `contact-submission-reply.ts`

- **Email Compilation Flow**:
  1. `sendEventMessages()` fetches branding from storefront-control
  2. Templates are processed with branding values
  3. Branding is injected into payload for Handlebars variables
  4. Email is compiled and sent

### Coverage
✅ **All 17 email event types** now use branding:
- Order emails (7 types)
- Account emails (5 types)
- Other emails (5 types)

### Benefits
- ✅ Single source of truth (storefront-control)
- ✅ Channel-specific branding support
- ✅ Automatic updates when branding changes
- ✅ Graceful fallback if storefront-control unavailable
- ✅ No manual template updates needed

---

## 2. Footer Integration 🔄 IN PROGRESS

### What Was Implemented

#### **Channel-Specific Menu Support** (`storefront/src/ui/components/Footer.tsx`)
- ✅ Footer now uses channel-specific menu slugs: `footer-{channel}` (e.g., `footer-ils`)
- ✅ Falls back to generic `footer` menu if channel-specific doesn't exist
- ✅ Menu content is fetched from Saleor GraphQL (managed in dashboard)

#### **Storefront-Control Visibility Control** (`apps/apps/storefront-control/src/pages/[channelSlug]/footer.tsx`)
- ✅ Controls which sections to display:
  - `showNewsletter` - Newsletter signup section
  - `showSocialLinks` - Social media icons
  - `showContactInfo` - Contact information (email, phone, address)
  - `copyrightText` - Custom copyright text

#### **Footer Client Component** (`storefront/src/ui/components/FooterClient.tsx`)
- ✅ Newsletter section added (with GraphQL mutation)
- ✅ Respects `footerConfig.showNewsletter` from storefront-control
- ✅ Uses content from `contentConfig` (managed in storefront-control)
- ✅ Menu items come from dashboard (GraphQL)
- ✅ Contact info uses store config (from storefront-control)

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FOOTER ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Dashboard       │  → Manages menu content (names, links, paths)
│  (Menu Manager)  │     - Creates menus with slug: "footer-{channel}"
│                  │     - Handles translations
│                  │     - Manages menu item structure
└────────┬─────────┘
         │ GraphQL Query
         ▼
┌──────────────────┐
│  Storefront      │  → Fetches menu by slug: "footer-ils"
│  (Footer.tsx)    │     - Falls back to "footer" if not found
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Storefront      │  → Renders footer with:
│  (FooterClient)  │     - Menu items from Dashboard (structure)
│                  │     - Visibility from storefront-control (what to show)
│                  │     - Content from storefront-control (text, labels)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Storefront-Control│ → Controls:
│  (footer.tsx)    │     - showNewsletter (boolean)
│                  │     - showSocialLinks (boolean)
│                  │     - showContactInfo (boolean)
│                  │     - copyrightText (string)
└──────────────────┘
```

### What Still Needs to Be Done

#### **1. Dashboard Menu Creation Guide**
- Need documentation on creating channel-specific footer menus
- Example: Create menu with slug `footer-ils` for channel `ils`
- Menu items should be created in Dashboard → Navigation → Menus

#### **2. Dropdown Bug Fix** 🔴 TODO
- **Location**: `dashboard/src/components/FilterPresetsSelect/FilterPresetsSelect.tsx`
- **Issue**: Selected filter preset value not being properly displayed/selected
- **Root Cause**: Need to verify how `activePreset` is being compared and set
- **Status**: Needs investigation and fix

#### **3. Newsletter API Endpoint**
- Footer uses GraphQL mutation directly (client-side)
- May need server-side API route for better error handling
- Current implementation works but could be improved

---

## 3. Dropdown Bug Analysis 🔴 NEEDS FIX

### Issue Description
The filter preset dropdown in the Customer Service list page doesn't properly show the selected value.

### Code Analysis

**File**: `dashboard/src/components/FilterPresetsSelect/FilterPresetsSelect.tsx`

**Current Logic**:
```typescript
// Line 51-65: getLabel() function
const getLabel = () => {
  if (activePreset === undefined || activePreset === null || activePreset === 0) {
    return selectAllLabel;
  }
  const presetIndex = activePreset - 1;
  if (presetIndex >= 0 && presetIndex < savedPresets.length) {
    return savedPresets[presetIndex];
  }
  return selectAllLabel;
};

// Line 143: isActive check
isActive={activePreset === index + 1}
```

**Potential Issues**:
1. **Type Mismatch**: `activePreset` might be a string from URL params, but compared as number
2. **URL Parameter Parsing**: `useFilterPresets` parses `params.activeTab` as string, converts to number
3. **Selection State**: The dropdown might not be closing after selection, or state not updating

### Recommended Fix

1. **Verify type consistency** between `activePreset` prop and `selectedPreset` from hook
2. **Check URL parameter handling** in `useFilterPresets`
3. **Ensure dropdown closes** after selection
4. **Add logging** to debug selection flow

---

## 4. Summary of Changes

### Files Created
- ✅ `apps/apps/smtp/src/modules/branding/branding-service.ts`
- ✅ `apps/apps/smtp/src/modules/branding/template-branding-processor.ts`
- ✅ `apps/apps/smtp/BRANDING_INTEGRATION.md`
- ✅ `apps/apps/smtp/BRANDING_COVERAGE.md`

### Files Modified
- ✅ `apps/apps/smtp/src/modules/event-handlers/use-case/send-event-messages.use-case.ts`
- ✅ All 10 webhook handlers (added `saleorApiUrl` parameter)
- ✅ `storefront/src/ui/components/Footer.tsx` (channel-specific menu slugs)
- ✅ `storefront/src/ui/components/FooterClient.tsx` (newsletter section, visibility control)

### Integration Points
- ✅ SMTP app ↔ Storefront-control (branding fetch)
- ✅ Storefront ↔ Dashboard (menu content via GraphQL)
- ✅ Storefront ↔ Storefront-control (footer visibility config)
- ✅ Storefront-control ↔ Dashboard (content management separation)

---

## 5. Next Steps

### Immediate Actions Needed

1. **Fix Dropdown Bug** 🔴
   - Investigate `FilterPresetsSelect` component
   - Check `useFilterPresets` hook for type issues
   - Test filter preset selection flow

2. **Document Menu Creation** 📝
   - Create guide for creating channel-specific footer menus in dashboard
   - Example: "How to create footer-ils menu"

3. **Test Footer Integration** ✅
   - Verify channel-specific menus work
   - Test visibility toggles from storefront-control
   - Verify newsletter subscription works

4. **Optional Improvements** 💡
   - Add server-side API route for newsletter subscription
   - Add error boundaries for footer rendering
   - Add loading states for menu fetching

---

## 6. Testing Checklist

### SMTP Branding
- [x] Branding fetched from storefront-control
- [x] Templates use correct colors and company name
- [x] Fallback to defaults works
- [x] All email types use branding

### Footer Integration
- [ ] Channel-specific menu (`footer-ils`) loads correctly
- [ ] Falls back to generic `footer` menu
- [ ] Newsletter section shows/hides based on config
- [ ] Social links show/hides based on config
- [ ] Contact info shows/hides based on config
- [ ] Menu items from dashboard display correctly

### Dropdown Bug
- [ ] Filter preset selection works
- [ ] Selected preset displays correctly
- [ ] Dropdown closes after selection
- [ ] URL parameters update correctly

---

## 7. Architecture Decisions

### Separation of Concerns

1. **Dashboard** = Content & Structure
   - Menu items (names, links, paths)
   - Translations
   - Menu hierarchy

2. **Storefront-Control** = Visibility & Styling
   - Which sections to show
   - Content text (labels, descriptions)
   - Copyright text

3. **Storefront** = Rendering
   - Fetches menu from GraphQL
   - Fetches config from storefront-control
   - Renders footer with both data sources

### Channel-Specific Menus
- **Pattern**: `footer-{channelSlug}` (e.g., `footer-ils`, `footer-usd`)
- **Fallback**: Generic `footer` menu if channel-specific doesn't exist
- **Management**: Created in Dashboard → Navigation → Menus

---

## Conclusion

The SMTP branding integration is **complete and working**. The footer integration is **mostly complete** but needs:
1. Dropdown bug fix
2. Documentation for menu creation
3. Testing verification

All systems are designed with proper separation of concerns and channel-specific support.
