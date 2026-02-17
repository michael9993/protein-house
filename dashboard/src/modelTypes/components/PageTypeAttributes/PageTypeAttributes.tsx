// @ts-strict-ignore
import { attributeUrl } from "@dashboard/attributes/urls";
import { DashboardCard } from "@dashboard/components/Card";
import Checkbox from "@dashboard/components/Checkbox";
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import { SortableTableBody, SortableTableRow } from "@dashboard/components/SortableTable";
import { TableButtonWrapper } from "@dashboard/components/TableButtonWrapper/TableButtonWrapper";
import TableHead from "@dashboard/components/TableHead";
import TableRowLink from "@dashboard/components/TableRowLink";
import { AttributeFragment, AttributeTypeEnum } from "@dashboard/graphql";
import { renderCollection } from "@dashboard/misc";
import { ListActions, ReorderAction } from "@dashboard/types";
import { TableCell } from "@dashboard/components/Table";
import { Button, Skeleton } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";

interface PageTypeAttributesProps extends ListActions {
  attributes: AttributeFragment[];
  disabled: boolean;
  type: string;
  onAttributeAssign: (type: AttributeTypeEnum) => void;
  onAttributeReorder: ReorderAction;
  onAttributeUnassign: (id: string) => void;
}

const numberOfColumns = 5;
const PageTypeAttributes = (props: PageTypeAttributesProps) => {
  const {
    attributes,
    disabled,
    isChecked,
    selected,
    toggle,
    toggleAll,
    toolbar,
    type,
    onAttributeAssign,
    onAttributeReorder,
    onAttributeUnassign,
  } = props;
  const intl = useIntl();

  return (
    <DashboardCard data-test-id="page-attributes">
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage({
            id: "pgTwKM",
            defaultMessage: "Model attributes",
            description: "section header",
          })}
        </DashboardCard.Title>
        <DashboardCard.Toolbar>
          <Button
            variant="secondary"
            onClick={() => onAttributeAssign(AttributeTypeEnum[type])}
            data-test-id="assign-attributes"
          >
            <FormattedMessage id="uxPpRx" defaultMessage="Assign attribute" description="button" />
          </Button>
        </DashboardCard.Toolbar>
      </DashboardCard.Header>
      <DashboardCard.Content>
        <ResponsiveTable>
          <colgroup>
            <col className="w-[60px]" />
            <col />
            <col className="" />
            <col className="w-[300px]" />
            <col className="w-[80px] last:pr-0" />
          </colgroup>
          {attributes?.length > 0 && (
            <TableHead
              colSpan={numberOfColumns}
              disabled={disabled}
              dragRows
              selected={selected}
              items={attributes}
              toggleAll={toggleAll}
              toolbar={toolbar}
            >
              <TableCell className="">
                <FormattedMessage id="kTr2o8" defaultMessage="Attribute name" />
              </TableCell>
              <TableCell className="">
                <FormattedMessage
                  id="nf3XSt"
                  defaultMessage="Slug"
                  description="attribute internal name"
                />
              </TableCell>
              <TableCell />
            </TableHead>
          )}
          <SortableTableBody onSortEnd={onAttributeReorder}>
            {renderCollection(
              attributes,
              (attribute, attributeIndex) => {
                const isSelected = attribute ? isChecked(attribute.id) : false;

                return (
                  <SortableTableRow
                    selected={isSelected}
                    className={attribute ? "cursor-pointer" : undefined}
                    hover={!!attribute}
                    href={attribute ? attributeUrl(attribute.id) : undefined}
                    key={attribute?.id}
                    index={attributeIndex || 0}
                    data-test-id={"id-" + attribute?.id}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        disabled={disabled}
                        disableClickPropagation
                        onChange={() => toggle(attribute.id)}
                      />
                    </TableCell>
                    <TableCell className="" data-test-id="name">
                      {attribute?.name || <Skeleton />}
                    </TableCell>
                    <TableCell className="w-[300px]" data-test-id="slug">
                      {attribute?.slug || <Skeleton />}
                    </TableCell>
                    <TableCell className="w-[80px] last:pr-0">
                      <TableButtonWrapper>
                        <Button
                          icon={
                            <Trash2
                              size={iconSize.small}
                              strokeWidth={iconStrokeWidthBySize.small}
                            />
                          }
                          variant="secondary"
                          onClick={() => onAttributeUnassign(attribute.id)}
                        />
                      </TableButtonWrapper>
                    </TableCell>
                  </SortableTableRow>
                );
              },
              () => (
                <TableRowLink>
                  <TableCell colSpan={numberOfColumns}>
                    <FormattedMessage id="ztQgD8" defaultMessage="No attributes found" />
                  </TableCell>
                </TableRowLink>
              ),
            )}
          </SortableTableBody>
        </ResponsiveTable>
      </DashboardCard.Content>
    </DashboardCard>
  );
};

PageTypeAttributes.displayName = "PageTypeAttributes";
export default PageTypeAttributes;
