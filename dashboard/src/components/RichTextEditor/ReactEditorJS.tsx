import EditorJS, { EditorConfig, OutputData, ToolConstructable } from "@editorjs/editorjs";
import Paragraph from "@editorjs/paragraph";
import {
  EditorCore,
  Props as ReactEditorJSProps,
  ReactEditorJS as BaseReactEditorJS,
} from "@react-editor-js/core";
import { useCallback } from "react";

import { convertEditorJSListBlocks } from "./utils";

function suppressEditorJSMobileLayoutWarn() {
  const warn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("EventDispatcher") &&
      args[0].includes("editor mobile layout toggled")
    ) {
      return;
    }
    warn.apply(console, args);
  };
  return () => {
    console.warn = warn;
  };
}

// Source of @react-editor-js
class ClientEditorCore implements EditorCore {
  private readonly _editorJS: EditorJS;

  constructor({ tools, ...config }: EditorConfig) {
    const extendTools = {
      // default tools
      paragraph: {
        class: Paragraph,
        inlineToolbar: true,
      } as unknown as ToolConstructable,
      ...tools,
    };

    // EditorJS expects "data" for initial content; @react-editor-js may pass "defaultValue"
    const editorConfig: EditorConfig = {
      tools: extendTools,
      ...config,
    };
    if (
      (editorConfig as EditorConfig & { defaultValue?: OutputData }).defaultValue !== undefined &&
      editorConfig.data === undefined
    ) {
      editorConfig.data = (editorConfig as EditorConfig & { defaultValue: OutputData }).defaultValue;
    }

    const restoreWarn = suppressEditorJSMobileLayoutWarn();
    try {
      this._editorJS = new EditorJS(editorConfig);
    } finally {
      restoreWarn();
    }
  }

  public async clear() {
    await this._editorJS.clear();
  }

  public async save() {
    await this._editorJS.isReady;

    return convertEditorJSListBlocks(await this._editorJS.save());
  }

  public async destroy() {
    try {
      if (this._editorJS) {
        await this._editorJS.isReady;
        const restoreWarn = suppressEditorJSMobileLayoutWarn();
        try {
          this._editorJS.destroy();
        } finally {
          restoreWarn();
        }
      }
    } catch (e) {
      /*
        Dismiss that error.
        Sometimes instance is already unmounted while Editor wants to destroy it.
        Editorjs does this properly so this error does not break anything
       */
    }
  }

  public async render(data: OutputData) {
    await this._editorJS.render(data);
  }

  /**
   * This property is required by the EditorCore interface to optionally expose
   * the underlying Editor.js instance for advanced use cases. In this implementation,
   * we intentionally do not expose the low-level instance to maintain encapsulation
   * and prevent unsafe direct access. Therefore, this always returns null.
   */
  public get dangerouslyLowLevelInstance(): any | null {
    return null;
  }
}

type Props = Omit<ReactEditorJSProps, "factory">;

function ReactEditorJSClient(props: Props) {
  const factory = useCallback((config: EditorConfig) => new ClientEditorCore(config), []);

  return <BaseReactEditorJS factory={factory} {...props} />;
}

export const ReactEditorJS = ReactEditorJSClient;
