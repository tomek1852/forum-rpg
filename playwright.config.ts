import { defineConfig, devices } from "@playwright/test";

const webServerCommand =
  process.platform === "win32" ? "npm.cmd run dev:web" : "npm run dev:web";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: webServerCommand,
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
});
