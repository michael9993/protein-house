import { useMemo, useRef, useState } from "react";

import { OutputData } from "@dashboard/components/RichTextEditor/types";
import {
  getHtmlFromOutputData,
  htmlToOutputData,
} from "@dashboard/components/RichTextEditor/format-bridge";

export interface UseRichTextOptions {
  initial: string | OutputData | null | undefined;
  loading?: boolean;
  triggerChange: () => void;
}

export interface UseRichTextResult {
  handleChange: (html: string) => void;
  getValue: () => Promise<OutputData>;
  defaultValue: string;
  isReadyForMount: boolean;
  isDirty: boolean;
}

export function useRichText({
  initial,
  loading,
  triggerChange,
}: UseRichTextOptions): UseRichTextResult {
  const [isDirty, setIsDirty] = useState(false);
  const htmlRef = useRef<string>("");

  const handleChange = (html: string) => {
    htmlRef.current = html;
    setIsDirty(true);
    triggerChange();
  };

  const getValue = async (): Promise<OutputData> => {
    setIsDirty(false);
    const html = htmlRef.current;

    if (!html || html === "<p></p>") {
      return { blocks: [] };
    }

    return htmlToOutputData(html);
  };

  // Compute defaultValue as HTML string from the initial data
  const defaultValue = useMemo<string>(() => {
    if (loading) {
      return "";
    }

    if (initial === undefined || initial === null) {
      return "";
    }

    // Already an OutputData object
    if (
      typeof initial === "object" &&
      initial !== null &&
      Array.isArray((initial as OutputData).blocks)
    ) {
      const html = getHtmlFromOutputData(initial as OutputData);

      htmlRef.current = html;

      return html;
    }

    if (typeof initial === "string") {
      if (initial.trim() === "") {
        return "";
      }

      try {
        const parsed = JSON.parse(initial) as OutputData;

        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.blocks)) {
          return "";
        }

        const html = getHtmlFromOutputData(parsed);

        htmlRef.current = html;

        return html;
      } catch {
        // If it's not JSON, treat as raw HTML
        htmlRef.current = initial;

        return initial;
      }
    }

    return "";
  }, [initial, loading]);

  const isReadyForMount = !loading;

  return {
    isDirty,
    handleChange,
    getValue,
    defaultValue,
    isReadyForMount,
  };
}

export default useRichText;
