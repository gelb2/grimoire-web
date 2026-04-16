import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3002",
    headless: true,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  webServer: {
    command: "npm run dev -- -p 3002",
    port: 3002,
    reuseExistingServer: true,
    timeout: 60000,
    env: {
      API_URL: "http://localhost:3000/api",
    },
  },
})
