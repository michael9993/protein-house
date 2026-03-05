import { z } from "zod";

// ============================================
// CHECKOUT UI SCHEMA
// ============================================
// Controls visual appearance of checkout components
// that are not covered by text/content config.

export const CheckoutUiSchema = z.object({
  accordion: z.object({
    completedStepColor: z.string().optional(),  // defaults to statusColors.success
    activeStepColor: z.string().optional(),     // defaults to branding.colors.primary
  }).optional(),
  confirmation: z.object({
    showTimeline: z.boolean().optional(),       // default true
    showPrintReceipt: z.boolean().optional(),   // default true
  }).optional(),
  progressBar: z.object({
    completedColor: z.string().optional(),      // defaults to branding.colors.primary
    activeColor: z.string().optional(),         // defaults to neutral-900
  }).optional(),
}).optional();
