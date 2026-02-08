import { createLogger } from "../../logger";
import { BrandingConfig } from "./branding-service";

const logger = createLogger("TemplateBrandingProcessor");

/**
 * Processes email templates to inject branding values.
 * Replaces template literal variables like ${PRIMARY_COLOR} with actual branding values.
 * Also replaces known default values if templates were saved with hardcoded defaults.
 */
export class TemplateBrandingProcessor {
  // Default values that might be hardcoded in templates
  private static readonly DEFAULT_VALUES = {
    PRIMARY_COLOR: "#3b3d3f",
    SECONDARY_COLOR: "#0A0707",
    COMPANY_NAME: "Mansour Shoes",
    COMPANY_EMAIL: "support@mansourshoes.com",
    COMPANY_WEBSITE: "https://www.mansourshoes.com",
    LOGO_URL: "https://media.easy.co.il/images/UserThumbs/10035528_1752326685636_0.jpg",
  };

  /**
   * Replace branding variables in template string with actual values
   */
  static processTemplate(template: string, branding: BrandingConfig): string {
    let processed = template;
    let replacements = 0;

    // Log template snippet for debugging (first 200 chars)
    const templateSnippet = template.substring(0, 200).replace(/\n/g, " ");

    logger.debug("Processing template", {
      templateLength: template.length,
      templateSnippet,
      hasPrimaryColorVar: template.includes("${PRIMARY_COLOR}"),
      hasCompanyNameVar: template.includes("${COMPANY_NAME}"),
      hasDefaultPrimaryColor: template.includes(this.DEFAULT_VALUES.PRIMARY_COLOR),
      hasDefaultCompanyName: template.includes(this.DEFAULT_VALUES.COMPANY_NAME),
    });

    // First, replace template literal variables (${VARIABLE})
    const beforeVarReplace = processed;

    processed = processed.replace(/\$\{PRIMARY_COLOR\}/g, () => {
      replacements++;

      return branding.primaryColor;
    });
    processed = processed.replace(/\$\{SECONDARY_COLOR\}/g, () => {
      replacements++;

      return branding.secondaryColor || this.DEFAULT_VALUES.SECONDARY_COLOR;
    });
    processed = processed.replace(/\$\{COMPANY_NAME\}/g, () => {
      replacements++;

      return branding.companyName;
    });
    processed = processed.replace(/\$\{COMPANY_EMAIL\}/g, () => {
      replacements++;

      return branding.companyEmail;
    });
    processed = processed.replace(/\$\{COMPANY_WEBSITE\}/g, () => {
      replacements++;

      return branding.companyWebsite || this.DEFAULT_VALUES.COMPANY_WEBSITE;
    });
    processed = processed.replace(/\$\{LOGO_URL\}/g, () => {
      replacements++;

      return branding.logo || this.DEFAULT_VALUES.LOGO_URL;
    });

    /*
     * If no template variables were found, try replacing hardcoded default values.
     * This handles cases where templates were saved with default values already baked in.
     */
    if (beforeVarReplace === processed) {
      logger.debug("No template variables found, checking for hardcoded default values");

      // Only replace if the default value matches exactly (to avoid false positives)
      if (processed.includes(this.DEFAULT_VALUES.PRIMARY_COLOR) &&
          branding.primaryColor !== this.DEFAULT_VALUES.PRIMARY_COLOR) {
        processed = processed.replace(
          new RegExp(this.escapeRegex(this.DEFAULT_VALUES.PRIMARY_COLOR), "g"),
          branding.primaryColor
        );
        replacements++;

        logger.debug("Replaced hardcoded primary color", {
          from: this.DEFAULT_VALUES.PRIMARY_COLOR,
          to: branding.primaryColor,
        });
      }

      if (processed.includes(this.DEFAULT_VALUES.COMPANY_NAME) &&
          branding.companyName !== this.DEFAULT_VALUES.COMPANY_NAME) {
        processed = processed.replace(
          new RegExp(this.escapeRegex(this.DEFAULT_VALUES.COMPANY_NAME), "g"),
          branding.companyName
        );
        replacements++;

        logger.debug("Replaced hardcoded company name", {
          from: this.DEFAULT_VALUES.COMPANY_NAME,
          to: branding.companyName,
        });
      }

      if (processed.includes(this.DEFAULT_VALUES.COMPANY_EMAIL) &&
          branding.companyEmail !== this.DEFAULT_VALUES.COMPANY_EMAIL) {
        processed = processed.replace(
          new RegExp(this.escapeRegex(this.DEFAULT_VALUES.COMPANY_EMAIL), "g"),
          branding.companyEmail
        );
        replacements++;

        logger.debug("Replaced hardcoded company email", {
          from: this.DEFAULT_VALUES.COMPANY_EMAIL,
          to: branding.companyEmail,
        });
      }

      /*
       * Also replace primary color in common MJML patterns.
       * Pattern: background-color="#2563EB" or background-color="${PRIMARY_COLOR}"
       */
      if (branding.primaryColor !== this.DEFAULT_VALUES.PRIMARY_COLOR) {
        const colorPattern = new RegExp(
          `(background-color=["']?)${this.escapeRegex(this.DEFAULT_VALUES.PRIMARY_COLOR)}(["']?)`,
          "gi"
        );

        const beforeColorReplace = processed;

        processed = processed.replace(
          colorPattern,
          `$1${branding.primaryColor}$2`
        );

        if (processed !== beforeColorReplace) {
          replacements++;
          logger.debug("Replaced primary color in background-color attribute");
        }

        // Pattern: color="#2563EB" in style attributes or links
        const textColorPattern = new RegExp(
          `(style=["'][^"']*color:\\s*)${this.escapeRegex(this.DEFAULT_VALUES.PRIMARY_COLOR)}([;"'])`,
          "gi"
        );

        const beforeTextColorReplace = processed;

        processed = processed.replace(
          textColorPattern,
          `$1${branding.primaryColor}$2`
        );

        if (processed !== beforeTextColorReplace) {
          replacements++;
          logger.debug("Replaced primary color in style color attribute");
        }
      }
    }

    if (replacements > 0) {
      logger.debug("Template branding processed", {
        replacements,
        primaryColor: branding.primaryColor,
        companyName: branding.companyName,
      });
    } else {
      logger.debug("No branding replacements made in template");
    }

    return processed;
  }

  /**
   * Escape special regex characters in a string
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Inject branding into payload for Handlebars templates
   * This allows templates to use {{branding.primaryColor}} etc.
   */
  static injectBrandingIntoPayload(
    payload: Record<string, unknown>,
    branding: BrandingConfig,
  ): Record<string, unknown> {
    return {
      ...payload,
      branding: {
        companyName: branding.companyName,
        companyEmail: branding.companyEmail,
        companyWebsite: branding.companyWebsite,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        logo: branding.logo,
      },
    };
  }
}
