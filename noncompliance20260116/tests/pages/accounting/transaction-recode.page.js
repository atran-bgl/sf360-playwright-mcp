import Page from '../page.js';
import { context } from '../../data/context.js';

import * as firmUtil from '../../lib/firm-util.js';
import * as chartUtil from '../../lib/chart-util.js';
import * as transUtil from '../../lib/transaction-util.js';
import * as invTransUtil from '../../lib/investment-transaction-util.js';
import { assert, axios } from '../../lib/util.js';

const { waitTime } = context.TestSettings;

class TransactionRecodePage extends Page {
  get button_NewTransactionRecode() { return $('button=New Transaction Recode'); }
  get selectButton_AccountFrom() { return $('#select2-ts1-container'); }
  get input_AccountFrom() { return $('input.select2-search__field'); }
  get loadingText_AccountFrom() { return $('li.select2-results__option.loading-results'); }
  get item1_AccountFrom() { return $('#select2-ts1-results ul>li:nth-child(1)'); }

  get selectButton_AccountTo() { return $('#select2-ts2-container'); }
  get input_AccountTo() { return $('input.select2-search__field'); }
  get loadingText_AccountTo() { return $('li.select2-results__option.loading-results'); }
  get item1_AccountTo() { return $('#select2-ts2-results ul>li:nth-child(1)'); }
  get button_Next() { return $('button=Next'); }
  get button_Confirm() { return $('button=Confirm'); }


  async prepareTestDataForTransactionRecode(entityData, investmentTestData) {
    const transactionIdArray = [];

    console.log(`Logging in to firm ${context.TestConfig.firm}`);
    await browser.call(() => firmUtil.login(context.TestConfig.firm));

    console.log('Deleting existing entity for this test');
    await browser.call(() => firmUtil.deleteEntities(entityData.entityCode));

    console.log('Adding new entity for this test');
    await browser.call(() => firmUtil.addEntity(entityData));

    console.log('Adding bank account for the test entity');
    const bankData = await browser.call(() => chartUtil.addBankAccount());
    context.ShareData.bank = { pcode: bankData.pcode, id: bankData.id };

    for (const investment in investmentTestData) {
      console.log(`Adding ${investmentTestData[investment].chartAccount} for the test entity`);
      let investData = await browser.call(() => chartUtil.addInvestmentSubAccount(investmentTestData[investment].chartAccount));
      context.ShareData[investment] = { pcode: investData.pcode, id: investData.id };
    }

    if (entityData.bankBalanceToStart) {
      console.log('Adding balance to default bank');
      await browser.call(() => transUtil.addBankTransactionWithGeneralEntry(
        `${parseInt(entityData.financialYearToStart) - 1}-07-01`,
        'Default bank balance to start test',
        entityData.bankBalanceToStart));
    }

    console.log(`Adding purchase of ${context.ShareData.invest1.pcode}`);
    let transactionId = await browser.call(() => invTransUtil.addInvestmentPurchase(investmentTestData.invest1.purchase.date, `Adding purchase of ${context.ShareData.invest1.pcode}`,
      context.ShareData.invest1.pcode, investmentTestData.invest1.purchase.unit, investmentTestData.invest1.purchase.amount));
    transactionIdArray.push(transactionId);

    console.log(`Adding purchase of ${context.ShareData.invest2.pcode}`);
    transactionId = await browser.call(() => invTransUtil.addInvestmentPurchase(investmentTestData.invest2.purchase.date, `Adding purchase of ${context.ShareData.invest2.pcode}`,
      context.ShareData.invest2.pcode, investmentTestData.invest2.purchase.unit, investmentTestData.invest2.purchase.amount));
    transactionIdArray.push(transactionId);

    return transactionIdArray;
  }

  async recode(from, to) {
    await browser.url(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Accounting_Transaction_recode}?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);
    await this.button_NewTransactionRecode.waitForEnabled();
    await this.button_NewTransactionRecode.click();

    await this.selectButton_AccountFrom.waitForEnabled();
    await this.selectButton_AccountFrom.click();
    await browser.pause(waitTime.long);
    await this.input_AccountFrom.waitForEnabled();
    await this.input_AccountFrom.setValue(from);
    await browser.pause(waitTime.medium);
    await browser.waitUntil(async () => !(await this.loadingText_AccountFrom.isDisplayed()), waitTime.loadSmall, `can not find ${from} in 10 seconds`, 10);
    await browser.pause(waitTime.medium);
    await this.item1_AccountFrom.waitForDisplayed();
    await this.item1_AccountFrom.click();

    await this.selectButton_AccountTo.waitForEnabled();
    await this.selectButton_AccountTo.click();
    await browser.pause(waitTime.long);
    await this.input_AccountTo.waitForEnabled();
    await this.input_AccountTo.setValue(to);
    await browser.pause(waitTime.medium);
    await browser.waitUntil(async () => !(await this.loadingText_AccountTo.isDisplayed()), waitTime.loadSmall, `can not find ${to} in 10 seconds`, 10);
    await browser.pause(waitTime.medium);
    await this.item1_AccountTo.waitForDisplayed();
    await this.item1_AccountTo.click();
    await browser.pause(waitTime.short);

    await this.button_Next.waitForEnabled();
    await this.button_Next.click();
    await this.button_Confirm.waitForEnabled();
    await browser.execute(async (ele) => { await ele.click(); }, await this.button_Confirm);
    await browser.pause(waitTime.medium + waitTime.long);

    await browser.call(() => (axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/ChartController/chartdto/list?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`,
      { searchText: from, fundId: context.TestConfig.entityId })).then((res) => {
        assert.equal(res.data.records.length, 0, `Recode unsuccessfully, the "account from" - ${from} still exists!`);
      }));

    const accountTo = `${to}/${from.split('/')[1]}`
    await browser.call(() => (axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/ChartController/chartdto/list?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`,
      { searchText: accountTo, fundId: context.TestConfig.entityId })).then((res) => {
        assert.equal(res.data.records[0].code, accountTo, `Recode unsuccessfully, can not find the "account to" - ${accountTo}!`);
      }));
  }
}

export const transactionRecodePage = new TransactionRecodePage();