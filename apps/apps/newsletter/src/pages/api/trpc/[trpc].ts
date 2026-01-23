import * as trpcNext from "@trpc/server/adapters/next";

import { appRouter } from "../../../modules/trpc/router";
import { createTrpcContext } from "../../../modules/trpc/trpc-context";
// Initialize campaign worker on server startup
import "../../../modules/newsletter/campaigns/init-worker";

const handler = trpcNext.createNextApiHandler({
    router: appRouter,
    createContext: createTrpcContext,
    onError: ({ path, error }) => {
        if (error.code === "INTERNAL_SERVER_ERROR") {
            console.error(`${path} returned error:`, error);
            return;
        }
        console.debug(`${path} returned error:`, error);
    },
});

export default handler;
