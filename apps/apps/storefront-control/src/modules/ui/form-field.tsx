import { UseFormRegister, FieldErrors, Path, FieldValues, Control, Controller } from "react-hook-form";

interface FormFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  type?: "text" | "email" | "number" | "url" | "color" | "textarea";
  placeholder?: string;
  description?: string;
  required?: boolean;
}

export function FormField<T extends FieldValues>({
  label,
  name,
  register,
  errors,
  type = "text",
  placeholder,
  description,
  required,
}: FormFieldProps<T>) {
  const error = errors?.[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={{ 
        display: "block",
        fontSize: "14px", 
        fontWeight: "500",
        marginBottom: "8px"
      }}>
        {label}
        {required && <span style={{ color: "#d32f2f", marginLeft: "4px" }}> *</span>}
      </label>
      
      {type === "textarea" ? (
        <textarea
          {...register(name)}
          placeholder={placeholder}
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "10px 12px",
            border: errorMessage ? "1px solid #d32f2f" : "1px solid #ddd",
            fontFamily: "inherit",
            fontSize: "14px",
            resize: "vertical",
          }}
        />
      ) : type === "color" ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="color"
            {...register(name)}
            style={{
              width: "40px",
              height: "40px",
              padding: 0,
              border: "1px solid #ddd",
              cursor: "pointer",
            }}
          />
          <input
            type="text"
            {...register(name)}
            placeholder="#000000"
            style={{
              maxWidth: "120px",
              padding: "8px 12px",
              border: "1px solid #ddd",
              fontSize: "14px"
            }}
          />
        </div>
      ) : (
        <input
          {...register(name, { valueAsNumber: type === "number" })}
          type={type}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: errorMessage ? "1px solid #d32f2f" : "1px solid #ddd",
            fontSize: "14px"
          }}
        />
      )}
      
      {description && !errorMessage && (
        <p style={{ fontSize: "12px", color: "#666", marginTop: "8px", margin: "8px 0 0 0", lineHeight: 1.4 }}>
          {description}
        </p>
      )}
      
      {errorMessage && (
        <p style={{ fontSize: "12px", color: "#d32f2f", marginTop: "8px", margin: "8px 0 0 0" }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

interface ToggleFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  control: Control<T>;
  description?: string;
}

/**
 * Controlled toggle field using Controller for proper Macaw UI Checkbox binding.
 * Macaw UI Checkbox requires `checked` + `onCheckedChange` props.
 */
export function ToggleField<T extends FieldValues>({
  label,
  name,
  control,
  description,
}: ToggleFieldProps<T>) {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "flex-start", 
      gap: "12px",
      padding: "12px 0",
      borderBottom: "1px solid #ddd"
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
      <div>
        <label style={{ display: "block", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
          {label}
        </label>
        {description && (
          <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0 0" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

interface CheckboxFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  description?: string;
}

/**
 * Simple checkbox field using register for boolean fields
 */
export function CheckboxField<T extends FieldValues>({
  label,
  name,
  register,
  description,
}: CheckboxFieldProps<T>) {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "flex-start", 
      gap: "8px",
      padding: "12px 0"
    }}>
      <input
        type="checkbox"
        {...register(name)}
        style={{
          width: "18px",
          height: "18px",
          marginTop: "2px",
          cursor: "pointer",
        }}
      />
      <div>
        <label style={{ display: "block", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
          {label}
        </label>
        {description && (
          <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0 0" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

interface SelectFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  options: { value: string; label: string }[];
  description?: string;
}

export function SelectField<T extends FieldValues>({
  label,
  name,
  register,
  options,
  description,
}: SelectFieldProps<T>) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={{ 
        display: "block",
        fontSize: "14px", 
        fontWeight: "500",
        marginBottom: "8px"
      }}>
        {label}
      </label>
      <select
        {...register(name)}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #ddd",
          fontFamily: "inherit",
          fontSize: "14px",
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {description && (
        <p style={{ fontSize: "12px", color: "#666", marginTop: "8px", margin: "8px 0 0 0", lineHeight: 1.4 }}>
          {description}
        </p>
      )}
    </div>
  );
}
