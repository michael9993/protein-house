"use client";

import { formatUnit } from "./formatUnit";
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
      <svg className="h-5 w-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="h-5 w-5 text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

  // NUMERIC with unit (e.g., "150 cm", "2.5 kg")
  if (inputType === "NUMERIC") {
    const numValue = val.plainText || val.name;
    const unitLabel = formatUnit(attr.attribute.unit);
    if (unitLabel) {
      return `${numValue} ${unitLabel}`;
    }
    return numValue || "—";
  }

  // MULTISELECT — show values as inline badges
  if (inputType === "MULTISELECT" && attr.values.length > 1) {
    return (
      <span className="inline-flex flex-wrap gap-1">
        {attr.values.map((v) => (
          <span key={v.id} className="rounded bg-neutral-100 px-2 py-0.5 text-xs">
            {v.name}
          </span>
        ))}
      </span>
    );
  }

  // PLAIN_TEXT, DROPDOWN, REFERENCE, etc.
  if (attr.values.length > 1) {
    return attr.values.map((v) => v.name).join(", ");
  }

  return val.plainText || val.name || "—";
}

function hasNonEmptyValues(attr: ProductAttribute): boolean {
  if (attr.values.length === 0) return false;
  return attr.values.some(
    (v) =>
      v.boolean !== null ||
      v.richText ||
      v.plainText ||
      v.name ||
      v.date ||
      v.dateTime ||
      v.file ||
      v.value,
  );
}

export function ProductAttributes({ attributes, noSpecificationsText }: Props) {
  const visible = attributes.filter(
    (a) => a.attribute.visibleInStorefront && hasNonEmptyValues(a),
  );

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
