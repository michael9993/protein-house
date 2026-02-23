import { useState, useId, useCallback } from "react";
import { X } from "lucide-react";

interface ComboboxMultiProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

/**
 * Multi-value combobox with chips.
 * User types to search/create, presses Enter to add.
 * Each selected value renders as a removable chip.
 */
export function ComboboxMulti({
  values,
  onChange,
  options,
  placeholder = "Type to add...",
  className = "",
}: ComboboxMultiProps) {
  const listId = useId();
  const [inputValue, setInputValue] = useState("");

  const addValue = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      // Check if it matches an option label → use the option value instead
      const match = options.find(
        (o) => o.label.toLowerCase() === trimmed.toLowerCase() || o.value.toLowerCase() === trimmed.toLowerCase(),
      );
      const val = match ? match.value : trimmed;
      if (!values.includes(val)) {
        onChange([...values, val]);
      }
      setInputValue("");
    },
    [values, onChange, options],
  );

  const removeValue = useCallback(
    (val: string) => {
      onChange(values.filter((v) => v !== val));
    },
    [values, onChange],
  );

  const getLabel = (val: string) => {
    const match = options.find((o) => o.value === val);
    return match ? match.label : val;
  };

  return (
    <div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          list={listId}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            // Auto-add if user selected from datalist (value matches an option exactly)
            const exact = options.find((o) => o.value === e.target.value || o.label === e.target.value);
            if (exact) {
              addValue(exact.value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue(inputValue);
            }
          }}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        <datalist id={listId}>
          {options
            .filter((o) => !values.includes(o.value))
            .map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </datalist>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {values.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-brand text-white"
            >
              {getLabel(val)}
              <button
                onClick={() => removeValue(val)}
                className="p-0 hover:opacity-70 transition-opacity"
                type="button"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
