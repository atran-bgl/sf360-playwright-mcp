import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { SuperStreamDashboardPage } from '../../pages/connect/SuperStreamDashboardPage.js';
import { context } from '../../data/context.js';
import testUtil from '../../lib/test-util.js';
const { waitTime } = context.TestSettings;

test.describe('add update and delete firm level email', () => {
  const testFirm = context.TestFirmFundNames.firms.firm4;
  let page;
  let superStreamDashboardPage;

  const contact1 = {
    name: "AutoTest, FirmEmailTester1",
    email: "test001@autotest.com"
  };
  const contact2 = {
    name: "AutoTest, FirmEmailTester2",
    email: "test002@autotest.com"
  };
  const alertMessage = 'Emails added in this screen will receive rollover and release authority notification for all funds.';
  const confirmationMessageRemoveFirmEmail = 'Warning: This will remove firm level email notification. '
    + 'Any funds that do not have a fund level email notification set up will no longer receive email notifications for Rollovers / Release Authorities. '
    + 'Do you wish to continue?'

  test.beforeAll(async ({ browser }) => {
    console.log('initTest...');
    await testUtil.initTest();

    console.log('generateIdToken...');
    await testUtil.generateIdToken();

    console.log('readTestConfig...');
    await testUtil.readTestConfig();

    const pageContext = await browser.newContext();
    page = await pageContext.newPage();

    const loginPage = new LoginPage(page);
    await loginPage.login_api(testFirm.shortFirmName);

    superStreamDashboardPage = new SuperStreamDashboardPage(page);
  });


  test('Add firm level email', async () => {
    await superStreamDashboardPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Connect_SuperStream_dashboard}?firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}`);
    
    await expect(superStreamDashboardPage.button_EmailNotification).toBeEnabled();
    await page.waitForTimeout(waitTime.medium);
    await superStreamDashboardPage.button_EmailNotification.click();

    await expect(superStreamDashboardPage.listItem_FirmNotification).toBeVisible();
    await superStreamDashboardPage.listItem_FirmNotification.click();

    await expect(superStreamDashboardPage.alertMessage).toBeVisible();
    await expect(superStreamDashboardPage.alertMessage).toHaveText(alertMessage);

    await expect(superStreamDashboardPage.input_SearchContact).toBeEnabled();
    await superStreamDashboardPage.input_SearchContact.fill(contact1.name);

    await expect(superStreamDashboardPage.listItem_FirstResult_Searchcontact).toBeVisible();
    await expect(superStreamDashboardPage.listItem_FirstResult_Searchcontact).toHaveText(contact1.name);
    await superStreamDashboardPage.listItem_FirstResult_Searchcontact.click();

    await expect(superStreamDashboardPage.input_email).toHaveValue(contact1.email);
    await expect(superStreamDashboardPage.button_Save).toBeEnabled();
    await superStreamDashboardPage.button_Save.click();

    await superStreamDashboardPage.systemInfo_SaveSucess.waitFor();
    await expect(superStreamDashboardPage.systemInfo_SaveSucess).toHaveText('Save Success');

    await expect(superStreamDashboardPage.button_OK_systemInfo).toBeEnabled();
    await superStreamDashboardPage.button_OK_systemInfo.click();
  });

  test('update firm level email', async () => {
  });

  test('delete firm level email', async () => {
    await superStreamDashboardPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Connect_SuperStream_dashboard}?firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}`);
    
    await expect(superStreamDashboardPage.button_EmailNotification).toBeEnabled();
    await page.waitForTimeout(waitTime.medium);
    await superStreamDashboardPage.button_EmailNotification.click();

    await expect(superStreamDashboardPage.listItem_FirmNotification).toBeVisible();
    await superStreamDashboardPage.listItem_FirmNotification.click();

    await expect(superStreamDashboardPage.name_FirmEmail).toBeVisible();
    await expect(superStreamDashboardPage.nameEmail_FirmEmail).toHaveText([`${contact1.name}`, `${contact1.email}`]);

    await expect(superStreamDashboardPage.button_EditRemove).toBeEnabled();
    await superStreamDashboardPage.button_EditRemove.click();

    await expect(superStreamDashboardPage.button_Remove).toBeVisible();
    await expect(superStreamDashboardPage.button_Remove).toBeEnabled();
    await superStreamDashboardPage.button_Remove.click();

    await expect(superStreamDashboardPage.nameEmail_FirmEmail).toHaveCount(0);
    await expect(superStreamDashboardPage.button_Save).toBeEnabled();
    await superStreamDashboardPage.button_Save.click();

    await superStreamDashboardPage.systemInfo_RemoveFirmEmail.waitFor();
    await expect(superStreamDashboardPage.systemInfo_RemoveFirmEmail).toHaveText(confirmationMessageRemoveFirmEmail);

    await expect(superStreamDashboardPage.button_Yes).toBeEnabled();
    await superStreamDashboardPage.button_Yes.click();

    await superStreamDashboardPage.systemInfo_SaveSucess.waitFor();
    await expect(superStreamDashboardPage.systemInfo_SaveSucess).toHaveText('Save Success');

    await expect(superStreamDashboardPage.button_OK_systemInfo).toBeEnabled();
    await superStreamDashboardPage.button_OK_systemInfo.click();
  });
});




