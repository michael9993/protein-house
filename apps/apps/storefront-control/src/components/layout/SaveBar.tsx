import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SaveStatus = "idle" | "saving" | "success" | "error";

interface SaveBarProps {
  isDirty: boolean;
  saveStatus: SaveStatus;
  onReset: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

function getStatusMessage(saveStatus: SaveStatus, isDirty: boolean): string | null {
  if (saveStatus === "saving") {
    return "Saving...";
  }
  if (saveStatus === "error") {
    return "Failed to save";
  }
  if (saveStatus === "success") {
    return "Changes saved";
  }
  if (isDirty) {
    return "You have unsaved changes";
  }
  return null;
}

export function SaveBar({
  isDirty,
  saveStatus,
  onReset,
  onSubmit,
  disabled,
}: SaveBarProps) {
  const [visible, setVisible] = useState(false);

  const shouldShow = isDirty || saveStatus === "saving" || saveStatus === "error" || saveStatus === "success";

  useEffect(() => {
    if (shouldShow) {
      setVisible(true);
    }
  }, [shouldShow]);

  // Auto-hide after success
  useEffect(() => {
    if (saveStatus !== "success") {
      return;
    }

    const timeout = setTimeout(() => {
      if (!isDirty) {
        setVisible(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [saveStatus, isDirty]);

  // Hide after transition when no longer needed
  useEffect(() => {
    if (!shouldShow && !visible) {
      return;
    }
    if (!shouldShow) {
      setVisible(false);
    }
  }, [shouldShow, visible]);

  if (!visible && !shouldShow) {
    return null;
  }

  const statusMessage = getStatusMessage(saveStatus, isDirty);

  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 left-56 h-16 border-t border-border bg-background px-6 flex items-center justify-between z-50",
        "transition-transform duration-200 ease-out",
        visible && shouldShow ? "translate-y-0" : "translate-y-full"
      )}
    >
      {/* Status */}
      <div className="flex items-center gap-2 text-sm">
        {saveStatus === "saving" && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {saveStatus === "success" && (
          <Check className="h-4 w-4 text-green-600" />
        )}
        {saveStatus === "error" && (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        {statusMessage && (
          <span
            className={cn(
              "font-medium",
              saveStatus === "error" && "text-destructive",
              saveStatus === "success" && "text-green-600",
              saveStatus === "saving" && "text-muted-foreground",
              saveStatus === "idle" && "text-foreground"
            )}
          >
            {statusMessage}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={saveStatus === "saving" || disabled}
        >
          Reset
        </Button>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={saveStatus === "saving" || !isDirty || disabled}
        >
          {saveStatus === "saving" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}
