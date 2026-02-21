import { DashboardCard } from "@dashboard/components/Card";
import RichTextEditor from "@dashboard/components/RichTextEditor";
import { htmlToOutputData } from "@dashboard/components/RichTextEditor/format-bridge";
import { RichTextEditorLoading } from "@dashboard/components/RichTextEditor/RichTextEditorLoading";
import { DiscoutFormData } from "@dashboard/discounts/types";
import { useRichTextContext } from "@dashboard/utils/richText/context";
import { useController } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface DiscountDescriptionProps {
  disabled?: boolean;
  error?: boolean;
}

export const DiscountDescription = ({
  disabled = false,
  error = false,
}: DiscountDescriptionProps) => {
  const { defaultValue, isReadyForMount, handleChange } = useRichTextContext();
  const { field } = useController<DiscoutFormData, "description">({
    name: "description",
  });

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>
          <FormattedMessage defaultMessage="Description" id="Q8Qw5B" />
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content>
        {isReadyForMount ? (
          <RichTextEditor
            defaultValue={defaultValue}
            onChange={html => {
              handleChange(html);
              field.onChange(JSON.stringify(htmlToOutputData(html)));
            }}
            onBlur={field.onBlur}
            disabled={disabled}
            error={error}
            helperText=""
            label=" "
            name="description"
          />
        ) : (
          <RichTextEditorLoading label="" name="description" />
        )}
      </DashboardCard.Content>
    </DashboardCard>
  );
};
