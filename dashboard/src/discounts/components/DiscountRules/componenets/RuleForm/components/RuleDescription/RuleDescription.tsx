import RichTextEditor from "@dashboard/components/RichTextEditor";
import { htmlToOutputData } from "@dashboard/components/RichTextEditor/format-bridge";
import { RichTextEditorLoading } from "@dashboard/components/RichTextEditor/RichTextEditorLoading";
import { useDiscountRulesContext } from "@dashboard/discounts/components/DiscountRules/context";
import { Rule } from "@dashboard/discounts/models";
import { commonMessages } from "@dashboard/intl";
import { useRichTextContext } from "@dashboard/utils/richText/context";
import { Box, Text } from "@saleor/macaw-ui-next";
import { useController } from "react-hook-form";
import { useIntl } from "react-intl";

import { RuleInputWrapper } from "../RuleInputWrapper/RuleInputWrapper";

interface RuleDescriptionProps {
  error?: boolean;
}

export const RuleDescription = ({ error = false }: RuleDescriptionProps) => {
  const intl = useIntl();
  const { disabled } = useDiscountRulesContext();
  const { defaultValue, isReadyForMount, handleChange } = useRichTextContext();
  const { field } = useController<Rule, "description">({
    name: "description",
  });

  return (
    <Box overflow="hidden">
      <Text marginBottom={4} as="p">
        {intl.formatMessage(commonMessages.description)}
      </Text>

      <RuleInputWrapper>
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
            name="rule-description"
          />
        ) : (
          <RichTextEditorLoading label="" name="description" />
        )}
      </RuleInputWrapper>
    </Box>
  );
};
