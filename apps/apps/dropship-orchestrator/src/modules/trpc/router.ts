import { router } from "./trpc-server";
import { suppliersRouter } from "./routers/suppliers-router";
import { ordersRouter } from "./routers/orders-router";
import { exceptionsRouter } from "./routers/exceptions-router";
import { settingsRouter } from "./routers/settings-router";
import { auditRouter } from "./routers/audit-router";
import { dashboardRouter } from "./routers/dashboard-router";
import { sourceRouter } from "./routers/source-router";
import { pricingRouter } from "./routers/pricing-router";
import { returnsRouter } from "./routers/returns-router";

export const appRouter = router({
  suppliers: suppliersRouter,
  orders: ordersRouter,
  exceptions: exceptionsRouter,
  settings: settingsRouter,
  audit: auditRouter,
  dashboard: dashboardRouter,
  source: sourceRouter,
  pricing: pricingRouter,
  returns: returnsRouter,
});

export type AppRouter = typeof appRouter;
