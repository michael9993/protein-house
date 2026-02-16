import { useAppFailedPendingWebhooksLazyQuery } from "@dashboard/graphql";
import { useMemo } from "react";

import { getLatestFailedAttemptFromWebhooks, LatestWebhookDeliveryWithDate } from "./utils";

interface AppsFailedDeliveries {
  hasFailed: boolean;
  fetchAppsWebhooks: () => void;
  lastFailedWebhookDate: Date | null;
}

export const useAppsFailedDeliveries = (): AppsFailedDeliveries => {
  const [fetchAppsWebhooks, { data }] = useAppFailedPendingWebhooksLazyQuery({
    fetchPolicy: "no-cache",
  });

  const lastFailedWebhookDate: Date | null = useMemo(
    () =>
      data?.apps?.edges.reduce<LatestWebhookDeliveryWithDate | null>((acc, app) => {
        const latestFailedAttempt = getLatestFailedAttemptFromWebhooks(app.node.webhooks ?? []);

        if (!latestFailedAttempt) {
          return acc;
        }

        if (!acc) {
          return latestFailedAttempt;
        }

        return latestFailedAttempt.createdAt > acc.createdAt ? latestFailedAttempt : acc;
      }, null)?.createdAt ?? null,
    [data?.apps?.edges],
  );

  const handleFetchAppsWebhooks = () => {
    // Permissions are checked outside of this hook
    fetchAppsWebhooks({
      variables: {
        canFetchAppEvents: true,
      },
    });
  };

  return {
    hasFailed: !!lastFailedWebhookDate,
    lastFailedWebhookDate,
    fetchAppsWebhooks: handleFetchAppsWebhooks,
  };
};
