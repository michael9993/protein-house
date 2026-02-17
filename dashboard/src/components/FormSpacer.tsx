import * as React from "react";

interface FormSpacerProps {
  children?: React.ReactNode;
}

export const FormSpacer = (props: FormSpacerProps) => {
  const { children } = props;

  return <div className="mt-6">{children}</div>;
};

FormSpacer.displayName = "FormSpacer";
export default FormSpacer;
