import { EditorConfig } from "@editorjs/editorjs";
import { EditorCore } from "@react-editor-js/core";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const useHasRendered = () => {
  const [hasRendered, setHasRendereed] = useState(false);

  useLayoutEffect(() => {
    setHasRendereed(true);
  }, []);

  return hasRendered;
};

export const useUpdateOnRerender = ({
  render,
  defaultValue,
  hasRendered,
}: {
  render: EditorCore["render"] | undefined;
  defaultValue: EditorConfig["data"];
  hasRendered: boolean;
}) => {
  const prevDefaultValue = useRef<EditorConfig["data"] | undefined>(undefined);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (!hasRendered) {
      return;
    }

    // Don't call render when data is not ready (would overwrite editor with empty blocks)
    if (defaultValue === undefined) {
      return;
    }

    // First run: editor already received initial data from ReactEditorJS props; do not overwrite.
    // Only call render() when defaultValue actually changes (e.g. user switched to another record).
    if (isFirstRun.current) {
      isFirstRun.current = false;
      prevDefaultValue.current = defaultValue;
      return;
    }

    if (JSON.stringify(defaultValue) === JSON.stringify(prevDefaultValue.current)) {
      return;
    }

    prevDefaultValue.current = defaultValue;

    render?.({
      blocks: defaultValue?.blocks ?? [],
    });
  }, [defaultValue, hasRendered, render]);
};
