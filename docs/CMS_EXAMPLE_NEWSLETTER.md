# Practical Example: Making Newsletter CMS-Controlled

Complete step-by-step example of adding CMS control to the Newsletter component.

---

## 📝 Current State

The Newsletter component currently uses hardcoded props:

```typescript
<NewsletterSignup 
  title="Join the Team"
  subtitle="Get 15% off your first order..."
  buttonText="Sign Me Up"
/>
```

---

## 🎯 Goal

Make it controllable from Dashboard via collection metadata.

---

## Step 1: Update CMS Library

**File**: `storefront/src/lib/cms.ts`

```typescript
// Add to cmsCollections
export const cmsCollections = {
  heroBanner: "hero-banner",
  testimonials: "testimonials",
  brands: "brands",
  newsletterConfig: "newsletter-config", // ADD THIS
};

// Add interface
export interface NewsletterConfig {
  title: string;
  subtitle: string;
  buttonText: string;
  placeholder?: string;
  successMessage?: string;
}

// Add helper function
export async function getNewsletterConfig(channel: string): Promise<NewsletterConfig | null> {
  try {
    const data = await executeGraphQL(ProductListByCollectionDocument, {
      variables: { slug: cmsCollections.newsletterConfig, channel },
      revalidate: 60 * 60, // Cache 1 hour
    });
    
    const collection = data.collection;
    if (!collection) return null;
    
    const metadata = collection.metadata;
    
    return {
      title: getMetadataValue(metadata, "newsletter_title") || "Join Our Newsletter",
      subtitle: getMetadataValue(metadata, "newsletter_subtitle") || "Get updates and deals",
      buttonText: getMetadataValue(metadata, "newsletter_button_text") || "Subscribe",
      placeholder: getMetadataValue(metadata, "newsletter_placeholder") || "Enter your email",
      successMessage: getMetadataValue(metadata, "newsletter_success") || "Thanks for subscribing!",
    };
  } catch (error) {
    console.error("Failed to fetch newsletter config:", error);
    return null;
  }
}
```

---

## Step 2: Update Homepage Data Fetching

**File**: `storefront/src/app/[channel]/(main)/page.tsx`

```typescript
import { getNewsletterConfig } from "@/lib/cms";

export default async function Page(props: { params: Promise<{ channel: string }> }) {
  const params = await props.params;
  const { channel } = params;
  
  const [
    // ... existing fetches
    newsletterConfig, // ADD THIS
  ] = await Promise.all([
    // ... existing promises
    getNewsletterConfig(channel), // ADD THIS
  ]);

  return (
    <HomePage
      // ... existing props
      newsletterConfig={newsletterConfig} // ADD THIS
    />
  );
}
```

---

## Step 3: Update HomePage Component

**File**: `storefront/src/app/[channel]/(main)/HomePage.tsx`

```typescript
import { type NewsletterConfig } from "@/lib/cms";

interface HomePageProps {
  // ... existing props
  newsletterConfig?: NewsletterConfig | null; // ADD THIS
}

export function HomePage({
  // ... existing props
  newsletterConfig, // ADD THIS
}: HomePageProps) {
  return (
    <main>
      {/* ... existing sections */}
      
      <NewsletterSignup 
        cmsConfig={newsletterConfig} // CHANGE THIS
      />
    </main>
  );
}
```

---

## Step 4: Update NewsletterSignup Component

**File**: `storefront/src/components/home/NewsletterSignup.tsx`

```typescript
"use client";

import { type NewsletterConfig } from "@/lib/cms";
import { useStoreConfig } from "@/providers/StoreConfigProvider";

interface NewsletterSignupProps {
  /** CMS config from "newsletter-config" collection */
  cmsConfig?: NewsletterConfig | null;
  // Keep fallbacks for backwards compatibility
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

export function NewsletterSignup({
  cmsConfig,
  title: fallbackTitle,
  subtitle: fallbackSubtitle,
  buttonText: fallbackButtonText,
}: NewsletterSignupProps) {
  const { branding } = useStoreConfig();
  
  // Use CMS config if available, otherwise use fallbacks
  const title = cmsConfig?.title || fallbackTitle || "Join Our Newsletter";
  const subtitle = cmsConfig?.subtitle || fallbackSubtitle || "Get updates and exclusive deals";
  const buttonText = cmsConfig?.buttonText || fallbackButtonText || "Subscribe";
  const placeholder = cmsConfig?.placeholder || "Enter your email";
  const successMessage = cmsConfig?.successMessage || "Thanks for subscribing!";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Your newsletter signup logic here
    setStatus("success");
    setTimeout(() => {
      setStatus("idle");
      setEmail("");
    }, 3000);
  };

  return (
    <section 
      className="py-16 sm:py-20"
      style={{ backgroundColor: branding.colors.surface }}
    >
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 
          className="heading text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: branding.colors.text }}
        >
          {title}
        </h2>
        <p 
          className="mt-4 text-lg"
          style={{ color: branding.colors.textMuted }}
        >
          {subtitle}
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-500"
            />
            <button
              type="submit"
              className="rounded-lg px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: branding.colors.primary }}
            >
              {buttonText}
            </button>
          </div>
        </form>

        {status === "success" && (
          <p 
            className="mt-4 text-sm"
            style={{ color: branding.colors.primary }}
          >
            {successMessage}
          </p>
        )}
      </div>
    </section>
  );
}
```

---

## Step 5: Run Codegen

```bash
docker compose -f docker-compose.dev.yml exec saleor-storefront pnpm generate
```

---

## Step 6: Setup in Dashboard

1. **Go to**: `Dashboard → Catalog → Collections`
2. **Click**: "Create Collection"
3. **Fill in**:
   - Name: "Newsletter Config"
   - Slug: `newsletter-config` (exact!)
4. **Click**: "Save"
5. **Go to**: Metadata section
6. **Add fields**:
   ```
   Key: newsletter_title
   Value: Join Our Newsletter
   
   Key: newsletter_subtitle
   Value: Get 15% off your first order plus exclusive access to new releases
   
   Key: newsletter_button_text
   Value: Sign Me Up
   
   Key: newsletter_placeholder
   Value: Enter your email address
   
   Key: newsletter_success
   Value: Thank you for subscribing! Check your email.
   ```
7. **Toggle**: Published → ON
8. **Click**: Save

---

## Step 7: Test

1. **Refresh**: `http://localhost:3000/default-channel`
2. **Scroll**: To newsletter section
3. **Verify**:
   - ✅ Title: "Join Our Newsletter"
   - ✅ Subtitle: "Get 15% off your first order..."
   - ✅ Button: "Sign Me Up"
   - ✅ Placeholder: "Enter your email address"

---

## Step 8: Test Fallback

1. **Dashboard**: Unpublish "Newsletter Config" collection
2. **Refresh**: Storefront
3. **Verify**: Newsletter still shows (using fallback/default props)
4. **No errors**: In browser console

---

## ✅ Complete!

The newsletter is now fully CMS-controlled. You can:
- Change text from Dashboard
- Update button text
- Modify success message
- All without code changes!

---

## 🎨 Advanced: Add More Fields

Want to add more control? Just add more metadata keys:

```typescript
// In getNewsletterConfig function
return {
  // ... existing fields
  showPrivacyLink: getMetadataValue(metadata, "show_privacy") === "true",
  privacyLinkText: getMetadataValue(metadata, "privacy_link_text") || "Privacy Policy",
  emailListId: getMetadataValue(metadata, "email_list_id"), // For Mailchimp, etc.
};
```

Then in Dashboard, add:
- `show_privacy`: `true`
- `privacy_link_text`: `Read our Privacy Policy`
- `email_list_id`: `abc123`

---

*This pattern works for any component!*

