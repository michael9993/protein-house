import { AppLayout } from "@/components/layout/AppLayout";
import { CanvasEditor } from "@/components/editor/CanvasEditor";

export default function EditorPage() {
  return (
    <AppLayout activePage="editor" title="Canvas Editor" fullWidth>
      <CanvasEditor />
    </AppLayout>
  );
}
