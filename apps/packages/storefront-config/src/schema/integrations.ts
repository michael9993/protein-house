import { z } from "zod";

export const AnalyticsIntegrationsSchema = z.object({
  googleAnalyticsId: z.string().nullable(),
  googleTagManagerId: z.string().nullable(),
  facebookPixelId: z.string().nullable(),
  tiktokPixelId: z.string().nullable(),
  hotjarId: z.string().nullable(),
});

export const MarketingIntegrationsSchema = z.object({
  mailchimpListId: z.string().nullable(),
  klaviyoApiKey: z.string().nullable(),
});

export const SupportIntegrationsSchema = z.object({
  intercomAppId: z.string().nullable(),
  zendeskKey: z.string().nullable(),
  crispWebsiteId: z.string().nullable(),
  whatsappBusinessNumber: z.string().nullable(),
  whatsappDefaultMessage: z.string().nullable(),
});

export const SocialIntegrationsSchema = z.object({
  facebook: z.string().nullable(),
  instagram: z.string().nullable(),
  twitter: z.string().nullable(),
  youtube: z.string().nullable(),
  tiktok: z.string().nullable(),
  pinterest: z.string().nullable(),
});

export const CookieConsentSchema = z.object({
  enabled: z.boolean(),
  position: z.enum(["bottom", "bottom-left", "bottom-right"]),
  consentExpiryDays: z.number(),
});

export const IntegrationsSchema = z.object({
  analytics: AnalyticsIntegrationsSchema,
  marketing: MarketingIntegrationsSchema,
  support: SupportIntegrationsSchema,
  social: SocialIntegrationsSchema,
  cookieConsent: CookieConsentSchema,
});
