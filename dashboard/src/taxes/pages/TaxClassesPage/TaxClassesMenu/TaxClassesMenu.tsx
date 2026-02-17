import { CardTitle } from "@dashboard/components/CardTitle/CardTitle";
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import ListItemLink from "@dashboard/components/ListItemLink";
import { TaxClassFragment } from "@dashboard/graphql";
import { taxesMessages } from "@dashboard/taxes/messages";
import { taxClassesListUrl } from "@dashboard/taxes/urls";
import { isLastElement } from "@dashboard/taxes/utils/utils";
import { DashboardCard } from "@dashboard/components/Card";
import { cn } from "@dashboard/utils/cn";
import { List, ListHeader, ListItem, ListItemCell } from "@saleor/macaw-ui";
import { Button, Divider, Skeleton } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";
import { Fragment } from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface TaxClassesMenuProps {
  taxClasses: TaxClassFragment[] | undefined;
  selectedTaxClassId: string;
  onTaxClassDelete: (taxClassId: string) => void;
  onCreateNew: () => void;
}

const TaxClassesMenu = ({
  taxClasses,
  selectedTaxClassId,
  onTaxClassDelete,
  onCreateNew,
}: TaxClassesMenuProps) => {
  const intl = useIntl();
  const isCreatingNew = selectedTaxClassId === "new";

  return (
    <DashboardCard className="h-fit">
      <CardTitle
        title={intl.formatMessage(taxesMessages.taxClassList)}
        toolbar={
          <Button
            variant="secondary"
            onClick={onCreateNew}
            disabled={isCreatingNew}
            data-test-id="create-class-button"
          >
            <FormattedMessage {...taxesMessages.addTaxClassLabel} />
          </Button>
        }
      />

      {taxClasses?.length !== 0 ? (
        <>
          <ListHeader>
            <ListItem className="min-h-12 after:hidden">
              <ListItemCell>
                <FormattedMessage {...taxesMessages.taxClassNameHeader} />
              </ListItemCell>
            </ListItem>
          </ListHeader>
          <Divider />
          <List gridTemplate={["1fr"]}>
            {taxClasses?.map((taxClass, taxClassId) => (
              <Fragment key={taxClass.id}>
                <ListItemLink
                  data-test-id="class-list-rows"
                  className={cn(
                    "cursor-pointer min-h-12 after:hidden",
                    taxClass.id === selectedTaxClassId && "before:absolute before:left-0 before:w-1 before:h-full before:bg-[var(--mu-colors-background-interactiveNeutralDefault)]",
                  )}
                  href={taxClassesListUrl(taxClass.id)}
                >
                  <ListItemCell>
                    <div className="flex justify-between items-center">
                      {taxClass.name}
                      {taxClass.id !== "new" && (
                        <Button
                          data-test-id="class-delete-button"
                          icon={
                            <Trash2
                              size={iconSize.small}
                              strokeWidth={iconStrokeWidthBySize.small}
                            />
                          }
                          variant="tertiary"
                          onClick={event => {
                            event.stopPropagation();
                            event.preventDefault();
                            onTaxClassDelete(taxClass.id);
                          }}
                        />
                      )}
                    </div>
                  </ListItemCell>
                </ListItemLink>
                {!isLastElement(taxClasses, taxClassId) && <Divider />}
              </Fragment>
            )) ?? <Skeleton />}
          </List>
        </>
      ) : (
        <DashboardCard.Content className="text-[var(--mu-colors-text-default2)]">
          <FormattedMessage {...taxesMessages.noTaxClasses} />
        </DashboardCard.Content>
      )}
    </DashboardCard>
  );
};

export default TaxClassesMenu;
