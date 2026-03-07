import { useClipboard } from "@dashboard/hooks/useClipboard";
import { Check, Copy, ThumbsDown, ThumbsUp } from "lucide-react";

import { FeedbackValue } from "./types";

interface MessageActionsProps {
  content: string;
  messageId: string;
  feedbackValue: FeedbackValue;
  onFeedback: (messageId: string, value: FeedbackValue) => void;
}

export function MessageActions({
  content,
  messageId,
  feedbackValue,
  onFeedback,
}: MessageActionsProps) {
  const [copied, copy] = useClipboard();

  return (
    <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        onClick={() => copy(content)}
        className="rounded p-1 text-neutral-400 hover:text-neutral-600"
        title="Copy message"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        onClick={() => onFeedback(messageId, "up")}
        className={`rounded p-1 ${
          feedbackValue === "up"
            ? "text-green-600"
            : "text-neutral-400 hover:text-neutral-600"
        }`}
        title="Good response"
      >
        <ThumbsUp
          className="h-3.5 w-3.5"
          fill={feedbackValue === "up" ? "currentColor" : "none"}
        />
      </button>
      <button
        onClick={() => onFeedback(messageId, "down")}
        className={`rounded p-1 ${
          feedbackValue === "down"
            ? "text-red-500"
            : "text-neutral-400 hover:text-neutral-600"
        }`}
        title="Poor response"
      >
        <ThumbsDown
          className="h-3.5 w-3.5"
          fill={feedbackValue === "down" ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
}
