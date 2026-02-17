import { DashboardCard } from "@dashboard/components/Card";
import Grid from "@dashboard/components/Grid";
import Hr from "@dashboard/components/Hr";
import { WebhookEventTypeAsyncEnum, WebhookEventTypeSyncEnum } from "@dashboard/graphql";
import { ChangeEvent } from "@dashboard/hooks/useForm";
import { capitalize } from "@dashboard/misc";
import {
  List,
  ListBody,
  ListHeader,
  ListItem,
  ListItemCell,
} from "@saleor/macaw-ui";
import { Box, Checkbox, Chip, Switch, Text } from "@saleor/macaw-ui-next";
import { Dispatch, SetStateAction, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { messages } from "./messages";
import { EventTypes, getEventName } from "./utils";

interface WebhookEventsProps {
  data: {
    syncEvents: WebhookEventTypeSyncEnum[];
    asyncEvents: WebhookEventTypeAsyncEnum[];
  };
  setQuery: Dispatch<SetStateAction<string>>;
  onSyncEventChange: (event: ChangeEvent) => void;
  onAsyncEventChange: (event: ChangeEvent) => void;
}

type WebhookEventTypeSelection = "sync" | "async";

export const WebhookEvents = ({
  data,
  setQuery,
  onSyncEventChange,
  onAsyncEventChange,
}: WebhookEventsProps) => {
  const intl = useIntl();
  const [tab, setTab] = useState<WebhookEventTypeSelection>("async");
  const [object, setObject] = useState<string | null>(null);

  const handleEventChange = (event: ChangeEvent) => {
    if (tab === "sync") {
      return onSyncEventChange(event);
    }

    return onAsyncEventChange(event);
  };

  const handleTabChange = (value: string) => {
    setObject(null);
    setQuery("");
    setTab(value as WebhookEventTypeSelection);
  };

  const countEvents = (object: string) => {
    const selected: string[] = tab === "sync" ? data.syncEvents : data.asyncEvents;
    const objectEvents = EventTypes[tab][object].map(event => {
      if (event === object) {
        return object;
      }

      return `${object}_${event}`;
    });

    return objectEvents.filter(event => selected.includes(event)).length;
  };

  return (
    <>
      <DashboardCard>
        <DashboardCard.Header>
          <DashboardCard.Title>{intl.formatMessage(messages.webhookEvents)}</DashboardCard.Title>
        </DashboardCard.Header>
        <DashboardCard.Content>
          <Box display="flex" padding={1} borderRadius={3}>
            <Switch value={tab} onValueChange={handleTabChange}>
              <Switch.Item id="async" value="async" fontWeight="medium">
                {intl.formatMessage(messages.asynchronous)}
              </Switch.Item>
              <Switch.Item id="sync" value="sync" fontWeight="medium">
                {intl.formatMessage(messages.synchronous)}
              </Switch.Item>
            </Switch>
          </Box>
          <Text fontSize={2} paddingLeft={1}>
            {tab === "sync" ? (
              <FormattedMessage {...messages.synchronousDescription} />
            ) : (
              <FormattedMessage {...messages.asynchronousDescription} />
            )}
          </Text>
        </DashboardCard.Content>
        <Hr />
        <Grid variant="uniform">
          <div className="border-r border-border-default1 p-6">
            <List gridTemplate={["1fr 50px"]}>
              <ListHeader>
                <ListItem className="min-h-0 p-2 uppercase">
                  <ListItemCell className="!pl-0 break-all font-semibold">
                    <FormattedMessage {...messages.objects} />
                  </ListItemCell>
                  <ListItemCell></ListItemCell>
                </ListItem>
              </ListHeader>
              <ListBody className="h-[300px] overflow-y-auto">
                {Object.keys(EventTypes[tab]).map((object, idx) => {
                  const eventCount = countEvents(object);

                  return (
                    <ListItem
                      data-test-id="webhook-objects-items"
                      key={idx}
                      className="min-h-0 cursor-pointer gap-0 p-2"
                      onClick={() => setObject(object)}
                    >
                      <ListItemCell className="!pl-0 break-all font-semibold">
                        {capitalize(object.replaceAll("_", " ").toLowerCase())}
                      </ListItemCell>
                      <ListItemCell>
                        {eventCount > 0 && (
                          <Chip size="small" backgroundColor="critical1" color="critical1">
                            {eventCount}
                          </Chip>
                        )}
                      </ListItemCell>
                    </ListItem>
                  );
                })}
              </ListBody>
            </List>
          </div>
          <div className="p-8 pl-0">
            <List gridTemplate={["1fr"]}>
              <ListHeader>
                <ListItem className="min-h-0 p-2 uppercase">
                  <ListItemCell className="!pl-0 break-all font-semibold">
                    <FormattedMessage {...messages.events} />
                  </ListItemCell>
                </ListItem>
              </ListHeader>
              <ListBody className="h-[300px] overflow-y-auto">
                {object &&
                  EventTypes[tab][object] &&
                  EventTypes[tab][object].map((event, idx) => (
                    <ListItem className="min-h-0 cursor-pointer gap-0 p-0 [grid-template-columns:unset]" key={event}>
                      <ListItemCell className="!p-0 break-all">
                        <Checkbox
                          data-test-id="events-checkbox"
                          name={`${tab}Events`}
                          checked={(data[`${tab}Events`] as WebhookEventTypeSyncEnum[]).includes(
                            getEventName(object, event),
                          )}
                          value={getEventName(object, event)}
                          onCheckedChange={checked =>
                            handleEventChange({
                              target: {
                                name: `${tab}Events`,
                                value: getEventName(object, event),
                                // @ts-expect-error incorrect useForm types - cannot set required checked property
                                checked,
                              },
                            })
                          }
                          id={`event-checkbox-${idx}`}
                          paddingX={1.5}
                          paddingY={3.5}
                          fontWeight="bold"
                        >
                          {capitalize(event.toLowerCase().replaceAll("_", " "))}
                        </Checkbox>
                      </ListItemCell>
                    </ListItem>
                  ))}
              </ListBody>
            </List>
          </div>
        </Grid>
        <Hr />
      </DashboardCard>
    </>
  );
};

WebhookEvents.displayName = "WebhookEvents";
