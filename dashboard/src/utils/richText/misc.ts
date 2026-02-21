import { OutputData } from "@dashboard/components/RichTextEditor/types";

export const getParsedDataForJsonStringField = (data: OutputData): string | null =>
  data?.blocks?.length ? JSON.stringify(data) : null;
