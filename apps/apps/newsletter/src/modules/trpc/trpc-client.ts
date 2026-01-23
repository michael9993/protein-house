import { SALEOR_API_URL_HEADER, SALEOR_AUTHORIZATION_BEARER_HEADER } from "@saleor/app-sdk/headers";
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";

import { appBridgeInstance } from "../../pages/_app";
import { AppRouter } from "./router";

function getBaseUrl() {
    if (typeof window !== "undefined") return "";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpcClient = createTRPCNext<AppRouter>({
    config() {
        return {
            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                    headers() {
                        const { token, saleorApiUrl } = appBridgeInstance?.getState() || {};

                        if (!token || !saleorApiUrl) {
                            // Return empty headers if App Bridge is not ready yet
                            // The query will be retried once App Bridge is ready
                            // Don't log warning - this is expected during initialization
                            return {};
                        }

                        return {
                            [SALEOR_AUTHORIZATION_BEARER_HEADER]: token,
                            [SALEOR_API_URL_HEADER]: saleorApiUrl,
                        };
                    },
                }),
            ],
            queryClientConfig: {
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        retry: (failureCount, error: any) => {
                            // Retry if it's a BAD_REQUEST about App Bridge not being ready
                            if (error?.data?.code === "BAD_REQUEST" && error?.message?.includes("App Bridge not ready")) {
                                return failureCount < 5; // Retry up to 5 times
                            }
                            return false; // Don't retry other errors
                        },
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
                    },
                },
            },
        };
    },
    ssr: false,
});
