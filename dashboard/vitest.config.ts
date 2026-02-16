import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "./assets"),
      "@locale": path.resolve(__dirname, "./locale"),
      "@dashboard": path.resolve(__dirname, "./src"),
      "@test": path.resolve(__dirname, "./testUtils"),
      // Mock react-intl in tests (replaces Jest's moduleNameMapper)
      "react-intl": path.resolve(__dirname, "./__mocks__/react-intl.ts"),
      // Force resolution for hoisted packages
      "@material-ui/core": path.resolve(__dirname, "./node_modules/@material-ui/core"),
      "@material-ui/icons": path.resolve(__dirname, "./node_modules/@material-ui/icons"),
      "@material-ui/styles": path.resolve(__dirname, "./node_modules/@material-ui/styles"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    root: "./src",
    setupFiles: ["../testUtils/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    // Match Jest's resetMocks: false behavior
    mockReset: false,
    clearMocks: false,
    restoreMocks: false,
    // CSS imports handled as empty modules
    css: false,
    // Snapshot formatting
    snapshotFormat: {
      printBasicPrototype: false,
    },
    // Transform ESM packages that need it
    server: {
      deps: {
        inline: ["chroma-js", "zod", "popper.js"],
      },
    },
  },
  define: {
    FLAGS_SERVICE_ENABLED: false,
    FLAGS: JSON.stringify({}),
  },
});
