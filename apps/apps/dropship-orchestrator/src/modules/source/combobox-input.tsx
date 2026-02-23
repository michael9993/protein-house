import { useId } from "react";

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

/**
 * Single-value combobox using native <input> + <datalist>.
 * User can type freely (new value) or pick from suggestions.
 */
export function ComboboxInput({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: ComboboxInputProps) {
  const listId = useId();

  return (
    <>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </datalist>
    </>
  );
}
