import { type ReactNode, useCallback, useState } from "react";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PageHeader } from "./PageHeader";
import { CommandPalette } from "@/components/shared/CommandPalette";

interface AppShellProps {
  channelSlug: string;
  channelName?: string;
  activePage: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  showPreviewToggle?: boolean;
  previewActive?: boolean;
  onPreviewToggle?: () => void;
}

export function AppShell({
  channelSlug,
  channelName,
  activePage,
  title,
  description,
  actions,
  children,
  showPreviewToggle,
  previewActive,
  onPreviewToggle,
}: AppShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleSearchOpen = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  return (
    <div className="grid grid-cols-[14rem_1fr] min-h-screen">
      <Sidebar
        channelSlug={channelSlug}
        channelName={channelName}
        activePage={activePage}
      />

      <div className="flex flex-col min-h-screen">
        <TopBar
          title={title}
          onSearchOpen={handleSearchOpen}
          showPreviewToggle={showPreviewToggle}
          previewActive={previewActive}
          onPreviewToggle={onPreviewToggle}
        />

        {(description || actions) && (
          <PageHeader title={title} description={description}>
            {actions}
          </PageHeader>
        )}

        <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        channelSlug={channelSlug}
      />
    </div>
  );
}
