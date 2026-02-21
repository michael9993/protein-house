// @ts-strict-ignore
import { ConfirmButtonTransitionState } from "@dashboard/components/ConfirmButton";
import RichTextEditor from "@dashboard/components/RichTextEditor";
import { htmlToOutputData } from "@dashboard/components/RichTextEditor/format-bridge";
import { RichTextEditorLoading } from "@dashboard/components/RichTextEditor/RichTextEditorLoading";
import { SubmitPromise } from "@dashboard/hooks/useForm";
import { OutputData } from "@dashboard/components/RichTextEditor/types";
import { Text } from "@saleor/macaw-ui-next";
import { FormattedMessage, useIntl } from "react-intl";

import TranslationFieldsSave from "./TranslationFieldsSave";
import { useRichTextSubmit } from "./useRichTextSubmit";

interface TranslationFieldsRichProps {
  disabled: boolean;
  edit: boolean;
  initial: string;
  saveButtonState: ConfirmButtonTransitionState;
  resetKey: string;
  onDiscard: () => void;
  onSubmit: (data: OutputData) => SubmitPromise;
  onValueChange?(newValue: string): void;
}

const TranslationFieldsRich = ({
  disabled,
  edit,
  initial,
  saveButtonState,
  resetKey,
  onDiscard,
  onSubmit,
  onValueChange,
}: TranslationFieldsRichProps) => {
  const intl = useIntl();
  const { isReadyForMount, handleSubmit, defaultValue, handleChange } =
    useRichTextSubmit(initial, onSubmit, disabled);

  return edit ? (
    <form onSubmit={handleSubmit}>
      {isReadyForMount ? (
        <RichTextEditor
          defaultValue={defaultValue}
          onChange={html => {
            handleChange(html);

            if (onValueChange) {
              onValueChange(JSON.stringify(htmlToOutputData(html)));
            }
          }}
          disabled={disabled}
          error={undefined}
          helperText={undefined}
          label={intl.formatMessage({
            id: "/vCXIP",
            defaultMessage: "Translation",
          })}
          name="translation"
          data-test-id="translation-field"
        />
      ) : (
        <RichTextEditorLoading
          label={intl.formatMessage({
            id: "/vCXIP",
            defaultMessage: "Translation",
          })}
          name="translation"
          data-test-id="translation-field"
        />
      )}
      <TranslationFieldsSave
        saveButtonState={saveButtonState}
        onDiscard={onDiscard}
        onSave={handleSubmit}
      />
    </form>
  ) : initial === null ? (
    <Text color="default2">
      <FormattedMessage id="T/5OyA" defaultMessage="No translation yet" />
    </Text>
  ) : (
    <div>
      {isReadyForMount && (
        <RichTextEditor
          key={resetKey}
          defaultValue={defaultValue}
          readOnly={true}
          disabled={true}
          error={false}
          label=""
          name="translation-readonly"
        />
      )}
    </div>
  );
};

TranslationFieldsRich.displayName = "TranslationFieldsRich";
export default TranslationFieldsRich;
