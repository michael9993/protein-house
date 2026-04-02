import { cacheExchange, createClient, fetchExchange } from "urql";

export const createInstrumentedGraphqlClient = (args: {
  saleorApiUrl: string;
  token?: string;
}) => {
  return createClient({
    url: args.saleorApiUrl,
    requestPolicy: "network-only",
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: {
      headers: {
        ...(args.token ? { Authorization: `Bearer ${args.token}` } : {}),
      },
    },
  });
};
