import { OutputData } from "@editorjs/editorjs";
import { EditorCore } from "@react-editor-js/core";
import { MutableRefObject, useMemo, useRef, useState } from "react";

export interface UseRichTextOptions {
  initial: string | OutputData | null | undefined;
  loading?: boolean;
  triggerChange: () => void;
}

export interface UseRichTextResult {
  editorRef: MutableRefObject<EditorCore | null>;
  handleChange: () => void;
  getValue: () => Promise<OutputData>;
  defaultValue: OutputData | undefined;
  isReadyForMount: boolean;
  isDirty: boolean;
}

export function useRichText({
  initial,
  loading,
  triggerChange,
}: UseRichTextOptions): UseRichTextResult {
  const editorRef = useRef<EditorCore | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const handleChange = () => {
    setIsDirty(true);
    triggerChange();
  };
  const getValue = async () => {
    if (editorRef.current) {
      setIsDirty(false);

      return editorRef.current.save();
    } else {
      throw new Error("Editor instance is not available");
    }
  };

  // Compute defaultValue; support both JSON string and OutputData object (e.g. from GraphQL/form)
  const defaultValue = useMemo<OutputData | undefined>(() => {
    if (loading) {
      return;
    }

    const emptyOutput: OutputData = { blocks: [] };

    if (initial === undefined || initial === null) {
      return emptyOutput;
    }

    // Already an OutputData object (e.g. product.description from form)
    if (
      typeof initial === "object" &&
      initial !== null &&
      Array.isArray((initial as OutputData).blocks)
    ) {
      return initial as OutputData;
    }

    if (typeof initial === "string") {
      if (initial.trim() === "") {
        return emptyOutput;
      }

      try {
        const result = JSON.parse(initial) as OutputData;

        if (!result || typeof result !== "object" || !Array.isArray(result.blocks)) {
          return emptyOutput;
        }

        return result;
      } catch {
        return undefined;
      }
    }

    return emptyOutput;
  }, [initial, loading]);

  // Derive synchronously so editor mounts on first paint when data is ready (no useEffect delay)
  const isReadyForMount = !loading && defaultValue !== undefined;

  return {
    isDirty,
    editorRef,
    handleChange,
    getValue,
    defaultValue,
    isReadyForMount,
  };
}

export default useRichText;
