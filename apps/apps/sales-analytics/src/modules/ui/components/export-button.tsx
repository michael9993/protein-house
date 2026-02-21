import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
}

export function ExportButton({ onClick, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = async () => {
    setIsExporting(true);
    try {
      await onClick();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      Export to Excel
    </button>
  );
}
