import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { SALEOR_API_URL_HEADER, SALEOR_AUTHORIZATION_BEARER_HEADER } from "@saleor/app-sdk/headers";

import { appBridgeInstance } from "../../pages/_app";
import { AppRouter } from "./router";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3001}`;
}

/**
 * Vanilla tRPC client for imperative (non-hook) calls like export queries.
 * Use this instead of trpcClient when you need to call .query() or .mutate()
 * outside of React's render cycle (e.g., in event handlers).
 */
export const trpcVanillaClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      headers() {
        const { token, saleorApiUrl } = appBridgeInstance?.getState() || {};

        if (!token || !saleorApiUrl) {
          console.error("Can't initialize tRPC client before establishing the App Bridge connection");
          throw new Error("Token and Saleor API URL unknown");
        }

        return {
          [SALEOR_AUTHORIZATION_BEARER_HEADER]: token,
          [SALEOR_API_URL_HEADER]: saleorApiUrl,
        };
      },
    }),
  ],
});
