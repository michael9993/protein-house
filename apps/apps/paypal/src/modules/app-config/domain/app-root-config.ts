import { PayPalConfig } from "@/modules/app-config/domain/paypal-config";

export class AppRootConfig {
  readonly channelConfigMapping: Record<string, string>;
  readonly paypalConfigsById: Record<string, PayPalConfig>;

  constructor(
    channelConfigMapping: Record<string, string>,
    paypalConfigsById: Record<string, PayPalConfig>,
  ) {
    this.channelConfigMapping = channelConfigMapping;
    this.paypalConfigsById = paypalConfigsById;
  }

  getAllConfigsAsList() {
    return Object.values(this.paypalConfigsById);
  }

  getChannelsBoundToGivenConfig(configId: string) {
    const keyValues = Object.entries(this.channelConfigMapping);
    const filtered = keyValues.filter(([_, value]) => value === configId);
    return filtered.map(([channelId]) => channelId);
  }
}
