// @ts-strict-ignore
import Grid from "@dashboard/components/Grid";
import { DashboardModal } from "@dashboard/components/Modal";
import { useTriggerWebhookDryRunMutation, WebhookEventTypeSyncEnum } from "@dashboard/graphql";
import {
  Alert,
  Button,
  List,
  ListBody,
  ListHeader,
  ListItem,
  ListItemCell,
} from "@saleor/macaw-ui";
import { Text } from "@saleor/macaw-ui-next";
import { Dispatch, SetStateAction, useState } from "react";
import { useIntl } from "react-intl";

import DryRunItemsList from "../DryRunItemsList/DryRunItemsList";
import { DocumentMap } from "../DryRunItemsList/utils";
import { messages } from "./messages";
import { getUnavailableObjects } from "./utils";

interface DryRunProps {
  query: string;
  showDialog: boolean;
  setShowDialog: Dispatch<SetStateAction<boolean>>;
  setResult: Dispatch<SetStateAction<string>>;
  syncEvents: WebhookEventTypeSyncEnum[];
}

const DryRun = ({ setResult, showDialog, setShowDialog, query, syncEvents }: DryRunProps) => {
  const intl = useIntl();
  const [objectId, setObjectId] = useState<string | null>(null);
  const [triggerWebhookDryRun] = useTriggerWebhookDryRunMutation();
  const capitalizeStr = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const availableObjects = Object.keys(DocumentMap).map(object =>
    capitalizeStr(object.split("_").join(" ").toLowerCase()),
  );
  const unavailableObjects = getUnavailableObjects(query);
  const [object, setObject] = useState<string | null>(null);
  const dryRun = async () => {
    const { data } = await triggerWebhookDryRun({
      variables: { objectId, query },
    });

    setResult(JSON.stringify(JSON.parse(data.webhookDryRun.payload), null, 2));
    closeDialog();
  };
  const closeDialog = () => {
    setShowDialog(false);
    setObjectId(null);
    setObject(null);
    setShowDialog(false);
  };

  if (!showDialog) {
    return <></>;
  }

  if (syncEvents.length > 0) {
    return (
      <DashboardModal onChange={closeDialog} open={showDialog}>
        <DashboardModal.Content size="lg" data-test-id="dry-run">
          <DashboardModal.Header>{intl.formatMessage(messages.header)}</DashboardModal.Header>

          <Alert variant="error" close={false}>
            <Text>{intl.formatMessage(messages.unavailableSyncEvents)}</Text>
          </Alert>
        </DashboardModal.Content>
      </DashboardModal>
    );
  }

  return (
    <DashboardModal onChange={closeDialog} open={showDialog}>
      <DashboardModal.Content size="lg" data-test-id="dry-run">
        <DashboardModal.Header>{intl.formatMessage(messages.header)}</DashboardModal.Header>

        <Text>{intl.formatMessage(messages.selectObject)}</Text>

        {!!unavailableObjects.length && (
          <Alert variant="warning" close={false} className="remove-icon-background">
            <Text>
              {intl.formatMessage(messages.unavailableEvents)}
              <br />
              <strong>{unavailableObjects.join(", ")}</strong>
            </Text>
          </Alert>
        )}

        <Grid variant="uniform">
          <div className="border-r border-[var(--mu-colors-border-default1)] p-6">
            <List gridTemplate={["1fr 50px"]}>
              <ListHeader>
                <ListItem className="uppercase p-2 min-h-0">
                  <ListItemCell className="!pl-0 break-all font-semibold">
                    {intl.formatMessage(messages.objects)}
                  </ListItemCell>
                  <ListItemCell></ListItemCell>
                </ListItem>
              </ListHeader>
              <ListBody className="h-[300px] overflow-y-auto">
                {!availableObjects.length && <Text>{intl.formatMessage(messages.noObjects)}</Text>}
                {availableObjects.map((object, idx) => (
                  <ListItem
                    key={idx}
                    className="min-h-0 gap-0 p-2 cursor-pointer"
                    onClick={() => setObject(object.split(" ").join("_").toUpperCase())}
                  >
                    <ListItemCell className="!pl-0 break-all font-semibold">
                      <strong>{capitalizeStr(object.replaceAll("_", " ").toLowerCase())}</strong>
                    </ListItemCell>
                    <ListItemCell></ListItemCell>
                  </ListItem>
                ))}
              </ListBody>
            </List>
          </div>
          <div className="p-8 pl-0">
            {object ? (
              <DryRunItemsList setObjectId={setObjectId} objectId={objectId} object={object} />
            ) : (
              <>
                <ListHeader>
                  <ListItem className="uppercase p-2 min-h-0">
                    <ListItemCell className="!pl-0 break-all font-semibold">
                      {intl.formatMessage(messages.item)}
                    </ListItemCell>
                  </ListItem>
                </ListHeader>
                <ListBody className="h-[300px] overflow-y-auto">
                  <Text>{intl.formatMessage(messages.itemsDefaultMessage)}</Text>
                </ListBody>
              </>
            )}
          </div>
        </Grid>

        <DashboardModal.Actions>
          <Button color="primary" variant="primary" onClick={dryRun} disabled={!object}>
            {intl.formatMessage(messages.run)}
          </Button>
        </DashboardModal.Actions>
      </DashboardModal.Content>
    </DashboardModal>
  );
};

DryRun.displayName = "DryRun";
export default DryRun;
