import "@saleor/macaw-ui/style";
import "@/styles/globals.css";

import { AppBridge, AppBridgeProvider } from "@saleor/app-sdk/app-bridge";
import { RoutePropagator } from "@saleor/app-sdk/app-bridge/next";
import { NoSSRWrapper } from "@saleor/apps-shared/no-ssr-wrapper";
import { ThemeSynchronizer } from "@saleor/apps-shared/theme-synchronizer";
import { ThemeProvider } from "@saleor/macaw-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppProps } from "next/app";
import { useRouter } from "next/router";

import { GraphQLProvider } from "@/modules/graphql/graphql-provider";
import { trpcClient } from "@/modules/trpc/trpc-client";

export const appBridgeInstance = typeof window !== "undefined" ? new AppBridge() : undefined;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function NextApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <NoSSRWrapper>
      <ThemeProvider>
        <AppBridgeProvider appBridgeInstance={appBridgeInstance}>
          <GraphQLProvider>
            <ThemeSynchronizer />
            <RoutePropagator />
            <QueryClientProvider client={queryClient}>
              <Component {...pageProps} key={router.asPath} />
              <Toaster position="bottom-right" />
            </QueryClientProvider>
          </GraphQLProvider>
        </AppBridgeProvider>
      </ThemeProvider>
    </NoSSRWrapper>
  );
}

export default trpcClient.withTRPC(NextApp);
