import { z } from "zod";

export const templateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(500), // Handlebars template
  body: z.string().min(1), // MJML template
  variables: z.array(z.string()).default([]), // Available variables
  images: z.array(z.string()).default([]), // Array of image IDs used in template
  version: z.number().int().positive().optional(),
  isLocked: z.boolean().default(false),
  lockedByCampaigns: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
});

export type Template = z.infer<typeof templateSchema>;

export const createTemplateInputSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

export const updateTemplateInputSchema = createTemplateInputSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>;
