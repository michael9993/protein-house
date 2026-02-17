import { DashboardCard } from "@dashboard/components/Card";
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import { SortableTableBody, SortableTableRow } from "@dashboard/components/SortableTable";
import { TablePagination } from "@dashboard/components/TablePagination";
import TableRowLink from "@dashboard/components/TableRowLink";
import {
  AttributeInputTypeEnum,
  AttributeValueFragment,
  AttributeValueListFragment,
} from "@dashboard/graphql";
import { renderCollection, stopPropagation } from "@dashboard/misc";
import { ListProps, PaginateListProps, RelayToFlat, ReorderAction } from "@dashboard/types";
import { TableCell, TableFooter, TableHead } from "@mui/material";
import { Box, Button, Skeleton } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";

interface AttributeValuesProps
  extends Pick<ListProps, Exclude<keyof ListProps, "getRowHref">>,
    PaginateListProps {
  disabled: boolean;
  values?: RelayToFlat<AttributeValueListFragment>;
  onValueAdd: () => void;
  onValueDelete: (id: string) => void;
  onValueReorder: ReorderAction;
  onValueUpdate: (id: string) => void;
  inputType: AttributeInputTypeEnum;
}

const getSwatchCellStyle = (value?: AttributeValueFragment | undefined) => {
  if (!value) {
    return;
  }

  return value.file
    ? { backgroundImage: `url(${value.file.url})` }
    : { backgroundColor: value.value ?? undefined };
};
const AttributeValues = ({
  disabled,
  onValueAdd,
  onValueDelete,
  onValueReorder,
  onValueUpdate,
  values,
  settings,
  onUpdateListSettings,
  pageInfo,
  onNextPage,
  onPreviousPage,
  inputType,
}: AttributeValuesProps) => {
  const intl = useIntl();
  const isSwatch = inputType === AttributeInputTypeEnum.SWATCH;
  const numberOfColumns = isSwatch ? 5 : 4;

  return (
    <DashboardCard data-test-id="attribute-values-section">
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage({
            id: "J3uE0t",
            defaultMessage: "Attribute Values",
            description: "section header",
          })}
        </DashboardCard.Title>
        <DashboardCard.Toolbar>
          <Button
            disabled={disabled}
            variant="secondary"
            onClick={onValueAdd}
            data-test-id="assign-value-button"
          >
            <FormattedMessage
              id="+iVKR1"
              defaultMessage="Assign value"
              description="assign attribute value button"
            />
          </Button>
        </DashboardCard.Toolbar>
      </DashboardCard.Header>

      <ResponsiveTable>
        <TableHead>
          <TableRowLink>
            <TableCell className="w-[60px]" />
            {isSwatch && (
              <TableCell className="w-[100px]">
                <FormattedMessage
                  id="NUevU9"
                  defaultMessage="Swatch"
                  description="attribute values list: slug column header"
                />
              </TableCell>
            )}
            <TableCell className="w-[300px]">
              <FormattedMessage
                id="3psvRS"
                defaultMessage="Admin"
                description="attribute values list: slug column header"
              />
            </TableCell>
            <TableCell className="w-auto">
              <FormattedMessage
                id="H60H6L"
                defaultMessage="Default Store View"
                description="attribute values list: name column header"
              />
            </TableCell>
            <TableCell className="w-[84px]" />
          </TableRowLink>
        </TableHead>
        <TableFooter>
          <TableRowLink>
            <TablePagination
              colSpan={numberOfColumns}
              hasNextPage={pageInfo && !disabled ? pageInfo.hasNextPage : false}
              onNextPage={onNextPage}
              hasPreviousPage={pageInfo && !disabled ? pageInfo.hasPreviousPage : false}
              onPreviousPage={onPreviousPage}
              settings={settings}
              onUpdateListSettings={onUpdateListSettings}
            />
          </TableRowLink>
        </TableFooter>
        <SortableTableBody onSortEnd={onValueReorder}>
          {renderCollection(
            values,
            (value, valueIndex) => (
              <SortableTableRow<"row">
                data-test-id="attributes-rows"
                className={value ? "cursor-pointer" : undefined}
                hover={!!value}
                onClick={value ? () => onValueUpdate(value.id) : undefined}
                key={value?.id}
                index={valueIndex || 0}
              >
                {isSwatch && (
                  <TableCell className="w-[100px]">
                    {value?.file ? (
                      <Box
                        as="img"
                        objectFit="cover"
                        alt=""
                        src={value.file.url}
                        __width={32}
                        __height={32}
                        data-test-id="swatch-image"
                      />
                    ) : (
                      <div
                        data-test-id="swatch-image"
                        className="w-8 h-8 rounded bg-cover bg-center"
                        style={getSwatchCellStyle(value)}
                      />
                    )}
                  </TableCell>
                )}
                <TableCell className="w-[300px]" data-test-id="attribute-value-name">
                  {value?.slug ?? <Skeleton />}
                </TableCell>
                <TableCell className="w-auto">{value?.name ?? <Skeleton />}</TableCell>
                <TableCell className="w-[84px]">
                  <Button
                    icon={
                      <Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
                    }
                    data-test-id="delete-attribute-value-button"
                    variant="secondary"
                    disabled={disabled}
                    onClick={stopPropagation(() => onValueDelete(value?.id ?? ""))}
                  />
                </TableCell>
              </SortableTableRow>
            ),
            () => (
              <TableRowLink>
                <TableCell colSpan={numberOfColumns}>
                  <FormattedMessage
                    id="g5zIpS"
                    defaultMessage="No values found"
                    description="No attribute values found"
                  />
                </TableCell>
              </TableRowLink>
            ),
          )}
        </SortableTableBody>
      </ResponsiveTable>
    </DashboardCard>
  );
};

AttributeValues.displayName = "AttributeValues";
export default AttributeValues;
