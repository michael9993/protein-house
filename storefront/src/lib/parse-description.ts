import edjsHTML from "editorjs-html";

// Register custom parser for our TipTap rawHtml block type
// so editorjs-html doesn't throw "Parser function of type rawHtml is not defined"
const parser = edjsHTML({
  rawHtml: (block: { data: { html?: string } }) => block.data.html || "",
});

/**
 * Parses a JSON description string into HTML.
 * Supports both:
 *  - New TipTap rawHtml format: { blocks: [{ type: "rawHtml", data: { html: "..." } }] }
 *  - Legacy Editor.js format: { blocks: [{ type: "paragraph", data: { text: "..." } }, ...] }
 */
export function parseDescription(jsonString: string | null | undefined): string {
  if (!jsonString) return "";

  try {
    const data = JSON.parse(jsonString) as {
      blocks?: Array<{ type: string; data: Record<string, string> }>;
    };

    if (!data?.blocks?.length) return "";

    // New format: rawHtml wrapper block (from TipTap)
    const rawBlock = data.blocks.find((b) => b.type === "rawHtml");
    if (rawBlock?.data?.html) {
      return rawBlock.data.html;
    }

    // Legacy format: Editor.js blocks → HTML via editorjs-html
    const htmlBlocks = parser.parse(data);
    return htmlBlocks.filter(Boolean).join("");
  } catch {
    // If not valid JSON, return as-is (might be raw HTML)
    return typeof jsonString === "string" ? jsonString : "";
  }
}
