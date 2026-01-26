// Test setup file for Vitest
// Add any global test configuration here

// Mock next/router for tests
import { vi } from "vitest";

vi.mock("next/router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    query: {},
    pathname: "/",
    asPath: "/",
  }),
}));

// Mock AppBridge for tests
vi.mock("@saleor/app-sdk/app-bridge", () => ({
  useAppBridge: () => ({
    appBridgeState: {
      ready: true,
      token: "test-token",
      saleorApiUrl: "http://localhost:8000/graphql/",
    },
  }),
  AppBridge: vi.fn(),
  AppBridgeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
