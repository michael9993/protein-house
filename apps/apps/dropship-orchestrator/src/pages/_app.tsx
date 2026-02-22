import "../styles/globals.css";

import { AppBridge, AppBridgeProvider } from "@saleor/app-sdk/app-bridge";
import { RoutePropagator } from "@saleor/app-sdk/app-bridge/next";
import { NoSSRWrapper } from "@saleor/apps-shared/no-ssr-wrapper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProps } from "next/app";

import { GraphQLProvider } from "@/modules/graphql/graphql-provider";
import { trpcClient } from "@/modules/trpc/trpc-client";

/**
 * Ensure instance is a singleton.
 */
export const appBridgeInstance = typeof window !== "undefined" ? new AppBridge() : undefined;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function NextApp({ Component, pageProps }: AppProps) {
  return (
    <NoSSRWrapper>
      <AppBridgeProvider appBridgeInstance={appBridgeInstance}>
        <GraphQLProvider>
          <RoutePropagator />
          <QueryClientProvider client={queryClient}>
            <div className="p-6 max-w-7xl mx-auto">
              <Component {...pageProps} />
            </div>
          </QueryClientProvider>
        </GraphQLProvider>
      </AppBridgeProvider>
    </NoSSRWrapper>
  );
}

export default trpcClient.withTRPC(NextApp);
