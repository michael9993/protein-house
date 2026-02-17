// @ts-strict-ignore
import { Input } from "@saleor/macaw-ui-next";
import * as React from "react";

import { useManualTransactionContext } from "../context";

export const DescriptionField = ({
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "onChange" | "value">) => {
  const { submitState, handleChangeDescription, description } = useManualTransactionContext();

  return (
    <Input
      size="small"
      {...props}
      disabled={submitState === "loading" || disabled}
      onChange={handleChangeDescription}
      value={description}
      maxLength={512}
      data-test-id="transactionDescription"
    />
  );
};
