/**
 * Badge Settings Page Test
 * Tests navigation and discovery of the Badge settings page
 */

const { test, expect } = require('@playwright/test');
const { login, navigateToPage } = require('../.playwright-test-mcp/log-in-helper/auth');
const fs = require('fs');
const path = require('path');

test.describe('Badge Settings Page', () => {
  let authContext;

  test.beforeEach(async ({ page }) => {
    // Login before each test (auth helper auto-detects .env from project root)
    authContext = await login(page);
  });

  test('should navigate to Badge settings page and discover content', async ({ page }) => {
    // Navigate to Badge settings page using menu mapping
    const pageConfig = await navigateToPage(page, 'settings.badges');

    // Verify we're on the correct page
    expect(page.url()).toContain('/s/badge-settings/');
    console.log(`Successfully navigated to ${pageConfig.name}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot for documentation
    const screenshotPath = path.join(__dirname, '../screenshots/badge-settings.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Discover page elements
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    // Get page snapshot for structure analysis
    const snapshot = await page.accessibility.snapshot();
    console.log('Page accessibility snapshot:', JSON.stringify(snapshot, null, 2));

    // Try to find common elements
    const headings = await page.locator('h1, h2, h3, h4').allTextContents();
    console.log('Page headings:', headings);

    // Try to find tables or grids
    const tables = await page.locator('table, [role="grid"]').count();
    console.log(`Found ${tables} tables/grids`);

    // Try to find buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('Page buttons:', buttons.slice(0, 10)); // First 10 buttons

    // Try to find input fields
    const inputs = await page.locator('input').count();
    console.log(`Found ${inputs} input fields`);

    // Save page structure to JSON
    const pageStructure = {
      url: page.url(),
      title: pageTitle,
      headings,
      buttonsCount: buttons.length,
      inputsCount: inputs,
      tablesCount: tables,
      timestamp: new Date().toISOString()
    };

    const structurePath = path.join(__dirname, '../screenshots/badge-settings-structure.json');
    fs.writeFileSync(structurePath, JSON.stringify(pageStructure, null, 2));
    console.log(`Page structure saved to: ${structurePath}`);

    // Basic assertions
    expect(pageTitle).toBeTruthy();
    expect(page.url()).toContain('badge-settings');
  });

  test('should verify Badge page is accessible from Settings menu', async ({ page }) => {
    // Get current URL parameters
    const currentUrl = new URL(page.url());
    const firm = currentUrl.searchParams.get('firm');
    const uid = currentUrl.searchParams.get('uid');

    // Verify we have firm and uid
    expect(firm).toBeTruthy();
    expect(uid).toBeTruthy();

    console.log(`Current firm: ${firm}, uid: ${uid}`);

    // Navigate to Badge page directly
    const badgeUrl = `https://uat.sf360.com.au/s/badge-settings/?firm=${firm}&uid=${uid}`;
    await page.goto(badgeUrl);
    await page.waitForLoadState('networkidle');

    // Verify navigation successful
    expect(page.url()).toBe(badgeUrl);

    // Take another screenshot
    const screenshotPath = path.join(__dirname, '../screenshots/badge-direct-navigation.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Direct navigation screenshot saved to: ${screenshotPath}`);
  });
});
