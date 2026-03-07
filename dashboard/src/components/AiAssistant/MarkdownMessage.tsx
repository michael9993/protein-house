import { marked } from "marked";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on\w+\s*=\s*'[^']*'/gi, "");
}

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const navigate = useNavigate();

  const html = useMemo(() => {
    const raw = marked.parse(content, {
      breaks: true,
      gfm: true,
    });
    return sanitizeHtml(typeof raw === "string" ? raw : "");
  }, [content]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "A") return;

      e.preventDefault();
      const href = (target as HTMLAnchorElement).getAttribute("href");
      if (!href) return;

      if (href.startsWith("/")) {
        navigate(href);
      } else {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    },
    [navigate],
  );

  return (
    <div
      className="ai-markdown"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
