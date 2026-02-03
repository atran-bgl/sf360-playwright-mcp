import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LoginPage } from '../../pages/LoginPage.js';
import { context } from '../../data/context.js';
import testUtil from '../../lib/test-util.js';
import { EntitySetupPage } from '../../pages/agent/EntitySetupPage.js';

test.describe('SF360 — create SMSF (skeleton)', () => {
  test('login and create SMSF skeleton', async ({ page }) => {
    // Mirror the suite's login flow used in other specs (see new-member-dashboard.spec.js lines ~564-584).
    // This initializes test config, generates id token, reads config and then uses backend SSO login
    // to inject cookies (LoginPage.login_api).
    await testUtil.initTest();
    await testUtil.generateIdToken();
    await testUtil.readTestConfig();

    // pick a firm based on environment (matches the pattern used in other specs)
    let testFirm;
    if (context.TestConfig.environment === 'uat') {
      testFirm = context.TestFirmFundNames.firms.firm4;
    } else if (context.TestConfig.environment === 'production') {
      testFirm = context.TestFirmFundNames.firms.firm7;
    } else {
      // fallback to the configured firm if provided
      const configPath = path.join(process.cwd(), 'test-config-local.json');
      let localConfig;
      try {
        if (fs.existsSync(configPath)) {
          localConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
      } catch (err) {
        console.warn('Could not read test-config-local.json:', err.message);
      }
      const firmName = process.env.SF360_FIRM || localConfig?.uat?.firmShortName;
      testFirm = { shortFirmName: firmName };
    }
    // ensure the TestConfig has the firm set (some utilities rely on it)
    context.TestConfig.firm = testFirm.shortFirmName;

    const loginPage = new LoginPage(page);
    await loginPage.login_api(testFirm.shortFirmName);

    // Click ENTITY SETUP in top menu (using LoginPage's button definition)
    await expect(loginPage.button_ENTITYSETUP).toBeEnabled();
    await loginPage.button_ENTITYSETUP.click();
    
    // Use the EntitySetupPage POM to create the SMSF
    const entityName = `AutoTest SMSF ${Date.now()}`;
    const entitySetupPage = new EntitySetupPage(page);
    await entitySetupPage.createSMSF(entityName);

    // Final: take a screenshot for verification (will be saved to Playwright's artifacts)
    await page.screenshot({ path: `playwright-artifacts/sf360-create-smsf-${Date.now()}.png`, fullPage: false });
  });
});
