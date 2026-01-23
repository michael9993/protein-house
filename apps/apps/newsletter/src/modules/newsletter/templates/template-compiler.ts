import compile from "mjml";
import Handlebars from "handlebars";

import { createLogger } from "../../../logger";

const logger = createLogger("TemplateCompiler");

export interface CompiledTemplate {
  html: string;
  errors: string[];
}

export class TemplateCompiler {
  /**
   * Compile MJML template to HTML
   */
  static compileMjml(mjml: string): { html: string; errors: string[] } {
    try {
      const result = compile(mjml, {
        validationLevel: "soft",
      });

      if (result.errors && result.errors.length > 0) {
        const errors = result.errors.map((err) => err.message || "Unknown MJML error");
        logger.warn("MJML compilation warnings", { errors });
        return {
          html: result.html,
          errors,
        };
      }

      return {
        html: result.html,
        errors: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to compile MJML";
      logger.error("MJML compilation error", { error: errorMessage });
      return {
        html: "",
        errors: [errorMessage],
      };
    }
  }

  /**
   * Compile Handlebars template with data
   */
  static compileHandlebars(template: string, data: Record<string, unknown>): string {
    try {
      const compiled = Handlebars.compile(template);
      return compiled(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to compile Handlebars";
      logger.error("Handlebars compilation error", { error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  /**
   * Compile full template (MJML + Handlebars)
   */
  static compileTemplate(
    mjmlTemplate: string,
    subjectTemplate: string,
    data: Record<string, unknown>,
  ): { html: string; subject: string; errors: string[] } {
    // First compile Handlebars in MJML
    const compiledMjml = this.compileHandlebars(mjmlTemplate, data);

    // Then compile MJML to HTML
    const mjmlResult = this.compileMjml(compiledMjml);

    // Compile subject template
    const compiledSubject = this.compileHandlebars(subjectTemplate, data);

    return {
      html: mjmlResult.html,
      subject: compiledSubject,
      errors: mjmlResult.errors,
    };
  }
}
