import { cn } from "@dashboard/utils/cn";

import { TipTapEditor } from "./TipTapEditor";

export interface RichTextEditorProps {
  id?: string;
  disabled: boolean;
  error: boolean;
  helperText?: string;
  label: string;
  name: string;
  defaultValue?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  readOnly?: boolean;
}

const RichTextEditor = ({
  disabled,
  error,
  label,
  name,
  helperText,
  defaultValue = "",
  onChange,
  onBlur,
  readOnly,
}: RichTextEditorProps) => {
  return (
    <div
      data-test-id={"rich-text-editor-" + name}
      className={cn("w-full relative", (disabled || readOnly) && "opacity-60")}
    >
      {label && (
        <label className={cn(
          "block text-xs font-medium mb-1.5",
          error ? "text-red-600" : "text-gray-500",
        )}>
          {label}
        </label>
      )}
      <TipTapEditor
        content={defaultValue}
        onChange={html => onChange?.(html)}
        disabled={disabled || readOnly}
        onBlur={onBlur}
        placeholder="Start writing..."
      />
      {helperText && (
        <p className={cn("text-xs mt-1", error ? "text-red-600" : "text-gray-500")}>
          {helperText}
        </p>
      )}
    </div>
  );
};

RichTextEditor.displayName = "RichTextEditor";
export default RichTextEditor;
