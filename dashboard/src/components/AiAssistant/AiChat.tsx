import { cn } from "@dashboard/utils/cn";
import { ArrowUp, Maximize2, Minimize2, Square, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

import { MarkdownMessage } from "./MarkdownMessage";
import { MessageActions } from "./MessageActions";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { AiChatProps } from "./types";

export function AiChat({
  messages,
  isLoading,
  error,
  feedback,
  expanded,
  onSend,
  onClose,
  onClear,
  onStop,
  onToggleExpand,
  onFeedback,
}: AiChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Re-focus input after expand/collapse
  useEffect(() => {
    inputRef.current?.focus();
  }, [expanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const lastMsg = messages[messages.length - 1];
  const showLoadingDots =
    isLoading &&
    (messages.length === 0 ||
      lastMsg?.role === "user" ||
      lastMsg?.content === "");

  return (
    <div
      className={cn(
        "fixed z-[998] flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl transition-all duration-200 ease-out",
        expanded
          ? "inset-x-4 bottom-4 top-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(680px,calc(100vh-80px))] sm:w-[640px] sm:-translate-x-1/2 sm:-translate-y-1/2"
          : "bottom-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-[380px]",
      )}
      style={
        expanded ? undefined : { height: "min(500px, calc(100vh - 120px))" }
      }
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <div>
          <h3 className="text-[14px] font-semibold text-neutral-900">
            Aura Assistant
          </h3>
          <p className="text-[11px] text-neutral-500">
            AI-powered dashboard help
          </p>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={onClear}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onToggleExpand}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            title={expanded ? "Collapse (Ctrl+Shift+.)" : "Expand (Ctrl+Shift+.)"}
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !isLoading && (
          <SuggestedPrompts pathname={location.pathname} onSelect={onSend} />
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "group max-w-[85%]",
                msg.role === "user" ? "text-right" : "",
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 leading-relaxed",
                  expanded ? "text-[14px]" : "text-[13px]",
                  msg.role === "user"
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-800",
                )}
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {msg.role === "assistant" ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "assistant" && msg.content && (
                <MessageActions
                  content={msg.content}
                  messageId={msg.id}
                  feedbackValue={feedback[msg.id] ?? null}
                  onFeedback={onFeedback}
                />
              )}
            </div>
          </div>
        ))}

        {showLoadingDots && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl bg-neutral-100 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] leading-relaxed text-red-700">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-neutral-200 bg-white px-3 py-2.5"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything about the dashboard..."
          className={cn(
            "flex-1 border-none bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400",
            expanded ? "text-[14px]" : "text-[13px]",
          )}
          disabled={isLoading}
        />
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="rounded-lg bg-neutral-200 p-2 text-neutral-600 hover:bg-neutral-300"
            title="Stop generating"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-full bg-black p-1.5 text-white disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}
