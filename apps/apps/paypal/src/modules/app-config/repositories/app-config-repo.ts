import { Result } from "neverthrow";

import { BaseError } from "@/lib/errors";
import { AppRootConfig } from "@/modules/app-config/domain/app-root-config";
import { PayPalConfig } from "@/modules/app-config/domain/paypal-config";
import { SaleorApiUrl } from "@/modules/saleor/saleor-api-url";

export type BaseAccessPattern = {
  saleorApiUrl: SaleorApiUrl;
  appId: string;
};

export type PayPalConfigByChannelIdAccessPattern = BaseAccessPattern & {
  channelId: string;
};

export type PayPalConfigByConfigIdAccessPattern = BaseAccessPattern & {
  configId: string;
};

export type GetPayPalConfigAccessPattern =
  | PayPalConfigByChannelIdAccessPattern
  | PayPalConfigByConfigIdAccessPattern;

export const AppConfigRepoError = {
  FailureSavingConfig: BaseError.subclass("FailureSavingConfigError", {
    props: { _internalName: "AppConfigRepoError.FailureSavingConfigError" },
  }),
  FailureFetchingConfig: BaseError.subclass("FailureFetchingConfigError", {
    props: { _internalName: "AppConfigRepoError.FailureFetchingConfigError" },
  }),
  FailureRemovingConfig: BaseError.subclass("FailureRemovingConfigError", {
    props: { _internalName: "AppConfigRepoError.FailureRemovingConfig" },
  }),
};

export interface AppConfigRepo {
  savePayPalConfig: (args: {
    config: PayPalConfig;
    saleorApiUrl: SaleorApiUrl;
    appId: string;
  }) => Promise<Result<null | void, InstanceType<typeof AppConfigRepoError.FailureSavingConfig>>>;

  getPayPalConfig: (
    access: GetPayPalConfigAccessPattern,
  ) => Promise<
    Result<PayPalConfig | null, InstanceType<typeof AppConfigRepoError.FailureFetchingConfig>>
  >;

  getRootConfig: (
    access: BaseAccessPattern,
  ) => Promise<
    Result<AppRootConfig, InstanceType<typeof AppConfigRepoError.FailureFetchingConfig>>
  >;

  removeConfig: (
    access: BaseAccessPattern,
    data: { configId: string },
  ) => Promise<Result<null, InstanceType<typeof AppConfigRepoError.FailureRemovingConfig>>>;

  updateMapping: (
    access: BaseAccessPattern,
    data: { configId: string | null; channelId: string },
  ) => Promise<Result<void | null, InstanceType<typeof AppConfigRepoError.FailureSavingConfig>>>;
}
