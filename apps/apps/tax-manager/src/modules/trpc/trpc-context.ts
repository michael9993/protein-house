import {
  SALEOR_API_URL_HEADER,
  SALEOR_AUTHORIZATION_BEARER_HEADER,
} from "@saleor/app-sdk/headers";
import { getAppBaseUrl } from "@saleor/apps-shared/get-app-base-url";
import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";

export async function createTrpcContext({ req, res }: CreateNextContextOptions) {
  const baseUrl = getAppBaseUrl(req.headers);
  return {
    token: req.headers[SALEOR_AUTHORIZATION_BEARER_HEADER] as string | undefined,
    saleorApiUrl: req.headers[SALEOR_API_URL_HEADER] as string | undefined,
    appId: undefined as string | undefined,
    appToken: undefined as string | undefined,
    ssr: undefined as boolean | undefined,
    baseUrl,
  };
}

export type TrpcContext = inferAsyncReturnType<typeof createTrpcContext>;
