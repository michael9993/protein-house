import { useCallback, useRef } from "react";

import { OutputData } from "@dashboard/components/RichTextEditor/types";
import {
  getHtmlFromOutputData,
  htmlToOutputData,
} from "@dashboard/components/RichTextEditor/format-bridge";
import useMap from "../objects/useMap";

export interface RichTextGetters<TKey extends string> {
  getShouldMount: (id: TKey) => boolean;
  getDefaultValue: (id: TKey) => string;
  getHandleChange: (id: TKey) => (html: string) => void;
}

export type GetRichTextValues = Record<string, OutputData>;

interface RichTextMultipleOptions<TKey extends string> {
  initial: Record<TKey, string>;
  triggerChange: () => void;
}

export const useMultipleRichText = <TKey extends string>({
  initial,
  triggerChange,
}: RichTextMultipleOptions<TKey>) => {
  const htmlRefs = useRef<Record<string, string>>({});
  const [shouldMountMap, { set: setShouldMountById }] = useMap();

  const getHandleChange = (id: TKey) => (html: string) => {
    htmlRefs.current[id] = html;
    triggerChange();
  };

  const getDefaultValue = useCallback(
    (id: TKey): string => {
      if (initial[id] === undefined) {
        setShouldMountById(id, true);

        return "";
      }

      try {
        const parsed = JSON.parse(initial[id]) as OutputData;
        const html = getHtmlFromOutputData(parsed);

        htmlRefs.current[id] = html;
        setShouldMountById(id, true);

        return html;
      } catch {
        setShouldMountById(id, true);

        return "";
      }
    },
    [initial],
  );

  const getShouldMount = useCallback(
    (id: TKey) => shouldMountMap.get(id) ?? false,
    [shouldMountMap],
  );

  const getValues = async (): Promise<Record<string, OutputData>> => {
    const entries = Object.entries(htmlRefs.current)
      .filter(([, html]) => html !== undefined)
      .map(([key, html]) => [key, htmlToOutputData(html as string)] as [string, OutputData]);

    return Object.fromEntries(entries);
  };

  return {
    getters: {
      getShouldMount,
      getDefaultValue,
      getHandleChange,
    } as RichTextGetters<TKey>,
    getValues,
  };
};
