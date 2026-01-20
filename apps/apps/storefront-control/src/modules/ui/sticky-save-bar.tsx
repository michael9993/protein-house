import { useEffect, useState } from "react";

interface StickySaveBarProps {
  isDirty: boolean;
  isLoading: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  onReset: () => void;
  onSubmit: () => void;
  resetLabel?: string;
  saveLabel?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function StickySaveBar({
  isDirty,
  isLoading,
  isSuccess,
  isError,
  onReset,
  onSubmit,
  resetLabel = "Reset",
  saveLabel = "Save Changes",
  successMessage = "✓ Changes saved successfully",
  errorMessage = "✗ Error saving changes. Please try again.",
}: StickySaveBarProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 100,
        padding: "16px 24px",
        backgroundColor: "#fff",
        borderTop: "1px solid #ddd",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          {showSuccess && isSuccess && (
            <span style={{ color: "#000", fontSize: "14px" }}>
              {successMessage}
            </span>
          )}
          {isError && (
            <span style={{ color: "#d32f2f", fontSize: "14px" }}>
              {errorMessage}
            </span>
          )}
          {!isDirty && !showSuccess && !isError && (
            <span style={{ color: "#666", fontSize: "14px" }}>
              All changes saved
            </span>
          )}
          {isDirty && !isLoading && !isError && (
            <span style={{ color: "#666", fontSize: "14px" }}>
              You have unsaved changes
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={onReset}
            disabled={!isDirty || isLoading}
            style={{
              padding: "8px 16px",
              border: "1px solid #ddd",
              backgroundColor: "#fff",
              cursor: !isDirty || isLoading ? "not-allowed" : "pointer",
              opacity: !isDirty || isLoading ? 0.5 : 1,
              fontSize: "14px",
            }}
          >
            {resetLabel}
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            disabled={!isDirty || isLoading}
            style={{
              padding: "8px 16px",
              border: "none",
              backgroundColor: "#000",
              color: "#fff",
              cursor: !isDirty || isLoading ? "not-allowed" : "pointer",
              opacity: !isDirty || isLoading ? 0.5 : 1,
              fontSize: "14px",
            }}
          >
            {isLoading ? "Saving..." : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
