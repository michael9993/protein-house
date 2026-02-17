import closeIcon from "@assets/images/close-thin.svg";
import { Text } from "@saleor/macaw-ui-next";
import { useState } from "react";
import * as React from "react";

import FormSpacer from "../FormSpacer";

const CLOSE_ICON_SIZE = 14;

interface Props {
  buttonText: string;
  children: React.ReactNode;
  onInputClose: () => void;
}

const DateVisibilitySelector = ({ buttonText, children, onInputClose }: Props) => {
  const [showInput, setShowInput] = useState<boolean>(false);
  const handleCloseIconClick = () => {
    setShowInput(false);
    onInputClose();
  };

  if (!showInput) {
    return (
      <Text
        className="my-2 cursor-pointer pb-[10px] text-sm text-primary"
        onClick={() => setShowInput(true)}
      >
        {buttonText}
      </Text>
    );
  }

  return (
    <>
      <div className="flex flex-row items-baseline justify-between">
        {children}
        <div className="ml-4 cursor-pointer" onClick={handleCloseIconClick}>
          <img src={closeIcon} alt="close icon" width={CLOSE_ICON_SIZE} height={CLOSE_ICON_SIZE} />
        </div>
      </div>
      <FormSpacer />
    </>
  );
};

export default DateVisibilitySelector;
