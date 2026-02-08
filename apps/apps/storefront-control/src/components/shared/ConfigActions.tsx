import { Download, Upload, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ConfigActionsProps {
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  isExporting?: boolean;
  isImporting?: boolean;
}

export function ConfigActions({
  onExport,
  onImport,
  onReset,
  isExporting,
  isImporting,
}: ConfigActionsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={isExporting}
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "Exporting..." : "Export"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onImport}
        disabled={isImporting}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isImporting ? "Importing..." : "Import"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onReset}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}
