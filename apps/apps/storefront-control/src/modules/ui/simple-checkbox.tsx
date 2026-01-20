import { Controller, Control, Path, FieldValues } from "react-hook-form";

interface SimpleCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  description?: string;
}

export function SimpleCheckbox<T extends FieldValues>({
  name,
  control,
  label,
  description,
}: SimpleCheckboxProps<T>) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "16px",
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      marginBottom: "16px",
    }}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <input
            type="checkbox"
            checked={field.value === true}
            onChange={(e) => field.onChange(e.target.checked)}
            style={{
              width: "18px",
              height: "18px",
              marginTop: "2px",
              cursor: "pointer",
            }}
          />
        )}
      />
      <div style={{ flex: 1 }}>
        <label style={{ 
          display: "block",
          fontSize: "14px", 
          fontWeight: "500",
          marginBottom: description ? "4px" : 0,
          cursor: "pointer"
        }}>
          {label}
        </label>
        {description && (
          <p style={{ fontSize: "12px", color: "#666", margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
