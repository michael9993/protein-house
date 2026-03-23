import { AppConfigRepo } from "@/modules/app-config/repositories/app-config-repo";
import { FileAppConfigRepo } from "@/modules/app-config/repositories/file/file-app-config-repo";
import { PostgresAppConfigRepo } from "@/modules/app-config/repositories/postgres/postgres-app-config-repo";
import { createLogger } from "@/lib/logger";

const logger = createLogger("AppConfigRepoImpl");

function createAppConfigRepo(): AppConfigRepo {
  const apl = process.env.APL ?? "file";

  if (apl === "postgres") {
    logger.info("Using PostgreSQL config repository");
    return new PostgresAppConfigRepo();
  }

  logger.info("Using file-based config repository");
  return new FileAppConfigRepo();
}

export const appConfigRepoImpl = createAppConfigRepo();
