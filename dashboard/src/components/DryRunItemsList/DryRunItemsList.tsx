// @ts-strict-ignore

import { useQuery } from "@dashboard/hooks/graphql";
import { mapEdgesToItems } from "@dashboard/utils/maps";
import {
  List,
  ListBody,
  ListHeader,
  ListItem,
  ListItemCell,
  useListWidths,
} from "@saleor/macaw-ui";
import { Skeleton } from "@saleor/macaw-ui-next";
import camelCase from "lodash/camelCase";
import * as React from "react";
import { useIntl } from "react-intl";

import Avatar from "../TableCellAvatar/Avatar";
import { messages } from "./messages";
import { DocumentMap, TData, TVariables } from "./utils";

interface DryRunItemsListProps {
  objectId: string;
  setObjectId: React.Dispatch<any>;
  object: string;
}

const DryRunItemsList = ({ object, objectId, setObjectId }: DryRunItemsListProps) => {
  const intl = useIntl();
  const { checkbox } = useListWidths();
  const objectDocument = DocumentMap[object];
  const objectCollection = objectDocument.collection ?? camelCase(`${object.toLowerCase()}s`);
  const { data, loading } = useQuery<TData, TVariables>(objectDocument.document, {
    displayLoader: true,
    variables: objectDocument.variables,
  });

  return (
    <List gridTemplate={["1fr", checkbox, checkbox]} data-test-id="dry-run-items-list">
      <ListHeader>
        <ListItem className="uppercase p-2 min-h-0">
          <ListItemCell className="!pl-0 break-all font-semibold">
            {intl.formatMessage(messages.item)}
            &nbsp;
            {objectDocument.collection
              ?.split(/(?=[A-Z])/)
              .map(item => item.toLowerCase())
              .join(" ")}
            &nbsp;
            {objectDocument.displayedAttribute}
          </ListItemCell>
        </ListItem>
      </ListHeader>
      <ListBody className="h-[300px] overflow-y-auto">
        {loading ? (
          <ListItem className="min-h-0 gap-0 p-2 cursor-pointer">
            <ListItemCell className="!pl-0 break-all font-semibold">
              <Skeleton />
            </ListItemCell>
            <ListItemCell>
              <Skeleton />
            </ListItemCell>
            <ListItemCell>
              <Skeleton />
            </ListItemCell>
          </ListItem>
        ) : (
          (mapEdgesToItems<any>(data?.[objectCollection]) || []).map((item, idx) => (
            <ListItem className="min-h-0 gap-0 p-2 cursor-pointer" key={idx} onClick={() => setObjectId(item.id)}>
              <ListItemCell className="!pl-0 break-all font-semibold">
                {item.name || item[objectDocument.displayedAttribute] || item.id || item.__typename}
              </ListItemCell>
              <ListItemCell>
                {item.thumbnail && <Avatar thumbnail={item.thumbnail?.url} />}
              </ListItemCell>
              <ListItemCell>
                <input
                  type="radio"
                  checked={item.id === objectId}
                  readOnly
                  className="w-4 h-4 accent-[var(--mu-colors-background-interactiveNeutralDefault)] cursor-pointer"
                />
              </ListItemCell>
            </ListItem>
          ))
        )}
      </ListBody>
    </List>
  );
};

DryRunItemsList.displayName = "DryRunItemsList";
export default DryRunItemsList;
