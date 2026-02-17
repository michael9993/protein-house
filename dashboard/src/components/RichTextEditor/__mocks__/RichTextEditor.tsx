import { cn } from "@dashboard/utils/cn";

import { RichTextEditorProps } from "../RichTextEditor";

export const HOLDER = "TEST_HOLDER";

const RichTextEditor = ({ disabled, error, label, name, helperText }: RichTextEditorProps) => (
  <div
    data-test-id={"rich-text-editor-" + name}
    className={cn("w-full relative", disabled && "opacity-50 pointer-events-none")}
  >
    <label>{label}</label>

    <p className={cn("text-xs mt-1 mx-3.5", error && "text-[var(--mu-colors-text-critical1)]")}>
      {helperText}
    </p>
  </div>
);

export default RichTextEditor;
