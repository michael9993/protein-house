// @ts-strict-ignore
import { Input } from "@saleor/macaw-ui-next";
import * as React from "react";

import { useManualTransactionContext } from "../context";

export const PspReferenceField = ({
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "onChange" | "value">) => {
  const { submitState, pspReference, handleChangePspReference } = useManualTransactionContext();

  return (
    <Input
      size="small"
      {...props}
      disabled={submitState === "loading" || disabled}
      onChange={handleChangePspReference}
      value={pspReference}
      maxLength={512}
      data-test-id="transactionPspReference"
    />
  );
};
