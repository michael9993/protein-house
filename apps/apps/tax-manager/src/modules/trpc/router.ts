import { router } from "./trpc-server";
import { rulesRouter } from "./routers/rules-router";
import { channelsRouter } from "./routers/channels-router";
import { presetsRouter } from "./routers/presets-router";
import { reportsRouter } from "./routers/reports-router";

export const appRouter = router({
  rules: rulesRouter,
  channels: channelsRouter,
  presets: presetsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
