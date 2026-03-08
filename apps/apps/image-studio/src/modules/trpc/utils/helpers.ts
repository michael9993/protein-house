import { TRPCError } from "@trpc/server";

interface GraphQLError {
  message: string;
  extensions?: Record<string, unknown>;
}

interface QueryResult {
  data?: unknown;
  error?: {
    graphQLErrors?: GraphQLError[];
    networkError?: { message: string };
    message?: string;
  };
}

export function assertQuerySuccess(result: QueryResult, operationName: string) {
  if (result.error) {
    const gqlErrors = result.error.graphQLErrors?.map((e) => e.message).join("; ");
    const networkError = result.error.networkError?.message;
    const errorMsg = gqlErrors || networkError || result.error.message || "Unknown GraphQL error";
    console.error(`[${operationName}] GraphQL error:`, errorMsg);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `GraphQL query failed (${operationName}): ${errorMsg}`,
    });
  }
}
