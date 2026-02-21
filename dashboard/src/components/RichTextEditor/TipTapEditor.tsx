import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TableExtension from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import ImageExtension from "@tiptap/extension-image";
import UnderlineExtension from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import { useEffect, useRef } from "react";

import { cn } from "@dashboard/utils/cn";

import { TipTapToolbar } from "./TipTapToolbar";
import "./tiptap-styles.css";

export interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onBlur?: () => void;
}

export function TipTapEditor({
  content,
  onChange,
  disabled = false,
  placeholder = "Start writing...",
  onBlur,
}: TipTapEditorProps) {
  const isExternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TableExtension.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      ImageExtension,
      UnderlineExtension,
      Placeholder.configure({
        placeholder,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      if (!isExternalUpdate.current) {
        onChange(e.getHTML());
      }
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  // Sync editable state
  useEffect(() => {
    if (editor && editor.isEditable !== !disabled) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  // Sync external content changes (e.g. record switching)
  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    // Only update if the external content is meaningfully different
    if (content !== currentHtml) {
      isExternalUpdate.current = true;
      editor.commands.setContent(content, false);
      isExternalUpdate.current = false;
    }
  }, [content, editor]);

  return (
    <div
      className={cn(
        "tiptap-editor border border-gray-300 rounded-lg overflow-hidden",
        "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500",
        disabled && "opacity-50 pointer-events-none bg-gray-50",
      )}
    >
      <TipTapToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
