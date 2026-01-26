import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createLogger } from "../../../logger";
import { protectedClientProcedure } from "../../trpc/protected-client-procedure";
import { router } from "../../trpc/trpc-server";
import { TemplateService } from "./template.service";
import { TemplateCompiler } from "./template-compiler";
import { createTemplateInputSchema, updateTemplateInputSchema } from "./template-schema";
import { fetchStoreBranding, DEFAULT_BRANDING } from "./branding-fetcher";

const logger = createLogger("template-router");

export const templateRouter = router({
  list: protectedClientProcedure.query(async ({ ctx }) => {
    const service = new TemplateService(
      ctx.apiClient,
      ctx.saleorApiUrl!,
      ctx.appId!,
    );

    try {
      const templates = await service.getTemplates();
      return { templates };
    } catch (error) {
      logger.error("Error listing templates", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to list templates",
      });
    }
  }),

  get: protectedClientProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "id" in val) {
        return { id: val.id as string };
      }
      throw new Error("Invalid input");
    })
    .query(async ({ ctx, input }) => {
      const service = new TemplateService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        const template = await service.getTemplate(input.id);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }
        return { template };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("Error getting template", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to get template",
        });
      }
    }),

  create: protectedClientProcedure
    .input(createTemplateInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Log received input for debugging
      logger.info("Template create received", {
        name: input.name,
        hasSubject: !!input.subject,
        hasBody: !!input.body,
        hasPreviewData: !!input.previewData,
        previewDataLength: input.previewData?.length || 0,
      });

      const service = new TemplateService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        // TODO: Get actual user ID from context
        const template = await service.createTemplate(input, "system");
        return { template };
      } catch (error) {
        logger.error("Error creating template", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create template",
        });
      }
    }),

  update: protectedClientProcedure
    .input(updateTemplateInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Log received input for debugging
      logger.info("Template update received", {
        id: input.id,
        hasName: !!input.name,
        hasSubject: !!input.subject,
        hasBody: !!input.body,
        hasPreviewData: !!input.previewData,
        previewDataLength: input.previewData?.length || 0,
      });

      const service = new TemplateService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        // TODO: Get actual user ID from context
        const template = await service.updateTemplate(input, "system");
        return { template };
      } catch (error) {
        logger.error("Error updating template", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update template",
        });
      }
    }),

  delete: protectedClientProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "id" in val) {
        return { id: val.id as string };
      }
      throw new Error("Invalid input");
    })
    .mutation(async ({ ctx, input }) => {
      const service = new TemplateService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        await service.deleteTemplate(input.id);
        return { success: true };
      } catch (error) {
        logger.error("Error deleting template", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to delete template",
        });
      }
    }),

  duplicate: protectedClientProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "id" in val) {
        return { id: val.id as string };
      }
      throw new Error("Invalid input");
    })
    .mutation(async ({ ctx, input }) => {
      const service = new TemplateService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
      );

      try {
        // TODO: Get actual user ID from context
        const template = await service.duplicateTemplate(input.id, "system");
        return { template };
      } catch (error) {
        logger.error("Error duplicating template", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to duplicate template",
        });
      }
    }),

  render: protectedClientProcedure
    .input(
      z.object({
        template: z.string(),
        subject: z.string(),
        payload: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate preview unsubscribe URL using app's base URL
        const appBaseUrl = process.env.APP_API_BASE_URL || 
                          process.env.NEWSLETTER_APP_URL || 
                          process.env.NEWSLETTER_APP_TUNNEL_URL ||
                          "https://newsletter-app.example.com";
        const previewUnsubscribeUrl = `${appBaseUrl}/api/newsletter/unsubscribe/PREVIEW_TOKEN`;

        // Default sample data for preview
        const defaultSampleData = {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          // This is a preview URL - actual URLs are generated per-subscriber at send time
          unsubscribeUrl: previewUnsubscribeUrl,
          companyName: "My Store",
          companyEmail: "support@mystore.com",
          companyWebsite: "https://mystore.com",
          companyLogo: "https://placehold.co/180x44/1F2937/ffffff?text=LOGO",
          companyAddress: "Your City, Country",
          primaryColor: "#2563EB",
          secondaryColor: "#1F2937",
          productsTitle: "Top Picks",
          productsSubtitle: "Hand-picked deals we think you'll love.",
          products: [
            {
              name: "Product One",
              price: "₪199",
              originalPrice: "₪299",
              image: "https://placehold.co/280x280/1F2937/ffffff?text=Product+1",
              url: "https://example.com/product-1",
            },
            {
              name: "Product Two",
              price: "₪149",
              originalPrice: "₪219",
              image: "https://placehold.co/280x280/1F2937/ffffff?text=Product+2",
              url: "https://example.com/product-2",
            },
          ],
        };

        // Merge payload with defaults - payload takes precedence
        const sampleData = {
          ...defaultSampleData,
          ...input.payload,
        };

        const result = TemplateCompiler.compileTemplate(
          input.template,
          input.subject,
          sampleData,
        );

        return {
          renderedEmailBody: result.html,
          renderedSubject: result.subject,
          errors: result.errors,
        };
      } catch (error) {
        logger.error("Error rendering template", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to render template",
        });
      }
    }),

  /**
   * Fetch branding from Storefront Control app
   */
  getBranding: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const channelSlug = input.channelSlug || "default";
        
        logger.debug("Fetching branding for channel", { channelSlug });
        
        const branding = await fetchStoreBranding(ctx.saleorApiUrl!, channelSlug);
        
        return { branding };
      } catch (error) {
        logger.error("Error fetching branding", { error });
        // Return default branding on error
        return { branding: DEFAULT_BRANDING };
      }
    }),
});
