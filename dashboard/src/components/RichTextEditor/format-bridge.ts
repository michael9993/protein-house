import { OutputData } from "./types";

/**
 * Converts legacy Editor.js JSON blocks to an HTML string.
 * Handles all standard Editor.js block types + our rawHtml wrapper.
 */
export function editorjsToHtml(data: OutputData): string {
  if (!data?.blocks?.length) return "";

  return data.blocks
    .map(block => {
      switch (block.type) {
        case "rawHtml":
          return block.data.html ?? "";

        case "header": {
          const level = block.data.level ?? 2;
          const tag = `h${Math.min(Math.max(level, 1), 6)}`;
          return `<${tag}>${block.data.text ?? ""}</${tag}>`;
        }

        case "paragraph":
          return `<p>${block.data.text ?? ""}</p>`;

        case "list": {
          const tag = block.data.style === "ordered" ? "ol" : "ul";
          const items = (block.data.items ?? []) as Array<string | { content: string }>;
          const lis = items
            .map(item => {
              const text = typeof item === "string" ? item : item.content ?? "";
              return `<li>${text}</li>`;
            })
            .join("");
          return `<${tag}>${lis}</${tag}>`;
        }

        case "quote":
          return `<blockquote>${block.data.text ?? ""}</blockquote>`;

        case "embed":
          return block.data.embed
            ? `<div data-embed><iframe src="${block.data.embed}" allowfullscreen></iframe></div>`
            : "";

        default:
          return block.data.text ? `<p>${block.data.text}</p>` : "";
      }
    })
    .filter(Boolean)
    .join("");
}

/**
 * Strips HTML tags from a string, returning plaintext.
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Wraps TipTap HTML into Editor.js-compatible OutputData format.
 * The "rawHtml" block type satisfies Saleor's clean_editor_js() backend constraint.
 */
export function htmlToOutputData(html: string): OutputData {
  return {
    time: Date.now(),
    version: "2.0.0",
    blocks: [
      {
        type: "rawHtml",
        data: {
          html,
          text: stripHtmlTags(html),
        },
      },
    ],
  };
}

/**
 * Checks if OutputData uses our rawHtml wrapper format.
 */
export function isRawHtmlFormat(data: OutputData): boolean {
  return (
    data.blocks.length === 1 &&
    data.blocks[0].type === "rawHtml" &&
    typeof data.blocks[0].data.html === "string"
  );
}

/**
 * Extracts HTML from OutputData — handles both rawHtml format and legacy Editor.js blocks.
 */
export function getHtmlFromOutputData(data: OutputData): string {
  if (!data?.blocks?.length) return "";

  // Check for our rawHtml wrapper format first
  const rawBlock = data.blocks.find(b => b.type === "rawHtml");
  if (rawBlock?.data?.html) {
    return rawBlock.data.html;
  }

  // Legacy Editor.js blocks — convert to HTML
  return editorjsToHtml(data);
}
