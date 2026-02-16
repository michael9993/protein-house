import { AppEventDeliveriesFragment, EventDeliveryStatusEnum } from "@dashboard/graphql";

export type Webhook = NonNullable<AppEventDeliveriesFragment["webhooks"]>[0];

type LatestWebhookDelivery =
  | NonNullable<Webhook["failedDelivers"]>["edges"][0]["node"]
  | NonNullable<
      NonNullable<Webhook["pendingDelivers"]>["edges"][0]["node"]["attempts"]
    >["edges"][0]["node"];

export type LatestWebhookDeliveryWithDate = LatestWebhookDelivery & { createdAt: Date };

const toWebhookDeliveryWithDate = (
  delivery: LatestWebhookDelivery | null | undefined,
): LatestWebhookDeliveryWithDate | null =>
  delivery
    ? {
        ...delivery,
        createdAt: new Date(delivery.createdAt),
      }
    : null;

const getLatest = (
  a: LatestWebhookDeliveryWithDate | null,
  b: LatestWebhookDeliveryWithDate | null,
) => {
  if (a && b) {
    return a.createdAt > b.createdAt ? a : b;
  }

  return a ?? b;
};

const getLatestFailedAttemptFromWebhook = (
  webhook: Webhook,
): LatestWebhookDeliveryWithDate | null => {
  // Edge case: Saleor failed to make a single delivery attempt
  const failedEventDelivery = toWebhookDeliveryWithDate(webhook.failedDelivers?.edges?.[0]?.node);
  const fromFailedDeliveryAttempts = toWebhookDeliveryWithDate(
    webhook.failedDelivers?.edges?.[0]?.node?.attempts?.edges?.[0]?.node,
  );

  // handling the edge case and checking which one is newer
  const fromFailedDelivers = getLatest(failedEventDelivery, fromFailedDeliveryAttempts);

  const fromPendingDelivers = toWebhookDeliveryWithDate(
    webhook.pendingDelivers?.edges?.[0]?.node.attempts?.edges.find(
      ({ node: { status } }) => status === EventDeliveryStatusEnum.FAILED,
    )?.node,
  );

  return getLatest(fromFailedDelivers, fromPendingDelivers);
};

export const getLatestFailedAttemptFromWebhooks = (webhooks: Webhook[]) =>
  webhooks
    .map(getLatestFailedAttemptFromWebhook)
    .filter(Boolean)
    .sort((a, b) => b!.createdAt.getTime() - a!.createdAt.getTime())[0] ?? null;
