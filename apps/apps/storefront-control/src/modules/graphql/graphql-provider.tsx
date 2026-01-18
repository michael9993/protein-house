import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { PropsWithChildren, useMemo } from "react";
import { Client, Provider, cacheExchange, fetchExchange } from "urql";

// Create a placeholder client for when saleorApiUrl is not yet available
// This prevents "No client has been specified" errors during initial render
function createPlaceholderClient(): Client {
  return new Client({
    url: "https://placeholder.invalid/graphql/",
    exchanges: [cacheExchange, fetchExchange],
    // Don't actually make requests
    requestPolicy: "cache-only",
  });
}

export function GraphQLProvider(props: PropsWithChildren<{}>) {
  const { appBridgeState } = useAppBridge();
  const saleorApiUrl = appBridgeState?.saleorApiUrl;
  const token = appBridgeState?.token;

  const client = useMemo(() => {
    if (!saleorApiUrl) {
      // Return placeholder client to prevent "No client" errors
      return createPlaceholderClient();
    }

    return createGraphQLClient({
      saleorApiUrl,
      token,
    });
  }, [saleorApiUrl, token]);

  return <Provider value={client} {...props} />;
}
