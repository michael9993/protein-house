import { createElement, Fragment } from "react";
import { vi } from "vitest";

const useIntl = vi.fn(() => ({
  formatMessage: vi.fn(x => x.defaultMessage),
  formatDate: vi.fn(x => x),
  formatTime: vi.fn(x => x),
  formatNumber: vi.fn(x => x),
  locale: "en",
}));

const defineMessages = vi.fn(x => x);
const defineMessage = vi.fn(x => x);

const FormattedMessage = vi.fn(({ defaultMessage }: { defaultMessage: string }) =>
  createElement(Fragment, null, defaultMessage),
);

const IntlProvider = ({ children }: { children: React.ReactNode }) =>
  createElement(Fragment, null, children);

const createIntl = vi.fn(() => ({
  formatMessage: vi.fn(x => x.defaultMessage),
  formatDate: vi.fn(x => x),
  formatTime: vi.fn(x => x),
  formatNumber: vi.fn(x => x),
  locale: "en",
}));

const FormattedDate = ({ value }: { value: any }) => createElement(Fragment, null, value);

export {
  useIntl,
  defineMessages,
  defineMessage,
  FormattedMessage,
  IntlProvider,
  createIntl,
  FormattedDate,
};

// Export types for TypeScript
export type {
  IntlShape,
  MessageDescriptor,
  FormattedMessageProps,
  ReactIntlErrorCode,
} from "react-intl";
