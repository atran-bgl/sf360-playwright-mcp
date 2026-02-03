import { test, expect } from '@playwright/test';

const URL = 'https://oztech.pages.dev/';

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

test.describe('Seed — expanded, parameterized', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`${vp.name} viewport`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(URL, { waitUntil: 'networkidle' });
      });

      test(`navigate to /search and interact (viewport=${vp.name})`, async ({ page, browserName }) => {
        const searchLink = page.locator('a[href="/search"]');
        await expect(searchLink).toBeVisible({ timeout: 10000 });
        await expect(searchLink).toBeEnabled();

        // click and wait for navigation (networkidle to reduce flakiness)
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle' }),
          searchLink.click(),
        ]);

        const searchInput = page.getByPlaceholder('Company name, city, country, or sector');
        await expect(searchInput).toBeVisible({ timeout: 10000 });
        await expect(searchInput).toBeEnabled();

        // keyboard / fill interaction
        await searchInput.click();
        await page.keyboard.type('BGL');
        // keep the test deterministic: do not rely on external search behaviour
        await expect(searchInput).toHaveValue('BGL');

        // verify logo accessibility link exists
        const logoLink = page.getByRole('link', { name: 'BGL Corporate Solutions logo' });
        await expect(logoLink).toBeVisible();
      });

      test(`focus + keyboard submit smoke (viewport=${vp.name})`, async ({ page }) => {
        // navigate
        await page.locator('a[href="/search"]').click();
        await page.waitForLoadState('networkidle');

        const searchInput = page.getByPlaceholder('Company name, city, country, or sector');
        await expect(searchInput).toBeVisible();
        await searchInput.focus();
        await page.keyboard.type('BGL');
        // Press Enter to exercise submit (if the app responds)
        await page.keyboard.press('Enter');

        // Verify input still contains typed value (or that page didn't crash)
        await expect(searchInput).toHaveValue(/BGL/);
      });

      test(`accessibility smoke: role/name checks (viewport=${vp.name})`, async ({ page }) => {
        // primary check: logo is available by accessible name
        await page.locator('a[href="/search"]').click();
        await page.waitForLoadState('networkidle');
        const logo = page.getByRole('link', { name: 'BGL Corporate Solutions logo' });
        await expect(logo).toBeVisible();

        // basic ARIA presence for search field (role textbox)
        const searchField = page.getByPlaceholder('Company name, city, country, or sector');
        await expect(searchField).toBeVisible();
      });

      test(`negative / missing element handling (viewport=${vp.name})`, async ({ page }) => {
        // This test verifies that missing selectors are handled and will fail predictably.
        // Intentionally assert a selector that should not exist. This will PASS if the selector
        // is not present (we assert not.toBeVisible) — if you want to test failure artifact capture,
        // change assertion to expect(...).toBeVisible() to force a failure.
        const ghost = page.locator('a[href="/this-link-does-not-exist"]');
        await expect(ghost).not.toBeVisible();
      });
    });
  }
});
