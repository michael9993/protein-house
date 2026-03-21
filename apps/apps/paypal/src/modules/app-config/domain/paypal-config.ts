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
  readonly environment: PayPalEnv;
  readonly webhookId?: string;

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
    environment: PayPalEnv;
    webhookId?: string;
  }) {
    this.name = props.name;
    this.id = props.id;
    this.clientId = props.clientId;
    this.clientSecret = props.clientSecret;
    this.environment = props.environment;
    this.webhookId = props.webhookId;
  }

  static create(args: {
    name: string;
    id: string;
    clientId: PayPalClientId;
    clientSecret: PayPalClientSecret;
    environment?: PayPalEnv;
    webhookId?: string;
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
        environment: args.environment ?? "SANDBOX",
        webhookId: args.webhookId,
      }),
    );
  }
}

export type PayPalFrontendConfigSerializedFields = {
  readonly name: string;
  readonly id: string;
  readonly clientId: string;
  readonly maskedClientSecret: string;
  readonly environment: PayPalEnv;
};

/**
 * Safe class that only returns what's permitted to the UI.
 */
export class PayPalFrontendConfig implements PayPalFrontendConfigSerializedFields {
  readonly name: string;
  readonly id: string;
  readonly clientId: string;
  readonly maskedClientSecret: string;
  readonly environment: PayPalEnv;

  private constructor(fields: PayPalFrontendConfigSerializedFields) {
    this.name = fields.name;
    this.id = fields.id;
    this.clientId = fields.clientId;
    this.maskedClientSecret = fields.maskedClientSecret;
    this.environment = fields.environment;
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
      environment: config.environment,
    });
  }

  static createFromSerializedFields(fields: PayPalFrontendConfigSerializedFields) {
    return new PayPalFrontendConfig(fields);
  }
}
