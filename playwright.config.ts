import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: [["list"], ["json", { outputFile: "artifacts/e2e-results.json" }]],
  use: {
    baseURL: "http://127.0.0.1:4185",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath:
        process.env.CHROME_PATH ||
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4185/api/news",
    timeout: 60000,
    reuseExistingServer: false,
    env: {
      PORT: "4185",
      APP_ORIGIN: "http://127.0.0.1:4185",
      E2E_TEST: "1",
      LOCAL_DATA_FILE: ".data/e2e.json",
      // Explicit empty values keep .env credentials out of the test server.
      SUPABASE_URL: "",
      SUPABASE_SECRET_KEY: "",
    },
  },
});
