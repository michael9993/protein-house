import { z } from "zod";

export const PagesSchema = z.object({
  aboutUs: z.boolean(),
  contact: z.boolean(),
  faq: z.boolean(),
  blog: z.boolean(),
  privacyPolicy: z.boolean(),
  termsOfService: z.boolean(),
  shippingPolicy: z.boolean(),
  returnPolicy: z.boolean(),
  forgotPassword: z.boolean(),
  resetPassword: z.boolean(),
  verifyEmail: z.boolean(),
  confirmEmail: z.boolean(),
});
