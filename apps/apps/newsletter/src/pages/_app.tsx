import "@saleor/macaw-ui/style";

import { AppBridge, AppBridgeProvider, useAppBridge } from "@saleor/app-sdk/app-bridge";
import { RoutePropagator } from "@saleor/app-sdk/app-bridge/next";
import { NoSSRWrapper } from "@saleor/apps-shared/no-ssr-wrapper";
import { ThemeSynchronizer } from "@saleor/apps-shared/theme-synchronizer";
import { Box, ThemeProvider } from "@saleor/macaw-ui";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { AppProps } from "next/app";
import { useEffect, useRef } from "react";

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

/**
 * Component that refetches all queries when App Bridge becomes ready
 */
function AppBridgeReadyRefetcher() {
  const { appBridgeState } = useAppBridge();
  const queryClient = useQueryClient();
  const hasRefetched = useRef(false);

  useEffect(() => {
    if (appBridgeState?.ready && !hasRefetched.current) {
      hasRefetched.current = true;
      // Refetch all queries when App Bridge becomes ready
      queryClient.refetchQueries();
    } else if (!appBridgeState?.ready) {
      // Reset flag when App Bridge becomes not ready
      hasRefetched.current = false;
    }
  }, [appBridgeState?.ready, queryClient]);

  return null;
}

/**
 * Suppress App Bridge initialization warnings when accessed outside iframe
 */
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Suppress App Bridge warnings about missing saleorApiUrl in iframe URL
    // This is expected when accessing the app directly (not in iframe)
    const message = args[0]?.toString() || "";
    if (
      message.includes("saleorApiUrl param was not found in iframe url") ||
      message.includes("notifyReady action failed") ||
      message.includes("Action response timed out")
    ) {
      // Suppress these expected warnings
      return;
    }
    originalError.apply(console, args);
  };
}

function NextApp({ Component, pageProps }: AppProps) {
  return (
    <NoSSRWrapper>
      <ThemeProvider>
        <AppBridgeProvider appBridgeInstance={appBridgeInstance}>
          <GraphQLProvider>
            <ThemeSynchronizer />
            <RoutePropagator />
            <QueryClientProvider client={queryClient}>
              <AppBridgeReadyRefetcher />
              <Box padding={10}>
                <Component {...pageProps} />
              </Box>
            </QueryClientProvider>
          </GraphQLProvider>
        </AppBridgeProvider>
      </ThemeProvider>
    </NoSSRWrapper>
  );
}

export default trpcClient.withTRPC(NextApp);
