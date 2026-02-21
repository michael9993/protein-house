import RichTextEditor from "./RichTextEditor";

interface RichTextEditorContentProps {
  id?: string;
  className?: string;
  value?: string;
}

const RichTextEditorContent = ({
  value = "",
  ...props
}: RichTextEditorContentProps) => {
  return (
    <RichTextEditor
      {...props}
      defaultValue={value}
      disabled={true}
      readOnly={true}
      error={false}
      label=""
      name="content-viewer"
      helperText=""
    />
  );
};

RichTextEditorContent.displayName = "RichTextEditorContent";
export default RichTextEditorContent;
