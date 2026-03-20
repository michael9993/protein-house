import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createTrpcContextAppRouter } from "@/modules/trpc/context-app-router";
import { trpcRouter } from "@/modules/trpc/trpc-router";

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: trpcRouter,
    createContext: createTrpcContextAppRouter,
    onError: ({ path, error }) => {
      console.error(`tRPC ${path} error [${error.code}]:`, error.message, error.cause ?? "");
    },
  });
};

export { handler as GET, handler as POST };
