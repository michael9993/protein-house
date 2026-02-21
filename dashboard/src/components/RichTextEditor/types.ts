/**
 * Local OutputData type — same shape as @editorjs/editorjs OutputData.
 * Decouples the codebase from the Editor.js package.
 */
export interface OutputData {
  time?: number;
  version?: string;
  blocks: Array<{
    id?: string;
    type: string;
    data: Record<string, any>;
  }>;
}
