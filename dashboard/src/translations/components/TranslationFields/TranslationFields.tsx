// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import { ConfirmButtonTransitionState } from "@dashboard/components/ConfirmButton";
import Grid from "@dashboard/components/Grid";
import Hr from "@dashboard/components/Hr";
import { TablePaginationWithContext } from "@dashboard/components/TablePagination";
import { SubmitPromise } from "@dashboard/hooks/useForm";
import { buttonMessages } from "@dashboard/intl";
import { TranslationField, TranslationFieldType } from "@dashboard/translations/types";
import { ListProps } from "@dashboard/types";
import { cn } from "@dashboard/utils/cn";
import { OutputData } from "@dashboard/components/RichTextEditor/types";
import { IconButton } from "@dashboard/components/IconButton/IconButton";
import { Button } from "@saleor/macaw-ui-next";
import { Skeleton, Text } from "@saleor/macaw-ui-next";
import { ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";
import { FormattedMessage } from "react-intl";

import TranslationFieldsLong from "./TranslationFieldsLong";
import TranslationFieldsRich from "./TranslationFieldsRich";
import TranslationFieldsShort from "./TranslationFieldsShort";

type Pagination = Pick<ListProps, Exclude<keyof ListProps, "getRowHref" | "disabled">>;

interface TranslationFieldsProps {
  activeField: string | string[];
  disabled: boolean;
  title: string;
  fields: TranslationField[];
  initialState: boolean;
  saveButtonState: ConfirmButtonTransitionState;
  pagination?: Pagination;
  richTextResetKey: string; // temporary workaround TODO: fix rich text editor
  onEdit: (field: string) => void;
  onDiscard: () => void;
  onSubmit: (field: TranslationField, data: string | OutputData) => SubmitPromise;
  onValueChange?(field: TranslationField, currentValue: string): void;
}

const numberOfColumns = 2;
const TranslationFields = (props: TranslationFieldsProps) => {
  const {
    activeField,
    disabled,
    fields,
    initialState,
    title,
    saveButtonState,
    pagination,
    richTextResetKey,
    onEdit,
    onDiscard,
    onSubmit,
    onValueChange,
  } = props;
  const [expanded, setExpandedState] = useState(initialState);

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>{title}</DashboardCard.Title>
        <DashboardCard.Toolbar>
          <IconButton
            variant="secondary"
            onClick={() => setExpandedState(!expanded)}
            size="medium">
            <ChevronDown
              className={cn(expanded && "rotate-180")}
            />
          </IconButton>
        </DashboardCard.Toolbar>
      </DashboardCard.Header>
      {expanded ? (
        <DashboardCard.Content className="last:pb-2">
          <Grid className="[grid-row-gap:0]" variant="uniform">
            <Text className="mb-1" fontSize={3}>
              <FormattedMessage id="Xtd0AT" defaultMessage="Original String" />
            </Text>
            <Text className="mb-1" fontSize={3}>
              <FormattedMessage
                id="bVY7j0"
                defaultMessage="Translation"
                description="Translated Name"
              />
            </Text>
            {fields.map(field => (
              <Fragment key={field.name}>
                <Hr className="col-span-2" />
                <Text className="text-sm font-medium mt-4 mb-2 text-[caption]" fontSize={3}>
                  {field.displayName}
                </Text>
                <div className="flex items-center justify-end">
                  <Button data-test-id={`edit-${field.name}`} onClick={() => onEdit(field.name)}>
                    <FormattedMessage {...buttonMessages.edit} />
                  </Button>
                </div>
                <div className="pb-4 [&_a]:text-text-highlighted [&_blockquote]:border-l-2 [&_blockquote]:border-divider [&_blockquote]:m-0 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_h2]:text-[22px] [&_h2]:mb-2 [&_h3]:text-[19px] [&_h3]:mb-2 [&_p]:mb-2 [&_p]:mt-0 [&_p:last-child]:mb-0">
                  {field && field.value !== undefined ? (
                    field.type === TranslationFieldType.SHORT ? (
                      <TranslationFieldsShort
                        disabled={disabled}
                        edit={false}
                        initial={field.value}
                        saveButtonState="default"
                        onDiscard={onDiscard}
                        onSubmit={undefined}
                        onValueChange={v => {
                          if (onValueChange) {
                            onValueChange(field, v);
                          }
                        }}
                      />
                    ) : field.type === TranslationFieldType.LONG ? (
                      <TranslationFieldsLong
                        disabled={disabled}
                        edit={false}
                        initial={field.value}
                        saveButtonState="default"
                        onDiscard={onDiscard}
                        onSubmit={undefined}
                        onValueChange={v => {
                          if (onValueChange) {
                            onValueChange(field, v);
                          }
                        }}
                      />
                    ) : (
                      <TranslationFieldsRich
                        resetKey={richTextResetKey}
                        disabled={disabled}
                        edit={false}
                        initial={field.value}
                        saveButtonState="default"
                        onDiscard={onDiscard}
                        onSubmit={undefined}
                        onValueChange={v => {
                          if (onValueChange) {
                            onValueChange(field, v);
                          }
                        }}
                      />
                    )
                  ) : (
                    <Skeleton />
                  )}
                </div>
                <Text className="pb-4 [&_a]:text-text-highlighted [&_blockquote]:border-l-2 [&_blockquote]:border-divider [&_blockquote]:m-0 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_h2]:text-[22px] [&_h2]:mb-2 [&_h3]:text-[19px] [&_h3]:mb-2 [&_p]:mb-2 [&_p]:mt-0 [&_p:last-child]:mb-0">
                  {field && field.translation !== undefined ? (
                    field.type === TranslationFieldType.SHORT ? (
                      <TranslationFieldsShort
                        disabled={disabled}
                        edit={
                          Array.isArray(activeField)
                            ? activeField.includes(field.name)
                            : activeField === field.name
                        }
                        initial={field.translation}
                        saveButtonState={saveButtonState}
                        onDiscard={onDiscard}
                        onSubmit={data => onSubmit(field, data)}
                        onValueChange={v => {
                          if (onValueChange) {
                            onValueChange(field, v);
                          }
                        }}
                      />
                    ) : field.type === TranslationFieldType.LONG ? (
                      <TranslationFieldsLong
                        disabled={disabled}
                        edit={
                          Array.isArray(activeField)
                            ? activeField.includes(field.name)
                            : activeField === field.name
                        }
                        initial={field.translation}
                        saveButtonState={saveButtonState}
                        onDiscard={onDiscard}
                        onSubmit={data => onSubmit(field, data)}
                        onValueChange={v => {
                          if (onValueChange) {
                            onValueChange(field, v);
                          }
                        }}
                      />
                    ) : (
                      <TranslationFieldsRich
                        resetKey={richTextResetKey}
                        disabled={disabled}
                        edit={
                          Array.isArray(activeField)
                            ? activeField.includes(field.name)
                            : activeField === field.name
                        }
                        initial={field.translation}
                        saveButtonState={saveButtonState}
                        onDiscard={onDiscard}
                        onSubmit={data => onSubmit(field, data)}
                        onValueChange={v => {
                          if (onValueChange) {
                            onValueChange(field, v);
                          }
                        }}
                      />
                    )
                  ) : (
                    <Skeleton />
                  )}
                </Text>
              </Fragment>
            ))}
          </Grid>
          {pagination && (
            <TablePaginationWithContext
              colSpan={numberOfColumns}
              settings={pagination.settings}
              onUpdateListSettings={pagination.onUpdateListSettings}
              component="div"
            />
          )}
        </DashboardCard.Content>
      ) : (
        <DashboardCard.Content>
          <Text className="text-sm" size={2} fontWeight="light">
            <FormattedMessage
              id="bh+Keo"
              defaultMessage="{numberOfFields} Translations, {numberOfTranslatedFields} Completed"
              values={{
                numberOfFields: fields.length,
                numberOfTranslatedFields: fields.reduce(
                  (acc, field) => acc + +(field.translation !== null),
                  0,
                ),
              }}
            />
          </Text>
        </DashboardCard.Content>
      )}
    </DashboardCard>
  );
};

TranslationFields.displayName = "TranslationFields";
export default TranslationFields;
