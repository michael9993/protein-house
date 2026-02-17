import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import { TablePaginationWithContext } from "@dashboard/components/TablePagination";
import TableRowLink from "@dashboard/components/TableRowLink";
import { cn } from "@dashboard/utils/cn";
import { TableBody, TableCell, TableFooter, TableHead } from "@dashboard/components/Table";
import { Skeleton } from "@saleor/macaw-ui-next";
import { FormattedMessage, useIntl } from "react-intl";

import { maybe, renderCollection } from "../../../misc";
import { ListProps } from "../../../types";

export interface TranslatableEntity {
  id: string;
  name: string;
  completion: {
    current: number;
    max: number;
  };
}

interface TranslationsEntitiesListProps extends ListProps {
  entities: TranslatableEntity[];
  getRowHref: (id: string) => string;
}

const TranslationsEntitiesList = (props: TranslationsEntitiesListProps) => {
  const { disabled, entities, getRowHref } = props;
  const intl = useIntl();

  return (
    <ResponsiveTable>
      <TableHead>
        <TableRowLink>
          <TableCell className="w-4/5">
            <FormattedMessage
              id="X6PF8z"
              defaultMessage="Name"
              description="entity (product, collection, shipping method) name"
            />
          </TableCell>
          <TableCell className="text-right">
            <FormattedMessage id="LWmYSU" defaultMessage="Completed Translations" />
          </TableCell>
        </TableRowLink>
      </TableHead>
      <TableFooter>
        <TableRowLink>
          <TablePaginationWithContext colSpan={2} disabled={disabled} />
        </TableRowLink>
      </TableFooter>
      <TableBody>
        {renderCollection(
          entities,
          entity => (
            <TableRowLink
              className={cn(entity && "cursor-pointer")}
              hover={!!entity}
              href={entity && getRowHref(entity.id)}
              key={entity ? entity.id : "skeleton"}
            >
              <TableCell>{entity?.name || <Skeleton />}</TableCell>
              <TableCell className="text-right">
                {!!entity?.completion &&
                  maybe<React.ReactNode>(
                    () =>
                      intl.formatMessage(
                        {
                          id: "ikRuLs",
                          defaultMessage: "{current} of {max}",
                          description: "translation progress",
                        },
                        entity.completion,
                      ),
                    <Skeleton />,
                  )}
              </TableCell>
            </TableRowLink>
          ),
          () => (
            <TableRowLink>
              <TableCell colSpan={2}>
                <FormattedMessage id="vcwrgW" defaultMessage="No translatable entities found" />
              </TableCell>
            </TableRowLink>
          ),
        )}
      </TableBody>
    </ResponsiveTable>
  );
};

TranslationsEntitiesList.displayName = "TranslationsEntitiesList";
export default TranslationsEntitiesList;
