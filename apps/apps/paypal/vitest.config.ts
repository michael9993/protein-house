import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/generated": path.resolve(__dirname, "generated"),
    },
  },
  test: {
    css: false,
    mockReset: true,
    restoreMocks: true,
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
