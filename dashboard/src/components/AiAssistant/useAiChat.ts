import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

import { fetchEntityContext } from "./fetchEntityContext";
import { getPageContext } from "./pageContext";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { FeedbackMap, FeedbackValue, Message } from "./types";

const MAX_STORED_MESSAGES = 50;
const CONTEXT_WINDOW_MESSAGES = 10; // Last 10 messages sent to API (~5 turns ≈ 2K tokens)
const STORAGE_KEY_MESSAGES = "aura_ai_chat_history";
const STORAGE_KEY_FEEDBACK = "aura_ai_feedback";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function createMessage(
  role: "user" | "assistant",
  content: string,
): Message {
  return {
    role,
    content,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
}

export function useAiChat() {
  const [messages, setMessages] = useState<Message[]>(() =>
    loadFromStorage<Message[]>(STORAGE_KEY_MESSAGES, []),
  );
  const [feedback, setFeedback] = useState<FeedbackMap>(() =>
    loadFromStorage<FeedbackMap>(STORAGE_KEY_FEEDBACK, {}),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const location = useLocation();

  // Persist messages to localStorage (debounced — only when not streaming)
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  useEffect(() => {
    if (!isLoadingRef.current) {
      saveToStorage(STORAGE_KEY_MESSAGES, messages.slice(-MAX_STORED_MESSAGES));
    }
  }, [messages]);

  // Persist when streaming ends
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      saveToStorage(STORAGE_KEY_MESSAGES, messages.slice(-MAX_STORED_MESSAGES));
    }
  }, [isLoading]);

  // Persist feedback immediately (rare updates)
  useEffect(() => {
    saveToStorage(STORAGE_KEY_FEEDBACK, feedback);
  }, [feedback]);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setFeedback({});
    setError(null);
    saveToStorage(STORAGE_KEY_MESSAGES, []);
    saveToStorage(STORAGE_KEY_FEEDBACK, {});
  }, []);

  const handleFeedback = useCallback(
    (messageId: string, value: FeedbackValue) => {
      setFeedback(prev => ({
        ...prev,
        [messageId]: prev[messageId] === value ? null : value,
      }));
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const apiKey = import.meta.env.VITE_AI_API_KEY;
      if (!apiKey) {
        setError(
          "To use Aura Assistant, add VITE_AI_API_KEY to your .env file. Get an API key from console.anthropic.com.",
        );
        return;
      }

      const userMsg = createMessage("user", trimmed);
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const model =
          import.meta.env.VITE_AI_MODEL || "claude-haiku-4-5-20251001";
        const pageCtx = getPageContext(location.pathname);
        const entityCtx = await fetchEntityContext(location.pathname);
        const systemText = `${SYSTEM_PROMPT}\n\nThe user is currently on: ${pageCtx}${entityCtx ? `\n\nEntity data: ${entityCtx}` : ""}`;

        // TODO: For production, route through a backend proxy instead of
        // exposing the API key in the browser. This direct-access pattern
        // is only suitable for development/internal use.
        const response = await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
              model,
              max_tokens: 1024,
              system: systemText,
              messages: updatedMessages
                .slice(-CONTEXT_WINDOW_MESSAGES)
                .map(m => ({
                  role: m.role,
                  content: m.content,
                })),
              stream: true,
            }),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Invalid API key. Check VITE_AI_API_KEY in your .env file.",
            );
          }
          if (response.status === 429) {
            throw new Error(
              "Rate limited — please wait a moment and try again.",
            );
          }
          if (response.status >= 500) {
            throw new Error(
              "Anthropic API is temporarily unavailable. Please try again shortly.",
            );
          }
          const errBody = await response.text();
          throw new Error(`API error ${response.status}: ${errBody}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let assistantContent = "";
        let buffer = "";

        const assistantMsg = createMessage("assistant", "");
        setMessages(prev => [...prev, assistantMsg]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);
              if (
                event.type === "content_block_delta" &&
                event.delta?.text
              ) {
                assistantContent += event.delta.text;
                const content = assistantContent;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content,
                  };
                  return updated;
                });
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message || "Failed to get response");
          setMessages(prev =>
            prev[prev.length - 1]?.content === ""
              ? prev.slice(0, -1)
              : prev,
          );
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, isLoading, location.pathname],
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    isOpen,
    setIsOpen,
    error,
    feedback,
    toggle,
    sendMessage,
    clearChat,
    stopGeneration,
    handleFeedback,
  };
}
