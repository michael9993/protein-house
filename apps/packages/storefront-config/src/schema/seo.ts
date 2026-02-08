import { z } from "zod";

export const SeoSchema = z.object({
  titleTemplate: z.string(),
  defaultTitle: z.string(),
  defaultDescription: z.string(),
  defaultImage: z.string(),
  twitterHandle: z.string().nullable(),
});
