import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.ts"],
    environmentMatchGlobs: [
      ["src/**/*.test.tsx", "jsdom"],
      ["src/**/*.test.ts", "node"],
      ["scripts/**/*.test.ts", "node"],
    ],
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/features/**", "src/shared/**", "scripts/**"],
      exclude: ["**/index.ts"],
    },
  },
  resolve: {
    alias: {
      "@/": path.resolve(__dirname, "./src") + "/",
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
