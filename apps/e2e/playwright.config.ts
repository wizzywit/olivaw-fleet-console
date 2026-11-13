import { defineConfig, devices } from '@playwright/test';

const isCi = process.env.CI !== undefined;

// Runs against the real system: ingest, a 300-robot simulator and a production build of the console.
export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    // Locally the installed Chrome avoids downloading a browser; CI installs Playwright's Chromium.
    ...(isCi ? {} : { channel: 'chrome' }),
  },
  webServer: {
    command: 'pnpm --dir ../.. e2e:serve',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCi,
    timeout: 240_000,
  },
});
