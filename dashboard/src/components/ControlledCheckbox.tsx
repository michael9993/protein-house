import { cn } from "@dashboard/utils/cn";
import * as React from "react";

import Checkbox from "./Checkbox";

interface ControlledCheckboxProps {
  className?: string;
  name: string;
  label?: React.ReactNode;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  checkedIcon?: React.ReactNode;
  testId?: string;
  onChange: (event: any) => any;
}

export const ControlledCheckbox = ({
  checked,
  disabled,
  name,
  label,
  onChange,
  checkedIcon: _checkedIcon,
  indeterminate,
  testId,
  className,
  ...props
}: ControlledCheckboxProps) => (
  <label
    className={cn(
      "inline-flex items-center gap-0 select-none",
      disabled ? "opacity-50 cursor-default" : "cursor-pointer",
      className,
    )}
    {...props}
  >
    <Checkbox
      data-test-id={testId}
      checked={!!checked}
      indeterminate={indeterminate}
      disabled={disabled}
      name={name}
      onChange={() => onChange({ target: { name, value: !checked } })}
    />
    {label && <span className="text-sm">{label}</span>}
  </label>
);
ControlledCheckbox.displayName = "ControlledCheckbox";
export default ControlledCheckbox;
