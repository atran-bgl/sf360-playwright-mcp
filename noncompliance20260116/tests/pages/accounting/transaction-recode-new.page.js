import Page from '../page.js';
import { context } from '../../data/context.js';

const { waitTime } = context.TestSettings;

class TransactionRecodeNewPage extends Page {
  get button_StartNewTransactionRecode() { return $('button=Start New Transaction Recode'); }
  get item_AccountType_Investment() { return $('li=Investment'); }
  get dropDownButton_From() { return $('.AddTransRecode>div>div>div:nth-child(2) button'); }
  get dropDownButton_To() { return $('.AddTransRecode>div>div>div:nth-child(3) button'); }
  get input_SearchAccounts() { return $('.menu_item input'); }
  get firstSearchResult_SearchAccounts() { return $('.menu_item .SelectSearchOptionGroup>span:nth-child(2)'); }
  get button_Next() { return $('button=Next'); }
  get button_Confirm() { return $('button=Confirm'); }
  get text_TransactionsHaveBeenUpdated() { return $('h2=Transactions have been updated'); }

  async recode(from, to) {
    await browser.url(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Accounting_Transaction_recode_new}?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);
    await browser.pause(waitTime.medium);

    await this.button_StartNewTransactionRecode.waitForEnabled();
    await await browser.pause(waitTime.medium);
    await this.button_StartNewTransactionRecode.click();
    await browser.pause(waitTime.medium);

    await this.item_AccountType_Investment.waitForDisplayed();
    await this.item_AccountType_Investment.click();

    await this.dropDownButton_From.waitForEnabled();
    await this.dropDownButton_From.click();
    await browser.pause(waitTime.medium);
    await this.input_SearchAccounts.waitForEnabled();
    await this.input_SearchAccounts.setValue(from);
    await browser.pause(waitTime.long);
    await this.firstSearchResult_SearchAccounts.waitForDisplayed();
    await this.firstSearchResult_SearchAccounts.click();
    await browser.pause(waitTime.long);

    await this.dropDownButton_To.waitForEnabled();
    await this.dropDownButton_To.click();
    await browser.pause(waitTime.medium);
    await this.input_SearchAccounts.waitForEnabled();
    await this.input_SearchAccounts.setValue(to);
    await browser.pause(waitTime.long);
    await this.firstSearchResult_SearchAccounts.waitForDisplayed();
    await this.firstSearchResult_SearchAccounts.click();
    await browser.pause(waitTime.long);

    await this.button_Next.waitForEnabled();
    await this.button_Next.click();
    await browser.pause(waitTime.long);

    await browser.saveScreenshot('./logs/0.png');
    await browser.pause(waitTime.medium);
    await this.button_Confirm.waitForEnabled();
    // await this.button_Confirm.click();
    await browser.execute(async (ele) => { await ele.click(); }, await this.button_Confirm);
    await browser.pause(waitTime.long);

    await this.text_TransactionsHaveBeenUpdated.waitForDisplayed({ timeout: waitTime.loadMedium });
    await browser.pause(waitTime.long);
  }
}

export const transactionRecodeNewPage = new TransactionRecodeNewPage();