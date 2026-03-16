import { z } from "zod";

export const LegalLinkSchema = z.object({
  enabled: z.boolean().default(true),
  url: z.string(),
});

export const FooterSchema = z.object({
  showNewsletter: z.boolean().default(true),
  showSocialLinks: z.boolean().default(true),
  showContactInfo: z.boolean().default(true),
  showFooterEmail: z.boolean().default(true),
  showFooterPhone: z.boolean().default(true),
  showFooterAddress: z.boolean().default(true),
  showFooterContactButton: z.boolean().default(true),
  showMenu: z.boolean().default(true),
  showBrand: z.boolean().default(true),
  copyrightText: z.string().nullable(),
  legalLinks: z.object({
    trackOrder: LegalLinkSchema,
    privacyPolicy: LegalLinkSchema,
    termsOfService: LegalLinkSchema,
    shippingPolicy: LegalLinkSchema,
    returnPolicy: LegalLinkSchema,
    accessibilityStatement: LegalLinkSchema,
  }).optional(),
  // Policy page content
  returnPolicyPageTitle: z.string().optional(),
  returnPolicyHeader: z.string().optional(),
  returnPolicyContent: z.string().optional(),
  returnPolicyDefaultContent: z.string().optional(),
  returnPolicyFooter: z.string().optional(),
  shippingPolicyPageTitle: z.string().optional(),
  shippingPolicyHeader: z.string().optional(),
  shippingPolicyContent: z.string().optional(),
  shippingPolicyDefaultContent: z.string().optional(),
  shippingPolicyFooter: z.string().optional(),
  privacyPolicyPageTitle: z.string().optional(),
  privacyPolicyHeader: z.string().optional(),
  privacyPolicyContent: z.string().optional(),
  privacyPolicyDefaultContent: z.string().optional(),
  privacyPolicyFooter: z.string().optional(),
  termsOfServicePageTitle: z.string().optional(),
  termsOfServiceHeader: z.string().optional(),
  termsOfServiceContent: z.string().optional(),
  termsOfServiceDefaultContent: z.string().optional(),
  termsOfServiceFooter: z.string().optional(),
  policyPageEmptyMessage: z.string().optional(),
  // Accessibility statement page
  accessibilityPageTitle: z.string().optional(),
  accessibilityHeader: z.string().optional(),
  accessibilityContent: z.string().optional(),
  accessibilityDefaultContent: z.string().optional(),
  accessibilityFooter: z.string().optional(),
  // VAT/Tax footer statement
  vatStatement: z.string().optional(),
  showVatStatement: z.boolean().default(true),
  // Business info footer display
  showBusinessInfo: z.boolean().default(true),
});
