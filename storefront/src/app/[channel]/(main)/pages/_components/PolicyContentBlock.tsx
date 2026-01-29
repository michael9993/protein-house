"use client";

import React from "react";

const bulletPattern = /^[\*\-•]\s/;
// Matches "1. ", "2.1 ", "10.2 " etc. (digit(s), dot, optional digit(s), space)
const numberedPattern = /^\d+\.\d*\s/;

/**
 * Renders policy content with simple markup from Storefront Control:
 * - ## Heading → <h2>
 * - ### Subheading → <h3>
 * - * / - / • at line start → <ul><li>
 * - 1. / 2.1 / 3.1 at line start → <ol><li>
 * - **text** → <strong>
 * - Double newline → paragraph break
 * All content is from config; no hardcoded text.
 */
export function PolicyContentBlock({ text, className = "" }: { text: string; className?: string }) {
  if (!text.trim()) return null;

  const blocks = text.split(/\n\n+/);
  const nodes: React.ReactNode[] = [];

  blocks.forEach((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    const lines = trimmed.split("\n").map((l) => l.trimEnd());
    const first = lines[0] ?? "";

    if (first.startsWith("## ")) {
      nodes.push(
        <h2
          key={i}
          className="mb-4 mt-8 text-xl font-semibold first:mt-0"
          style={{ color: "var(--store-text)" }}
        >
          {formatInline(first.slice(3))}
        </h2>
      );
      const rest = lines.slice(1).join("\n").trim();
      if (rest) nodes.push(<FragmentBlock key={`${i}-rest`} text={rest} />);
      return;
    }

    if (first.startsWith("### ")) {
      nodes.push(
        <h3
          key={i}
          className="mb-3 mt-6 text-lg font-semibold first:mt-0"
          style={{ color: "var(--store-text)" }}
        >
          {formatInline(first.slice(4))}
        </h3>
      );
      const rest = lines.slice(1).join("\n").trim();
      if (rest) nodes.push(<FragmentBlock key={`${i}-rest`} text={rest} />);
      return;
    }

    if (lines.length > 0 && lines.every((l) => bulletPattern.test(l) || l === "")) {
      const items = lines.filter(Boolean).map((l) => l.replace(bulletPattern, ""));
      nodes.push(
        <ul key={i} className="mb-4 ml-5 list-disc space-y-1 text-base" style={{ color: "var(--store-text)" }}>
          {items.map((item, j) => (
            <li key={j}>{formatInline(item)}</li>
          ))}
        </ul>
      );
      return;
    }

    if (lines.length > 0 && lines.every((l) => numberedPattern.test(l) || l === "")) {
      const items = lines.filter(Boolean).map((l) => l.replace(numberedPattern, ""));
      nodes.push(
        <ol key={i} className="mb-4 ml-5 list-decimal space-y-1 text-base" style={{ color: "var(--store-text)" }}>
          {items.map((item, j) => (
            <li key={j}>{formatInline(item)}</li>
          ))}
        </ol>
      );
      return;
    }

    nodes.push(
      <div key={i} className="mb-4 text-base leading-relaxed" style={{ color: "var(--store-text)" }}>
        <FragmentBlock text={block} />
      </div>
    );
  });

  return <div className={className}>{nodes}</div>;
}

/** Renders a chunk that may contain mixed paragraphs and lists (single block, no ##/###). */
function FragmentBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let listItems: string[] = [];
  let orderedItems: string[] = [];
  const flushList = () => {
    if (listItems.length) {
      out.push(
        <ul key={out.length} className="mb-3 ml-5 list-disc space-y-1" style={{ color: "var(--store-text)" }}>
          {listItems.map((item, i) => (
            <li key={i}>{formatInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };
  const flushOrdered = () => {
    if (orderedItems.length) {
      out.push(
        <ol key={out.length} className="mb-3 ml-5 list-decimal space-y-1" style={{ color: "var(--store-text)" }}>
          {orderedItems.map((item, i) => (
            <li key={i}>{formatInline(item)}</li>
          ))}
        </ol>
      );
      orderedItems = [];
    }
  };
  lines.forEach((line) => {
    if (bulletPattern.test(line)) {
      flushOrdered();
      listItems.push(line.replace(bulletPattern, ""));
    } else if (numberedPattern.test(line)) {
      flushList();
      orderedItems.push(line.replace(numberedPattern, ""));
    } else {
      flushList();
      flushOrdered();
      if (line.trim()) out.push(<p key={out.length} className="mb-2">{formatInline(line)}</p>);
    }
  });
  flushList();
  flushOrdered();
  return <>{out}</>;
}

/** **bold** → <strong>; no raw HTML to avoid XSS. */
function formatInline(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*(.+)\*\*$/);
    if (m) return <strong key={i}>{m[1]}</strong>;
    return part;
  });
}
