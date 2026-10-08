import { defineConfig, devices } from "@playwright/test";

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? "http://127.0.0.1:3101";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: externalBaseURL
    ? undefined
    : {
        // Marked development fixture server; never override a production clock.
        command: "npm run dev -- --hostname 127.0.0.1 --port 3101",
        env: {CINEMATIC_E2E:"1",CINEMATIC_TEST_NOW:"2026-07-14T12:00:00.000Z"},
        reuseExistingServer: false,
        url: baseURL,
      },
});
