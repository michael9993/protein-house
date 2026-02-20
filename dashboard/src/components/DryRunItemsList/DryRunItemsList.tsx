// @ts-strict-ignore

import { useQuery } from "@dashboard/hooks/graphql";
import { mapEdgesToItems } from "@dashboard/utils/maps";
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
  const objectDocument = DocumentMap[object];
  const objectCollection = objectDocument.collection ?? camelCase(`${object.toLowerCase()}s`);
  const { data, loading } = useQuery<TData, TVariables>(objectDocument.document, {
    displayLoader: true,
    variables: objectDocument.variables,
  });

  return (
    <div data-test-id="dry-run-items-list">
      <div>
        <div className="grid grid-cols-[1fr_50px_50px] uppercase p-2 min-h-0">
          <div className="break-all font-semibold">
            {intl.formatMessage(messages.item)}
            &nbsp;
            {objectDocument.collection
              ?.split(/(?=[A-Z])/)
              .map(item => item.toLowerCase())
              .join(" ")}
            &nbsp;
            {objectDocument.displayedAttribute}
          </div>
        </div>
      </div>
      <div className="h-[300px] overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-[1fr_50px_50px] min-h-0 gap-0 p-2 cursor-pointer">
            <div className="break-all font-semibold">
              <Skeleton />
            </div>
            <div>
              <Skeleton />
            </div>
            <div>
              <Skeleton />
            </div>
          </div>
        ) : (
          (mapEdgesToItems<any>(data?.[objectCollection]) || []).map((item, idx) => (
            <div
              className="grid grid-cols-[1fr_50px_50px] min-h-0 gap-0 p-2 cursor-pointer"
              key={idx}
              onClick={() => setObjectId(item.id)}
            >
              <div className="break-all font-semibold">
                {item.name || item[objectDocument.displayedAttribute] || item.id || item.__typename}
              </div>
              <div>
                {item.thumbnail && <Avatar thumbnail={item.thumbnail?.url} />}
              </div>
              <div>
                <input
                  type="radio"
                  checked={item.id === objectId}
                  readOnly
                  className="w-4 h-4 accent-[var(--mu-colors-background-interactiveNeutralDefault)] cursor-pointer"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

DryRunItemsList.displayName = "DryRunItemsList";
export default DryRunItemsList;
