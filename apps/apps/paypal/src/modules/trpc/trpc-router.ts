import { appConfigRouter } from "@/modules/app-config/trpc-handlers/app-config-router";
import { transactionsRouter } from "@/modules/transactions-recording/transactions-router";

import { router } from "./trpc-server";

export const trpcRouter = router({
  appConfig: appConfigRouter,
  transactions: transactionsRouter,
});

export type TrpcRouter = typeof trpcRouter;
