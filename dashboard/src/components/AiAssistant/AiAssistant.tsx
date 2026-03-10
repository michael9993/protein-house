import { Sparkles, X } from "lucide-react";
import { Component, type ReactNode, useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { AiChat } from "./AiChat";
import { useAiChat } from "./useAiChat";

class AiAssistantErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      // Silently hide — assistant crash should never affect the dashboard
      return null;
    }
    return this.props.children;
  }
}

function AiAssistantInner() {
  const enabled = !!import.meta.env.VITE_AI_ASSISTANT_ENABLED;
  const [expanded, setExpanded] = useState(false);
  const {
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
  } = useAiChat();

  const toggleExpand = useCallback(() => setExpanded(prev => !prev), []);

  const handleClose = useCallback(() => {
    setExpanded(false);
    toggle();
  }, [toggle]);

  useHotkeys("ctrl+., meta+.", toggle, {
    enableOnFormTags: true,
    preventDefault: true,
  });

  useHotkeys("ctrl+shift+., meta+shift+.", toggleExpand, {
    enableOnFormTags: true,
    preventDefault: true,
    enabled: isOpen,
  });

  useHotkeys(
    "escape",
    () => {
      if (expanded) {
        setExpanded(false);
      } else {
        setIsOpen(false);
      }
    },
    { enableOnFormTags: true, enabled: isOpen },
  );

  if (!enabled) return null;

  return (
    <>
      {isOpen && (
        <AiChat
          messages={messages}
          isLoading={isLoading}
          error={error}
          feedback={feedback}
          expanded={expanded}
          onSend={sendMessage}
          onClose={handleClose}
          onClear={clearChat}
          onStop={stopGeneration}
          onToggleExpand={toggleExpand}
          onFeedback={handleFeedback}
        />
      )}

      <button
        onClick={toggle}
        className="fixed bottom-20 right-4 z-[999] flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-20 sm:right-6"
        title={
          isOpen ? "Close assistant (Esc)" : "Open Aura Assistant (Ctrl+.)"
        }
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
      </button>
    </>
  );
}

export function AiAssistant() {
  return (
    <AiAssistantErrorBoundary>
      <AiAssistantInner />
    </AiAssistantErrorBoundary>
  );
}
