# CMS Quick Test - 5 Minute Setup

Quick test to verify CMS integration is working.

---

## ⚡ Quick Test Steps

### 1. Test Categories (2 minutes)

**Dashboard:**
1. `Dashboard → Catalog → Categories → Create Category`
2. Name: "Test Category", Slug: "test-category"
3. Upload background image
4. **Publish**

**Browser:**
1. Open `http://localhost:3000/default-channel`
2. Scroll to "Shop by Category"
3. ✅ Should see "Test Category" with image

---

### 2. Test Hero Banner (2 minutes)

**Dashboard:**
1. `Dashboard → Catalog → Collections → Create Collection`
2. Name: "Hero Banner", Slug: `hero-banner` (exact!)
3. **Metadata → Add Field:**
   - Key: `hero_title`, Value: `Welcome to My Store`
   - Key: `hero_subtitle`, Value: `Test subtitle from CMS`
   - Key: `hero_cta_text`, Value: `Shop Now`
   - Key: `hero_cta_link`, Value: `/products`
4. **Publish**

**Browser:**
1. Refresh homepage
2. ✅ Hero should show "Welcome to My Store"
3. ✅ Subtitle should show "Test subtitle from CMS"
4. ✅ Button should say "Shop Now"

---

### 3. Test Testimonials (1 minute)

**Dashboard:**
1. `Dashboard → Catalog → Collections → Create Collection`
2. Name: "Testimonials", Slug: `testimonials` (exact!)
3. **Metadata → Add Field:**
   - Key: `testimonials_json`
   - Value: `[{"id":"1","name":"Test User","role":"Customer","quote":"This is a test!","rating":5}]`
4. **Publish**

**Browser:**
1. Refresh homepage
2. Scroll to testimonials section
3. ✅ Should see "Test User" testimonial

---

## ✅ Success Checklist

- [ ] Categories appear on homepage
- [ ] Hero banner uses CMS text
- [ ] Testimonials from CMS display
- [ ] No console errors
- [ ] All links work

---

## 🐛 Quick Troubleshooting

**Not showing?**
- Check slug is exact (case-sensitive)
- Verify collection is published
- Hard refresh: `Ctrl+Shift+R`
- Check browser console for errors

**Still not working?**
- Restart storefront: `docker restart saleor-storefront-dev`
- Wait 60 seconds (cache time)
- Check Dashboard → Collections → Verify slug

---

*Quick reference - see full guides for details*

