import { createContext, useContext, useState, type ReactNode } from "react";

interface PreviewState {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  deviceSize: "desktop" | "tablet" | "mobile";
  setDeviceSize: (size: "desktop" | "tablet" | "mobile") => void;
}

const PreviewContext = createContext<PreviewState | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deviceSize, setDeviceSize] = useState<"desktop" | "tablet" | "mobile">("desktop");

  return (
    <PreviewContext.Provider value={{ isPreviewOpen, setIsPreviewOpen, deviceSize, setDeviceSize }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreviewState(): PreviewState {
  const context = useContext(PreviewContext);
  if (!context) throw new Error("usePreviewState must be used within PreviewProvider");
  return context;
}
