declare module "formidable" {
  import type { IncomingMessage } from "http";

  export interface File {
    filepath: string;
    originalFilename: string | null;
    newFilename: string;
    mimetype: string | null;
    size: number;
  }

  export interface ParsedFiles {
    [key: string]: File | File[];
  }

  export interface Options {
    maxFileSize?: number;
    maxFiles?: number;
    keepExtensions?: boolean;
    encoding?: string;
    multiples?: boolean;
  }

  export class IncomingForm {
    constructor(options?: Options);
    parse(req: IncomingMessage): Promise<{ fields: Record<string, string[]>; files: ParsedFiles }>;
  }

  export function parse(
    req: IncomingMessage,
    options?: Options,
    callback?: (err: Error | null, fields: Record<string, string[]>, files: ParsedFiles) => void
  ): Promise<{ fields: Record<string, string[]>; files: ParsedFiles }>;
}
