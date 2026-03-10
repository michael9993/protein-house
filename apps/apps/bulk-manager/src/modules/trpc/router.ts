import { router } from "./trpc-server";
import { importRouter } from "./routers/import-router";
import { channelsRouter } from "./routers/channels-router";
import { lookupsRouter } from "./routers/lookups-router";
import { productsRouter } from "./routers/products-router";
import { categoriesRouter } from "./routers/categories-router";
import { collectionsRouter } from "./routers/collections-router";
import { customersRouter } from "./routers/customers-router";
import { ordersRouter } from "./routers/orders-router";
import { vouchersRouter } from "./routers/vouchers-router";
import { giftCardsRouter } from "./routers/gift-cards-router";
import { translationsRouter } from "./routers/translations-router";

export const appRouter = router({
  import: importRouter,
  channels: channelsRouter,
  lookups: lookupsRouter,
  products: productsRouter,
  categories: categoriesRouter,
  collections: collectionsRouter,
  customers: customersRouter,
  orders: ordersRouter,
  vouchers: vouchersRouter,
  giftCards: giftCardsRouter,
  translations: translationsRouter,
});

export type AppRouter = typeof appRouter;
