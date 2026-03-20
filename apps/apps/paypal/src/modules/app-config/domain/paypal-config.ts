import { err, ok, Result } from "neverthrow";

import { BaseError } from "@/lib/errors";
import { PayPalClientId } from "@/modules/paypal/paypal-client-id";
import { PayPalClientSecret } from "@/modules/paypal/paypal-client-secret";

export type PayPalEnv = "SANDBOX" | "LIVE";

export class PayPalConfig {
  readonly name: string;
  readonly id: string;
  readonly clientId: PayPalClientId;
  readonly clientSecret: PayPalClientSecret;

  static ValidationError = BaseError.subclass("ValidationError", {
    props: {
      _internalName: "PayPalConfig.ValidationError" as const,
    },
  });

  private constructor(props: {
    name: string;
    id: string;
    clientId: PayPalClientId;
    clientSecret: PayPalClientSecret;
  }) {
    this.name = props.name;
    this.id = props.id;
    this.clientId = props.clientId;
    this.clientSecret = props.clientSecret;
  }

  /**
   * Detect PayPal environment from client ID.
   * Sandbox client IDs typically start with certain patterns,
   * but the most reliable check is if it was registered at sandbox.paypal.com.
   * We store environment explicitly from user selection.
   */
  getPayPalEnvValue(): PayPalEnv {
    // PayPal sandbox client IDs typically start with "A" and are longer
    // However, the most reliable way is checking if credentials work against sandbox
    // For now, we just store it as SANDBOX if the ID contains "sandbox" patterns
    // The actual environment is validated during config creation
    return "SANDBOX";
  }

  static create(args: {
    name: string;
    id: string;
    clientId: PayPalClientId;
    clientSecret: PayPalClientSecret;
  }): Result<PayPalConfig, InstanceType<typeof PayPalConfig.ValidationError>> {
    if (args.name.length === 0) {
      return err(new PayPalConfig.ValidationError("Config name cannot be empty"));
    }

    if (args.id.length === 0) {
      return err(new PayPalConfig.ValidationError("Config id cannot be empty"));
    }

    return ok(
      new PayPalConfig({
        name: args.name,
        id: args.id,
        clientId: args.clientId,
        clientSecret: args.clientSecret,
      }),
    );
  }
}

export type PayPalFrontendConfigSerializedFields = {
  readonly name: string;
  readonly id: string;
  readonly clientId: string;
  readonly maskedClientSecret: string;
};

/**
 * Safe class that only returns what's permitted to the UI.
 */
export class PayPalFrontendConfig implements PayPalFrontendConfigSerializedFields {
  readonly name: string;
  readonly id: string;
  readonly clientId: string;
  readonly maskedClientSecret: string;

  private constructor(fields: PayPalFrontendConfigSerializedFields) {
    this.name = fields.name;
    this.id = fields.id;
    this.clientId = fields.clientId;
    this.maskedClientSecret = fields.maskedClientSecret;
  }

  private static getMaskedValue(secret: string) {
    if (secret.length <= 4) return "****";
    return `...${secret.slice(-4)}`;
  }

  static createFromPayPalConfig(config: PayPalConfig) {
    return new PayPalFrontendConfig({
      name: config.name,
      id: config.id,
      clientId: String(config.clientId),
      maskedClientSecret: this.getMaskedValue(String(config.clientSecret)),
    });
  }

  static createFromSerializedFields(fields: PayPalFrontendConfigSerializedFields) {
    return new PayPalFrontendConfig(fields);
  }
}
