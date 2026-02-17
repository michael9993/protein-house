import { cn } from "@dashboard/utils/cn";
import * as React from "react";

type CheckboxProps = {
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked?: boolean) => void;
  disabled?: boolean;
  name?: string;
  disableClickPropagation?: boolean;
  helperText?: string;
  error?: boolean;
  indeterminate?: boolean;
  className?: string;
  "data-test-id"?: string;
  [key: string]: any;
};

const Checkbox = ({
  helperText,
  error,
  checked,
  onChange,
  disabled,
  disableClickPropagation,
  indeterminate,
  className,
  ...rest
}: CheckboxProps) => {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  return (
    <>
      <span
        className={cn(
          "inline-flex items-center justify-center w-[42px] h-[42px] shrink-0",
          !disabled && "cursor-pointer",
          className,
        )}
        onClick={disableClickPropagation ? e => e.stopPropagation() : undefined}
      >
        <input
          ref={ref}
          type="checkbox"
          data-test-id={rest["data-test-id"] ?? "checkbox"}
          checked={!!checked}
          disabled={disabled}
          name={rest.name}
          onChange={e => onChange?.(e, e.target.checked)}
          className={cn(
            "w-[18px] h-[18px] accent-[var(--mu-colors-background-interactiveNeutralDefault)]",
            !disabled && "cursor-pointer",
          )}
        />
      </span>
      {helperText && (
        <p
          className={cn(
            "text-xs mt-0 mx-3.5 mb-0",
            error
              ? "text-[var(--mu-colors-text-critical1)]"
              : "text-[var(--mu-colors-text-default2)]",
          )}
        >
          {helperText}
        </p>
      )}
    </>
  );
};

Checkbox.displayName = "Checkbox";
export default Checkbox;
