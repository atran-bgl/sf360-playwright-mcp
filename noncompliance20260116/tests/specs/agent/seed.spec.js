import { test, expect } from '@playwright/test';

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    // generate code here.
    await page.goto('https://oztech.pages.dev/');
    await expect(page.locator('a[href="/search"]')).toBeEnabled();
    await page.locator('a[href="/search"]').click();
    await expect(page.locator('input[placeholder="Company name, city, country, or sector"]')).toBeEnabled();
    await page.locator('input[placeholder="Company name, city, country, or sector"]').fill('BGL');
    await expect(page.getByRole('link', { name: 'BGL Corporate Solutions logo' })).toBeVisible();
  });
});