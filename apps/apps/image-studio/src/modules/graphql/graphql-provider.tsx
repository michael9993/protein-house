import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { PropsWithChildren, useMemo } from "react";
import { Client, Provider, cacheExchange, fetchExchange } from "urql";

function createPlaceholderClient(): Client {
  return new Client({
    url: "https://placeholder.invalid/graphql/",
    exchanges: [cacheExchange, fetchExchange],
    requestPolicy: "cache-only",
  });
}

export function GraphQLProvider(props: PropsWithChildren<{}>) {
  const { appBridgeState } = useAppBridge();
  const saleorApiUrl = appBridgeState?.saleorApiUrl;
  const token = appBridgeState?.token;

  const client = useMemo(() => {
    if (!saleorApiUrl) {
      return createPlaceholderClient();
    }

    return createGraphQLClient({
      saleorApiUrl,
      token,
    });
  }, [saleorApiUrl, token]);

  return <Provider value={client} {...props} />;
}
