import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { SupportToolPage } from '../../pages/SupportToolPage.js';
import { context } from '../../data/context.js';
import testUtil from '../../lib/test-util.js';
import * as firmUtil from '../../lib/firm-util.js';
import complianceUtil from '../../lib/compliance-util.js';
import transUtil from '../../lib/transaction-util.js';
import chartUtil from '../../lib/chart-util.js';
import securityUtil from '../../lib/security-util.js';
import invTransUtil from '../../lib/investment-transaction-util.js';
import corpActionUtil from '../../lib/corp-action-util.js';
import { axios, assert } from '../../lib/util.js';

import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { waitTime } = context.TestSettings;

test.describe('check and add missing delisted data: ', () => {
  let testFirm;
  let page;
  let supportToolPage;
  let notExistingCode = [];

  const entity = {
    entityCode: 'check-delisted-data',
    entityName: 'check and add missing delisted data',
    entityType: "SMSF",
    financialYearToStart: 2025,
    bankBalanceToStart: 50000
  };

  test.beforeAll(async ({ browser }, testInfo) => {
    console.log('initTest...');
    await testUtil.initTest();

    console.log('generateIdToken...');
    await testUtil.generateIdToken();

    console.log('readTestConfig...');
    await testUtil.readTestConfig();

    testFirm = context.TestFirmFundNames.firms.firm2;
    context.TestConfig.firm = testFirm.shortFirmName;

    const pageContext = await browser.newContext();
    page = await pageContext.newPage();

    const loginPage = new LoginPage(page);
    await loginPage.login_api(testFirm.shortFirmName);

    supportToolPage = new SupportToolPage(page);

    console.log('Delete existing entity created in last test');
    await firmUtil.deleteEntities(entity.entityCode);

    console.log('Adding new entity for this test');
    await firmUtil.addEntity(entity);

    console.log('Adding bank account for the test entity');
    const bankData = await chartUtil.addBankAccount();
    context.ShareData.bank = { pcode: bankData.pcode, id: bankData.id };

    if (entity.bankBalanceToStart) {
      console.log('Adding balance to bank account for member data clearing');
      await transUtil.addBankTransactionWithGeneralEntry(
        `${parseInt(entity.financialYearToStart) - 1}-07-01`,
        'Default bank balance to start test',
        entity.bankBalanceToStart);
    }
  });

  test('Get All Delisted Data From "delisted.com.au"', async () => {
    await securityUtil.getCorpActionData("Delisted");
  });

  test('Add Purchase For All Delisted Securities Before They Are Delisted', async () => {
    await invTransUtil.addMultipleInvestmentPurchase();
  });

  test('Verify Delisted Corp Action For All Delisted Securities', async () => {
    notExistingCode = await corpActionUtil.verifyMultipleCorpAction();
    console.log('Not Existing Codes ---> ', notExistingCode);
  });

  test('Import Missing Delisted Corp Actions From Support Tool', async () => {
    supportToolPage = new SupportToolPage(page);
    const notExistingCodeWithoutDotASX = notExistingCode.map(item => item.split(".")[0]);

    const url = "https://www.asx.com.au/asx/1/delisted-companies?callback=processDelistedCompanies";
    const raw = (await axios.get(url)).data;

    /* Parse JSONP */
    const callbackName = raw.substring(0, raw.indexOf("("));
    const jsonString = raw.substring(raw.indexOf("(") + 1, raw.lastIndexOf(")"));
    const delistedCompaniesArray = JSON.parse(jsonString);

    /* Print missing codes FIRST */
    const allCodeSet = new Set(delistedCompaniesArray.map(i => i.code.toUpperCase()));
    const inputCodeSet = new Set(notExistingCodeWithoutDotASX.map(c => c.toUpperCase()));

    const missingCodes = [...inputCodeSet].filter(code => !allCodeSet.has(code));

    if (missingCodes.length > 0) {
      console.warn("The following codes are not in the asx delisted companies list:");
      missingCodes.forEach(code => console.warn(`- ${code}`));
    }

    /* Filter existing codes */
    const filteredData = delistedCompaniesArray.filter(item => inputCodeSet.has(item.code.toUpperCase()));

    /* Rebuild JSONP string (array version) */
    const filteredJsonpString =
      `${callbackName}(${JSON.stringify(filteredData)});`;

    console.log('Import Data -----> ',filteredJsonpString, '<-----');

    // Navigate to Support Tool Page
    // await supportToolPage.page.goto(`https://${context.TestConfig.supportToolURL}`);
    // await expect(supportToolPage.button_Menu_SupportTools).toBeEnabled();
    // await supportToolPage.button_Menu_SupportTools.click();

    // await expect(supportToolPage.button_DelistedDataImport).toBeVisible();
    // await supportToolPage.button_DelistedDataImport.click();

    // await expect(supportToolPage.input_PasteDataArea).toBeEnabled();
    // await supportToolPage.input_PasteDataArea.fill(filteredJsonpString);

    // await expect(supportToolPage.button_Submit).toBeEnabled();
    // await supportToolPage.button_Submit.click();

    // await expect(supportToolPage.text_XXXImported).toBeVisible();
    // await expect(supportToolPage.text_XXXImported).toContainText('Imported');

    // await page.pause();
  });

  test('Verify Delisted Corp Action For All Delisted Securities After Import', async () => {
    notExistingCode = await corpActionUtil.verifyMultipleCorpAction();
    console.log('Not Existing Codes ---> ', notExistingCode);
    if (notExistingCode.length > 0) {
      assert.fail(`Some delisted corp action data are still missing for codes: ${notExistingCode} !!!`);
    }
  });
});