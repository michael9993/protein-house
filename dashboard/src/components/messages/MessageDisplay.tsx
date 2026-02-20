import { commonMessages } from "@dashboard/intl";
import { cn } from "@dashboard/utils/cn";
import { Portal } from "@radix-ui/react-portal";
import { ReactNode, useState } from "react";
import { useIntl } from "react-intl";
import { TransitionGroup } from "react-transition-group";

import Container from "./Container";
import { messages as notificationMessages } from "./messages";
import Transition from "./Transition";
import { MessageComponentValues } from "./useMessageState";

type NotificationType = "success" | "error" | "info" | "warning";

const typeStyles: Record<NotificationType, string> = {
  success: "border-l-green-500 bg-white",
  error: "border-l-red-500 bg-white",
  warning: "border-l-yellow-500 bg-white",
  info: "border-l-blue-500 bg-white",
};

const typeIconColors: Record<NotificationType, string> = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
};

interface NotificationCardProps {
  title: string;
  type: NotificationType;
  content?: ReactNode;
  apiMessage?: {
    apiMessageContent: ReactNode;
    showApiLabel: string;
    hideApiLabel: string;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}

function NotificationCard({
  title,
  type,
  content,
  apiMessage,
  action,
  onClose,
  onMouseEnter,
  onMouseLeave,
  className,
}: NotificationCardProps) {
  const [apiExpanded, setApiExpanded] = useState(false);

  return (
    <div
      role="alert"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "relative w-[400px] rounded-md border-l-4 shadow-lg",
        typeStyles[type],
        className,
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm font-semibold", typeIconColors[type])}>
              {title}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          {content && (
            <div className="mt-1 text-sm text-gray-600">{content}</div>
          )}
          {apiMessage && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setApiExpanded(prev => !prev)}
                className="text-xs font-medium text-gray-500 underline hover:text-gray-700"
              >
                {apiExpanded ? apiMessage.hideApiLabel : apiMessage.showApiLabel}
              </button>
              {apiExpanded && (
                <div className="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
                  {apiMessage.apiMessageContent}
                </div>
              )}
            </div>
          )}
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const MessageDisplay = ({
  notifications,
  pauseTimer,
  resumeTimer,
}: MessageComponentValues) => {
  const intl = useIntl();

  return (
    <Portal>
      <TransitionGroup appear options={{ position: "top right" }} component={Container}>
        {notifications?.map(notification => (
          <Transition key={notification.id}>
            <NotificationCard
              {...(notification.timeout
                ? {
                    onMouseEnter: () => pauseTimer(notification),
                    onMouseLeave: () => resumeTimer(notification),
                  }
                : {})}
              onClose={notification.close}
              title={
                (notification.message.apiMessage && !notification.message.title
                  ? intl.formatMessage(commonMessages.defaultErrorTitle)
                  : notification.message.title) as string
              }
              type={(notification.message.status || "info") as NotificationType}
              content={notification.message.text}
              apiMessage={
                notification.message.apiMessage
                  ? {
                      apiMessageContent: (
                        <pre className="overflow-anywhere whitespace-pre-wrap">
                          {notification.message.apiMessage}
                        </pre>
                      ),
                      hideApiLabel: intl.formatMessage(notificationMessages.hideError),
                      showApiLabel: intl.formatMessage(notificationMessages.seeError),
                    }
                  : undefined
              }
              {...(notification.message.actionBtn
                ? {
                    action: {
                      label: notification.message.actionBtn.label,
                      onClick: notification.message.actionBtn.action,
                    },
                  }
                : {})}
              className="pointer-events-auto m-4"
            />
          </Transition>
        ))}
      </TransitionGroup>
    </Portal>
  );
};
