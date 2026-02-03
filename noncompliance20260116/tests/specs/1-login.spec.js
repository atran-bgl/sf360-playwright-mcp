import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { context } from '../data/context.js';
import testUtil from '../lib/test-util.js';

test.beforeAll('initiate test', async () => {
  console.log('initTest...');
  await testUtil.initTest();

  console.log('generateIdToken...');
  await testUtil.generateIdToken();

  console.log('readTestConfig...');
  await testUtil.readTestConfig();
});

test(`login`, async ({ page }) => {
  let testFirm = context.TestFirmFundNames.firms.firm5;
  const loginPage = new LoginPage(page);
  await loginPage.login_api(testFirm.shortFirmName);

  const pageName = 'SF360 - Insights Dashboard';
  expect(await loginPage.page.title()).toEqual(pageName, 'Login failed or the default page is not correct!');

  // click any button to check no 500 error
  await expect(loginPage.button_ENTITYSETUP).toBeEnabled();
  await loginPage.button_ENTITYSETUP.click();
  await expect(loginPage.heading_EntitySetup).toBeVisible();
});

