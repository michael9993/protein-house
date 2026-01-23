import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createLogger } from "../../../logger";
import { protectedClientProcedure } from "../../trpc/protected-client-procedure";
import { router } from "../../trpc/trpc-server";
import { TemplateService } from "./template.service";
import { TemplateCompiler } from "./template-compiler";
import { createTemplateInputSchema, updateTemplateInputSchema } from "./template-schema";

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
        // Sample data for preview
        const sampleData = {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          unsubscribeUrl: "https://example.com/unsubscribe/token123",
          companyName: "My Store",
          companyEmail: "support@mystore.com",
          companyWebsite: "https://mystore.com",
          primaryColor: "#2563EB",
          secondaryColor: "#1F2937",
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
});
