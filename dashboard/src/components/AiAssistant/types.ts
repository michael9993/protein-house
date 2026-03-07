export interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
  timestamp: number;
}

export type FeedbackValue = "up" | "down" | null;

export type FeedbackMap = Record<string, FeedbackValue>;

export interface AiChatProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  feedback: FeedbackMap;
  expanded: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
  onClear: () => void;
  onStop: () => void;
  onToggleExpand: () => void;
  onFeedback: (messageId: string, value: FeedbackValue) => void;
}
