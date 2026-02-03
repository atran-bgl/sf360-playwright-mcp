// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  expect: {
    timeout: 10000, // default timeout for all expect() calls
  },
  timeout: 300000, // Applies to each test and each hook (e.g., beforeAll)
  retries: 0,
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['junit', { outputFile: './logs/results.xml' }],],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    headless: false,
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure', // Take screenshot only when a test fails
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    // trace: 'on-first-retry',
    // channel: 'chrome', // optional: use full Chrome instead of bundled Chromium
    launchOptions: {
      slowMo: 500,                 // slow down by 50ms for easier debugging
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'superstream',
      testDir: './tests/specs/connect',
      use: { browserName: 'chromium' }
    },
    {
      name: 'member',
      testDir: './tests/specs/member',
      use: { browserName: 'chromium' }
    },
    {
      name: 'investments',
      testDir: './tests/specs/investments',
      use: { browserName: 'chromium' }
    },
    {
      name: 'agent',
      testDir: './tests/specs/agent',
      use: { browserName: 'chromium' }
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

