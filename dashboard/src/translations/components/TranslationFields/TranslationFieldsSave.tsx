import { ConfirmButton, ConfirmButtonTransitionState } from "@dashboard/components/ConfirmButton";
import { buttonMessages } from "@dashboard/intl";
import { Button } from "@saleor/macaw-ui-next";
import { FormattedMessage } from "react-intl";

interface TranslationFieldsSaveProps {
  saveButtonState: ConfirmButtonTransitionState;
  onDiscard: () => void;
  onSave: () => void;
}

const TranslationFieldsSave = (props: TranslationFieldsSaveProps) => {
  const { saveButtonState, onDiscard, onSave } = props;

  return (
    <div className="flex flex-row-reverse mt-2">
      <ConfirmButton
        data-test-id="button-bar-confirm"
        className="ml-2"
        transitionState={saveButtonState}
        onClick={onSave}
      >
        <FormattedMessage {...buttonMessages.save} />
      </ConfirmButton>
      <Button onClick={onDiscard} type="submit">
        <FormattedMessage id="vTN5DZ" defaultMessage="Discard" description="button" />
      </Button>
    </div>
  );
};

TranslationFieldsSave.displayName = "TranslationFieldsSave";
export default TranslationFieldsSave;
