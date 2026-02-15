import { TRPCError } from "@trpc/server";

export function assertQuerySuccess(result: { data?: any; error?: any }, operationName: string) {
  if (result.error) {
    const gqlErrors = result.error.graphQLErrors?.map((e: any) => e.message).join("; ");
    const networkError = result.error.networkError?.message;
    const errorMsg = gqlErrors || networkError || result.error.message || "Unknown GraphQL error";
    console.error(`[${operationName}] GraphQL error:`, errorMsg);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `GraphQL query failed (${operationName}): ${errorMsg}`,
    });
  }
}
