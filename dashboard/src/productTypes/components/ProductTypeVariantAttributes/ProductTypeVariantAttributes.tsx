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
import { ProductAttributeType, ProductTypeDetailsQuery } from "@dashboard/graphql";
import { maybe, renderCollection } from "@dashboard/misc";
import { ListActions, ReorderAction } from "@dashboard/types";
import { TableCell } from "@mui/material";
import { IconButton } from "@saleor/macaw-ui";
import { Button, Skeleton, Tooltip } from "@saleor/macaw-ui-next";
import capitalize from "lodash/capitalize";
import { CircleQuestionMark, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface ProductTypeVariantAttributesProps extends ListActions {
  assignedVariantAttributes: ProductTypeDetailsQuery["productType"]["assignedVariantAttributes"];
  disabled: boolean;
  type: string;
  testId?: string;
  selectedVariantAttributes: string[];
  onAttributeAssign: (type: ProductAttributeType) => void;
  onAttributeReorder: ReorderAction;
  onAttributeUnassign: (id: string) => void;
  setSelectedVariantAttributes: (data: string[]) => void;
}

function handleContainerAssign(
  variantID: string,
  isSelected: boolean,
  selectedAttributes: string[],
  setSelectedAttributes: (data: string[]) => void,
) {
  if (isSelected) {
    setSelectedAttributes(
      selectedAttributes.filter(selectedContainer => selectedContainer !== variantID),
    );
  } else {
    setSelectedAttributes([...selectedAttributes, variantID]);
  }
}

const numberOfColumns = 6;
const ProductTypeVariantAttributes = (props: ProductTypeVariantAttributesProps) => {
  const {
    assignedVariantAttributes,
    disabled,
    isChecked,
    selected,
    toggle,
    toggleAll,
    toolbar,
    type,
    testId,
    onAttributeAssign,
    onAttributeReorder,
    onAttributeUnassign,
    setSelectedVariantAttributes,
    selectedVariantAttributes,
  } = props;
  const intl = useIntl();

  useEffect(() => {
    // Populate initial selection - populated inside this component to preserve it's state between data reloads
    setSelectedVariantAttributes(
      assignedVariantAttributes
        .map(elem => (elem.variantSelection ? elem.attribute.id : undefined))
        .filter(Boolean) || [],
    );
  }, []);

  return (
    <DashboardCard data-test-id="variant-attributes">
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage({
            id: "skEK/i",
            defaultMessage: "Variant Attributes",
            description: "section header",
          })}
        </DashboardCard.Title>
        <DashboardCard.Toolbar>
          <Button
            data-test-id={testId}
            variant="secondary"
            onClick={() => onAttributeAssign(ProductAttributeType[type])}
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
            <col className="w-[200px]" />
            <col className="w-[200px]" />
            <col className="w-[150px]" />
            <col className="w-[80px] last:pr-0" />
          </colgroup>
          {assignedVariantAttributes?.length > 0 && (
            <TableHead
              colSpan={numberOfColumns}
              disabled={disabled}
              dragRows
              selected={selected}
              items={assignedVariantAttributes?.map(
                selectedAttribute => selectedAttribute.attribute,
              )}
              toggleAll={toggleAll}
              toolbar={toolbar}
            >
              <TableCell className="w-[200px]">
                <FormattedMessage id="kTr2o8" defaultMessage="Attribute name" />
              </TableCell>
              <TableCell className="w-[200px]">
                <FormattedMessage
                  id="nf3XSt"
                  defaultMessage="Slug"
                  description="attribute internal name"
                />
              </TableCell>
              <TableCell className="w-[200px]">
                <FormattedMessage
                  id="4k9rMQ"
                  defaultMessage="Variant Selection"
                  description="variant attribute checkbox"
                />
              </TableCell>
              <TableCell />
            </TableHead>
          )}
          <SortableTableBody onSortEnd={onAttributeReorder}>
            {renderCollection(
              assignedVariantAttributes,
              (assignedVariantAttribute, attributeIndex) => {
                const { attribute } = assignedVariantAttribute;
                const isVariantSelected = assignedVariantAttribute
                  ? isChecked(attribute.id)
                  : false;
                const isSelected = !!selectedVariantAttributes.find(
                  selectedAttribute => selectedAttribute === attribute.id,
                );
                const variantSelectionDisabled = ![
                  "DROPDOWN",
                  "BOOLEAN",
                  "SWATCH",
                  "NUMERIC",
                ].includes(attribute.inputType);
                const readableAttributeInputType = capitalize(
                  attribute.inputType.split("_").join(" "),
                );

                return (
                  <SortableTableRow
                    selected={isVariantSelected}
                    className={attribute ? "cursor-pointer" : undefined}
                    hover={!!attribute}
                    href={attribute ? attributeUrl(attribute.id) : undefined}
                    key={maybe(() => attribute.id)}
                    index={attributeIndex || 0}
                    data-test-id={"id-" + +maybe(() => attribute.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isVariantSelected}
                        disabled={disabled}
                        disableClickPropagation
                        onChange={() => toggle(attribute.id)}
                      />
                    </TableCell>
                    <TableCell className="w-[200px]" data-test-id="name">
                      {attribute.name ?? <Skeleton />}
                    </TableCell>
                    <TableCell className="w-[200px]" data-test-id="slug">
                      {maybe(() => attribute.slug) ? attribute.slug : <Skeleton />}
                    </TableCell>
                    <TableCell className="w-[150px]" data-test-id="variant-selection">
                      <div className="flex items-center">
                        <Checkbox
                          data-test-id="variant-selection-checkbox"
                          checked={isSelected}
                          disabled={disabled || variantSelectionDisabled}
                          disableClickPropagation
                          onChange={() =>
                            handleContainerAssign(
                              attribute.id,
                              isSelected,
                              selectedVariantAttributes,
                              setSelectedVariantAttributes,
                            )
                          }
                        />
                        {!!variantSelectionDisabled && (
                          <Tooltip>
                            <Tooltip.Trigger>
                              <CircleQuestionMark
                                size={iconSize.small}
                                strokeWidth={iconStrokeWidthBySize.small}
                                className="fill-alert-icon-info fill-opacity-60 hover:fill-opacity-100"
                              />
                            </Tooltip.Trigger>
                            <Tooltip.Content side="bottom">
                              <Tooltip.Arrow />
                              <FormattedMessage
                                id="vlLyvk"
                                defaultMessage="{inputType} attributes cannot be used as variant selection attributes."
                                values={{
                                  inputType: readableAttributeInputType,
                                }}
                              />
                            </Tooltip.Content>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[80px] last:pr-0">
                      <TableButtonWrapper>
                        <IconButton
                          data-test-id="delete-icon"
                          onClick={() => onAttributeUnassign(attribute.id)}
                          variant="secondary"
                          size="medium">
                          <Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
                        </IconButton>
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

ProductTypeVariantAttributes.displayName = "ProductTypeVariantAttributes";
export default ProductTypeVariantAttributes;
