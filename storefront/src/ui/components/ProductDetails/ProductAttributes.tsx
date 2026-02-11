"use client";

import type { ProductAttribute } from "./types";

interface Props {
  attributes: ProductAttribute[];
  noSpecificationsText?: string;
}

function renderValue(attr: ProductAttribute): React.ReactNode {
  const val = attr.values[0];
  if (!val) return "—";

  const inputType = attr.attribute.inputType;

  if (inputType === "BOOLEAN") {
    return val.boolean ? (
      <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }

  if (inputType === "SWATCH" && val.value) {
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block h-4 w-4 rounded-full border border-neutral-200"
          style={{ backgroundColor: val.value }}
        />
        {val.name}
      </span>
    );
  }

  if (inputType === "FILE" && val.file) {
    return (
      <a
        href={val.file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
      >
        {val.name || "Download"}
      </a>
    );
  }

  if (inputType === "RICH_TEXT" && val.richText) {
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: val.richText }}
      />
    );
  }

  if (inputType === "DATE" && val.date) {
    return new Date(val.date).toLocaleDateString();
  }

  if (inputType === "DATE_TIME" && val.dateTime) {
    return new Date(val.dateTime).toLocaleString();
  }

  // PLAIN_TEXT, DROPDOWN, MULTISELECT, NUMERIC, REFERENCE, etc.
  if (attr.values.length > 1) {
    return attr.values.map((v) => v.name).join(", ");
  }

  return val.plainText || val.name || "—";
}

export function ProductAttributes({ attributes, noSpecificationsText }: Props) {
  const visible = attributes.filter((a) => a.attribute.visibleInStorefront);

  if (visible.length === 0) {
    if (noSpecificationsText) {
      return <p className="text-sm text-neutral-500">{noSpecificationsText}</p>;
    }
    return null;
  }

  return (
    <div className="divide-y divide-neutral-100">
      {visible.map((attr) => (
        <div
          key={attr.attribute.id}
          className="grid grid-cols-2 gap-4 py-3 text-sm"
        >
          <span className="font-medium text-neutral-700">{attr.attribute.name}</span>
          <span className="text-neutral-600">{renderValue(attr)}</span>
        </div>
      ))}
    </div>
  );
}
