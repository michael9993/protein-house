import * as trpcNext from "@trpc/server/adapters/next";

import { appRouter } from "@/modules/trpc/router";
import { createTrpcContext } from "@/modules/trpc/trpc-context";
import { createLogger } from "@/logger";

const logger = createLogger("trpc-handler");

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: createTrpcContext,
  onError({ error, path }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      logger.error(`tRPC error on ${path}`, { error: error.message });
    } else {
      logger.debug(`tRPC error on ${path}`, { code: error.code });
    }
  },
});
