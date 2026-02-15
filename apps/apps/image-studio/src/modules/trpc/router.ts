import { router } from "./trpc-server";
import { protectedClientProcedure } from "./protected-client-procedure";
import { productsRouter } from "./routers/products-router";
import { mediaRouter } from "./routers/media-router";
import { aiRouter } from "./routers/ai-router";
import { enhanceRouter } from "./routers/enhance-router";

export const appRouter = router({
  healthCheck: protectedClientProcedure.query(() => {
    return { status: "ok" };
  }),
  products: productsRouter,
  media: mediaRouter,
  ai: aiRouter,
  enhance: enhanceRouter,
});

export type AppRouter = typeof appRouter;
