# CMS Integration Testing Guide

Complete guide for testing CMS features in the browser and adding new CMS-controlled content.

---

## 🧪 Browser Testing Guide

### Prerequisites

1. **Access to Dashboard**: `http://localhost:9000`
2. **Access to Storefront**: `http://localhost:3000`
3. **Sample Data**: Ensure you have products, categories, and collections

---

## Test 1: Categories on Homepage

### Step 1: Create Categories in Dashboard

1. Go to `Dashboard → Catalog → Categories`
2. Click **"Create Category"**
3. Create 3-4 categories:
   ```
   Category 1:
   - Name: "Running Shoes"
   - Slug: "running-shoes"
   - Background Image: Upload an image (1920x400px recommended)
   
   Category 2:
   - Name: "Training Gear"
   - Slug: "training-gear"
   - Background Image: Upload an image
   
   Category 3:
   - Name: "Sportswear"
   - Slug: "sportswear"
   - Background Image: Upload an image
   ```
4. **Publish** each category

### Step 2: Test in Browser

1. Open `http://localhost:3000/default-channel`
2. Scroll to **"Shop by Category"** section
3. **Expected Result**: 
   - ✅ See your categories with images
   - ✅ Product counts displayed
   - ✅ Clicking category navigates to category page

### Step 3: Verify Product Counts

1. Go to `Dashboard → Catalog → Categories → Running Shoes`
2. Check how many products are assigned
3. Refresh storefront homepage
4. **Expected**: Product count matches Dashboard

---

## Test 2: Hero Banner Configuration

### Step 1: Create Hero Banner Collection

1. Go to `Dashboard → Catalog → Collections`
2. Click **"Create Collection"**
3. Fill in:
   - **Name**: "Hero Banner"
   - **Slug**: `hero-banner` (exact!)
4. Click **"Save"**

### Step 2: Add Metadata

1. Open the "Hero Banner" collection
2. Scroll to **"Metadata"** section
3. Click **"Add Field"** and add:

```
Key: hero_title
Value: Welcome to Our Amazing Store

Key: hero_subtitle
Value: Discover premium products at unbeatable prices

Key: hero_cta_text
Value: Start Shopping

Key: hero_cta_link
Value: /products

Key: hero_video_url
Value: https://example.com/video.mp4 (optional)
```

4. **Upload Background Image** (for collection)
5. **Publish** the collection

### Step 3: Test in Browser

1. Open `http://localhost:3000/default-channel`
2. **Expected Result**:
   - ✅ Hero section shows your custom title
   - ✅ Subtitle matches metadata
   - ✅ CTA button text is "Start Shopping"
   - ✅ Clicking button goes to `/products`
   - ✅ Background image from collection is displayed

### Step 4: Test Video Hero (Optional)

1. Add `hero_video_url` metadata with a video URL
2. Refresh storefront
3. **Expected**: Video plays in hero section (if video hero is enabled)

---

## Test 3: Testimonials from CMS

### Step 1: Create Testimonials Collection

1. Go to `Dashboard → Catalog → Collections`
2. Create collection:
   - **Name**: "Testimonials"
   - **Slug**: `testimonials` (exact!)

### Step 2: Add Testimonials JSON

1. Open "Testimonials" collection
2. Go to **Metadata** section
3. Add field:

```
Key: testimonials_json
Value: [
  {
    "id": "1",
    "name": "Sarah Johnson",
    "role": "Professional Athlete",
    "quote": "Best sports gear I've ever purchased! Quality is outstanding.",
    "rating": 5,
    "image": "/testimonials/sarah.jpg"
  },
  {
    "id": "2",
    "name": "Mike Chen",
    "role": "Fitness Coach",
    "quote": "Fast shipping and excellent customer service. Highly recommend!",
    "rating": 5
  },
  {
    "id": "3",
    "name": "Emma Davis",
    "role": "Marathon Runner",
    "quote": "The running shoes are perfect. Comfortable and durable.",
    "rating": 5
  }
]
```

**Important**: Use valid JSON format (no trailing commas, proper quotes)

### Step 3: Test in Browser

1. Refresh `http://localhost:3000/default-channel`
2. Scroll to **"What Our Athletes Say"** section
3. **Expected Result**:
   - ✅ See your 3 testimonials
   - ✅ Names, roles, and quotes displayed correctly
   - ✅ 5-star ratings shown
   - ✅ If no testimonials in CMS, fallback testimonials appear

---

## Test 4: Featured Brands from CMS

### Step 1: Create Brands Collection

1. Go to `Dashboard → Catalog → Collections`
2. Create collection:
   - **Name**: "Featured Brands"
   - **Slug**: `brands` (exact!)

### Step 2: Add Brands JSON

1. Open "Featured Brands" collection
2. Go to **Metadata** section
3. Add field:

```
Key: brands_json
Value: [
  {
    "id": "1",
    "name": "Nike",
    "logo": "/brands/nike.svg",
    "url": "/collections/nike"
  },
  {
    "id": "2",
    "name": "Adidas",
    "logo": "/brands/adidas.svg",
    "url": "/collections/adidas"
  },
  {
    "id": "3",
    "name": "Puma",
    "logo": "/brands/puma.svg",
    "url": "/collections/puma"
  }
]
```

### Step 3: Test in Browser

1. Refresh storefront homepage
2. Scroll to **"Shop by Brand"** section
3. **Expected Result**:
   - ✅ Your brands displayed
   - ✅ Brand names visible
   - ✅ Clicking brand navigates to collection URL
   - ✅ If no brands in CMS, default brands appear

---

## Test 5: Navigation Menu

### Step 1: Verify Menu Exists

1. Go to `Dashboard → Content → Navigation`
2. Check if menu with slug `navbar` exists
3. If not, create it with slug: `navbar`

### Step 2: Add Menu Items

1. Open "navbar" menu
2. Add items:
   - Category: "Running Shoes"
   - Category: "Training Gear"
   - Collection: "Sale"
   - Page: "About Us"

### Step 3: Test in Browser

1. Open `http://localhost:3000/default-channel`
2. Check header navigation
3. **Expected Result**:
   - ✅ Menu items from Dashboard appear
   - ✅ Categories link to `/categories/{slug}`
   - ✅ Collections link to `/collections/{slug}`
   - ✅ Pages link to `/{slug}`

---

## Test 6: CMS Pages (About, FAQ, Contact)

### Step 1: Create About Page

1. Go to `Dashboard → Content → Pages`
2. Create page:
   - **Title**: "About Us"
   - **Slug**: `about`
   - **Content**: Add rich text content
3. **Publish**

### Step 2: Test in Browser

1. Navigate to `http://localhost:3000/default-channel/about`
2. **Expected Result**:
   - ✅ Page title matches Dashboard
   - ✅ Content from Dashboard displayed
   - ✅ SEO metadata applied

---

## 🐛 Troubleshooting

### Issue: Categories Not Showing

**Check:**
- ✅ Categories are published
- ✅ Categories are assigned to channel
- ✅ Categories have `level: 0` (top-level)
- ✅ Hard refresh browser (Ctrl+Shift+R)

**Debug:**
```typescript
// Check browser console for errors
// Check Network tab for GraphQL requests
```

### Issue: Hero Banner Not Updating

**Check:**
- ✅ Collection slug is exactly `hero-banner`
- ✅ Metadata keys are correct (no typos)
- ✅ Collection is published
- ✅ Collection is in correct channel

**Debug:**
```typescript
// In browser console:
fetch('/api/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query { collection(slug: "hero-banner", channel: "default-channel") { metadata { key value } } }`
  })
}).then(r => r.json()).then(console.log)
```

### Issue: Testimonials/Brands JSON Not Parsing

**Check:**
- ✅ JSON is valid (use JSONLint.com)
- ✅ No trailing commas
- ✅ All strings in double quotes
- ✅ Metadata key is exactly `testimonials_json` or `brands_json`

**Fix:**
```json
// ❌ Wrong (trailing comma)
[
  {"id": "1", "name": "John"},
  {"id": "2", "name": "Jane"},  // <- trailing comma
]

// ✅ Correct
[
  {"id": "1", "name": "John"},
  {"id": "2", "name": "Jane"}
]
```

### Issue: Changes Not Reflecting

**Solutions:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check Next.js revalidation time (60 seconds default)
4. Restart storefront: `docker restart saleor-storefront-dev`

---

## 📊 Testing Checklist

### Homepage
- [ ] Categories display with images
- [ ] Product counts are accurate
- [ ] Hero banner uses CMS config
- [ ] Testimonials from CMS display
- [ ] Brands from CMS display
- [ ] Product collections load correctly

### Navigation
- [ ] Navbar menu items from Dashboard
- [ ] Footer menu items from Dashboard
- [ ] Links navigate correctly

### Pages
- [ ] About page content from CMS
- [ ] FAQ page (if using CMS)
- [ ] Contact page (if using CMS)

### Fallbacks
- [ ] If CMS content missing, fallbacks work
- [ ] No errors in console
- [ ] Storefront still loads

---

## 🔍 Browser DevTools Testing

### Check GraphQL Requests

1. Open **DevTools → Network**
2. Filter by **"graphql"**
3. Refresh page
4. Check requests:
   - `CategoriesForHomepage`
   - `ProductListByCollection`
   - `MenuGetBySlug`
   - `PageGetBySlug`

### Check Console Errors

1. Open **DevTools → Console**
2. Look for:
   - GraphQL errors
   - JSON parsing errors
   - Missing data warnings

### Check React Components

1. Install React DevTools extension
2. Inspect components:
   - `HomePage` - Check props
   - `HeroSection` - Check `cmsConfig`
   - `Testimonials` - Check `cmsTestimonials`
   - `FeaturedBrands` - Check `cmsBrands`

---

*Last updated: December 2024*

