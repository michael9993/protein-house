import "@testing-library/jest-dom/vitest";

import { configure } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@sentry/react");
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
  useHotkeysContext: vi.fn(),
  HotkeysProvider: ({ children }: { children: React.ReactNode }) => children,
}));

document.getElementById = () => document.createElement("div");

// workaround for `jsdom`
// https://github.com/jsdom/jsdom/issues/3002
document.createRange = () => {
  const range = new Range();

  range.getBoundingClientRect = vi.fn();

  range.getClientRects = () => ({
    item: () => null,
    length: 0,
    [Symbol.iterator]: vi.fn(),
  });

  return range;
};

window.__SALEOR_CONFIG__ = {
  API_URL: "http://localhost:8000/graphql/",
  APP_MOUNT_URI: "/",
  APPS_MARKETPLACE_API_URL: "http://localhost:3000",
  EXTENSIONS_API_URL: "http://localhost:3000",
  APPS_TUNNEL_URL_KEYWORDS: ".ngrok.io;.saleor.live",
  IS_CLOUD_INSTANCE: "true",
  LOCALE_CODE: "EN",
};

process.env.TZ = "UTC";

configure({ testIdAttribute: "data-test-id" });

// TextEncoder/TextDecoder are natively available in Node 22+ / jsdom 25+

global.CSS = {
  supports: () => false,
} as any;

// crypto is natively available in jsdom 25+ / Vitest's jsdom environment
