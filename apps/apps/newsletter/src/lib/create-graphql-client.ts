import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";

export const createSimpleGraphQLClient = (props: { saleorApiUrl: string; token: string }) =>
  createGraphQLClient({
    saleorApiUrl: props.saleorApiUrl,
    token: props.token,
  });
