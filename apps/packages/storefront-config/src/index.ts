// Main entry point for @saleor/apps-storefront-config
export * from "./schema";
export * from "./types";
export { applyMigrations, migrateV1toV2 } from "./migrations";
export { CONFIG_VERSION } from "./defaults";
