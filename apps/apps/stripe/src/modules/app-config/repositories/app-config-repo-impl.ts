import { PostgresAppConfigRepo } from "@/modules/app-config/repositories/postgres/postgres-app-config-repo";

/*
 * Config storage: Always uses PostgreSQL
 * All configs, channel mappings, and transactions are stored in PostgreSQL
 */
export const appConfigRepoImpl = new PostgresAppConfigRepo();
