interface UpsertToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  entityLabel: string;
  matchDescription: string;
}

export function UpsertToggle({ checked, onChange, entityLabel, matchDescription }: UpsertToggleProps) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", marginTop: "4px" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: "16px", height: "16px" }}
      />
      <span style={{ fontWeight: 500 }}>Update existing {entityLabel}</span>
      <span style={{ color: "#94a3b8", fontSize: "12px" }}>({matchDescription})</span>
    </label>
  );
}
