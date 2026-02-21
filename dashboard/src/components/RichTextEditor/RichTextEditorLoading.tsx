import RichTextEditor, { RichTextEditorProps } from "./RichTextEditor";

interface RichTextEditorLoadingProps
  extends Omit<
    RichTextEditorProps,
    "disabled" | "onChange" | "defaultValue" | "error" | "helperText"
  > {
  helperText?: RichTextEditorProps["helperText"];
}

export const RichTextEditorLoading = (props: RichTextEditorLoadingProps) => (
  <RichTextEditor
    {...props}
    disabled={true}
    readOnly={true}
    error={false}
    helperText={props.helperText ?? ""}
    defaultValue=""
  />
);
