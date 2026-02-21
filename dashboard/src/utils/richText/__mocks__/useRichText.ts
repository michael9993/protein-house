import { UseRichTextOptions, UseRichTextResult } from "../useRichText";

const useRichTextMocked = ({
  initial,
  triggerChange,
}: UseRichTextOptions): UseRichTextResult => ({
  defaultValue: typeof initial === "string" ? initial : "",
  getValue: async () => ({ blocks: [] }),
  handleChange: (_html: string) => {
    triggerChange();
  },
  isReadyForMount: true,
  isDirty: false,
});

export default useRichTextMocked;
