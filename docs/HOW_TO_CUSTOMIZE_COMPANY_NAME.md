# 🏢 How to Customize Company Name & Branding

## ⚡ Quick 2-Minute Setup

### Step 1: Open the File

```
apps/apps/smtp/src/modules/smtp/default-templates.ts
```

### Step 2: Find Lines 4-10 (Top of File)

You'll see:

```typescript
// ============================================================================
// 🎨 COMPANY BRANDING - CUSTOMIZE HERE
// ============================================================================
const COMPANY_NAME = "Your Professional E-Commerce Store";
const COMPANY_EMAIL = "support@yourstore.com";
const COMPANY_WEBSITE = "www.yourstore.com";
const PRIMARY_COLOR = "#2563EB"; // Professional Blue
const SECONDARY_COLOR = "#1F2937"; // Dark Gray
// ============================================================================
```

### Step 3: Change to YOUR Brand

```typescript
const COMPANY_NAME = "Acme Store"; // Your company name
const COMPANY_EMAIL = "help@acmestore.com"; // Your support email
const COMPANY_WEBSITE = "www.acmestore.com"; // Your website
const PRIMARY_COLOR = "#FF6B35"; // Your brand color
const SECONDARY_COLOR = "#004E89"; // Your accent color
```

### Step 4: Restart SMTP App

```bash
cd infra
docker-compose -f docker-compose.dev.yml restart saleor-smtp-app
```

### Step 5: Done! 🎉

All 14 email templates now use your branding!

---

## 🎨 What Changes Automatically

When you update those 5 variables, **ALL** of these update automatically:

### Company Name appears in:

✅ All email headers  
✅ All email footers  
✅ All subject lines  
✅ Copyright notices  
✅ Welcome messages

### Company Email appears in:

✅ "Questions? Contact us" sections  
✅ Footer contact information  
✅ Support links

### Company Website appears in:

✅ Gift card redemption links  
✅ "Visit our store" buttons

### Colors appear in:

✅ Email headers  
✅ Buttons  
✅ Highlights  
✅ Links  
✅ Status badges

---

## 🎯 Example Transformations

### Before Customization:

```
Subject: 🛍️ Thank You for Your Order #123 - Your Professional E-Commerce Store

Header: [Blue] Order Confirmation
Footer: © 2024 Your Professional E-Commerce Store
Contact: support@yourstore.com
```

### After Customization (Example: "Acme Store"):

```
Subject: 🛍️ Thank You for Your Order #123 - Acme Store

Header: [Orange] Order Confirmation
Footer: © 2024 Acme Store
Contact: help@acmestore.com
```

---

## 🎨 Choosing Brand Colors

### Find Your Brand's Hex Color:

1. Use your logo or website as reference
2. Use a color picker tool (Google "color picker")
3. Copy the hex code (e.g., #FF6B35)
4. Paste into PRIMARY_COLOR

### Color Tips:

- **PRIMARY_COLOR**: Main brand color (used for headers, buttons)
- **SECONDARY_COLOR**: Accent/text color (usually dark gray)
- Use **high contrast** colors for readability
- Test on mobile to ensure visibility

### Popular Professional Colors:

```typescript
// Tech Company (Blue)
const PRIMARY_COLOR = "#2563EB";

// E-commerce (Orange)
const PRIMARY_COLOR = "#F97316";

// Luxury Brand (Purple)
const PRIMARY_COLOR = "#7C3AED";

// Eco-Friendly (Green)
const PRIMARY_COLOR = "#059669";

// Modern Minimal (Black)
const PRIMARY_COLOR = "#1F2937";

// Energetic (Red)
const PRIMARY_COLOR = "#DC2626";
```

---

## ✅ Verification Checklist

After customizing, verify everything works:

```
□ Open the template file
□ Update COMPANY_NAME
□ Update COMPANY_EMAIL
□ Update COMPANY_WEBSITE (optional)
□ Update PRIMARY_COLOR (optional)
□ Update SECONDARY_COLOR (optional)
□ Save the file
□ Restart SMTP app
□ Send a test email
□ Check that your company name appears
□ Check that your colors are applied
```

---

## 🧪 Quick Test

### Send a Test Email:

1. **Place a test order** in your store
2. **Check your email inbox**
3. **Open the "Order Confirmation" email**
4. **Verify:**
   - Subject line has your company name
   - Header uses your brand color
   - Footer shows your company name
   - Contact email is correct

If all 4 are correct, you're done! ✅

---

## 🔧 Troubleshooting

### "My changes don't appear"

**Solution:** Make sure you restarted the SMTP app:

```bash
docker-compose -f docker-compose.dev.yml restart saleor-smtp-app
```

### "Colors look wrong"

**Solution:** Use a hex color picker to get the exact color code:

- Go to: https://htmlcolorcodes.com/color-picker/
- Pick your color
- Copy the hex code (includes #)
- Paste into PRIMARY_COLOR

### "Company name still shows old text"

**Solution:**

1. Check that you saved the file
2. Restart the SMTP app
3. Clear your email cache/refresh
4. Send a NEW test email (old emails won't update)

---

## 📚 More Customization

Want to customize even more? See:

- `infra/ALL_EMAIL_TEMPLATES_UPGRADED.md` - Full template details
- `infra/PROFESSIONAL_INVOICE_EMAIL_UPGRADE.md` - Invoice customization

---

## 💡 Pro Tip

Save your branding constants somewhere safe! If you ever rebuild the app or need to reset, you can quickly paste them back:

```typescript
// My Company Branding
const COMPANY_NAME = "Acme Store";
const COMPANY_EMAIL = "help@acmestore.com";
const COMPANY_WEBSITE = "www.acmestore.com";
const PRIMARY_COLOR = "#FF6B35";
const SECONDARY_COLOR = "#004E89";
```

---

## 🎊 That's It!

You've successfully customized all your email templates!

**Total Time:** 2 minutes  
**Files Changed:** 1  
**Templates Updated:** 14  
**Difficulty:** Easy! 🟢

**Your emails now represent YOUR brand!** 🚀✨

---

_Remember: You only need to change these 5 variables once, and all 14 email templates will use your branding!_
