import { SALEOR_API_URL_HEADER, SALEOR_AUTHORIZATION_BEARER_HEADER } from "@saleor/app-sdk/headers";
import { inferAsyncReturnType } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { Client } from "urql";

import { AppConfigRepo } from "@/modules/app-config/repositories/app-config-repo";
import { appConfigRepoImpl } from "@/modules/app-config/repositories/app-config-repo-impl";
import { createLogger } from "@/lib/logger";

const logger = createLogger("trpcContext");

const normalizeSaleorApiUrl = (url: string): string => {
  if (!url.endsWith("/graphql/")) {
    if (url.endsWith("/graphql")) return url + "/";
    if (url.endsWith("/")) return url + "graphql/";
    return url + "/graphql/";
  }
  return url;
};

const overrideSaleorApiUrl = (incomingUrl: string | null): string | undefined => {
  const envSaleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;

  if (envSaleorApiUrl && incomingUrl && incomingUrl.includes("localhost:8000")) {
    return normalizeSaleorApiUrl(envSaleorApiUrl);
  }

  if (incomingUrl) return normalizeSaleorApiUrl(incomingUrl);
  return undefined;
};

export const createTrpcContextAppRouter = async ({ req }: FetchCreateContextFnOptions) => {
  const incomingSaleorApiUrl = req.headers.get(SALEOR_API_URL_HEADER);
  const saleorApiUrl = overrideSaleorApiUrl(incomingSaleorApiUrl);

  return {
    token: req.headers.get(SALEOR_AUTHORIZATION_BEARER_HEADER) as string | undefined,
    saleorApiUrl,
    appId: undefined as undefined | string,
    apiClient: null as Client | null,
    configRepo: appConfigRepoImpl as AppConfigRepo,
    appUrl: req.headers.get("origin"),
  };
};

export type TrpcContextAppRouter = inferAsyncReturnType<typeof createTrpcContextAppRouter>;
