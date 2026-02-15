interface AIProcessingOverlayProps {
  message: string;
}

export function AIProcessingOverlay({ message }: AIProcessingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background rounded-lg p-8 flex flex-col items-center shadow-xl">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">This may take a moment...</p>
      </div>
    </div>
  );
}
