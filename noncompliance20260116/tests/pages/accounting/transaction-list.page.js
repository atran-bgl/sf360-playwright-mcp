import { assert } from '../../lib/util.js';
import Page from '../page.js';
import { context } from '../../data/context.js';
import { browser, $, $$ } from '@wdio/globals';

const { waitTime } = context.TestSettings;

class TransactionListPage extends Page {
  constructor() {
    super();
    this.selectButtons_SelectFilter = 'select.filterType';
    this.selectButtons_SelectConditon = 'select.field_transaction_match_otions_window';

    this.option_Equals = 'option[value="equals"]';
    this.option_Between = 'option[value="range"]';
    this.option_Contains = 'option[value="contains]';

    this.input_FilterValue = 'div.filter_value input';
    this.input_FilterRangeStart = 'div.filter_value .range_start_panel input';
    this.input_FilterRangeEnd = 'div.filter_value .range_end_panel input';
  }

  get title_TransactionList() { return $('.title_transactions_tb'); }
  get selectButton_NewTransaction() { return $('button=New Transaction'); }
  get button_NewBankStatement() { return $('a=Bank Statement'); }
  get button_NewJournal() { return $('a=Journal'); }
  get button_NewDepreciation() { return $('a=Depreciation'); }
  get button_NewCorporateAction() { return $('a=Corporate Action'); }

  get text_DialogTitle_SystemInformation() { return $('.dialog_white_upper_bar_title=System Information'); }

  get items_TransactionList() { return $$('.dataTable>.dataTableBody>tr'); }
  get firstItem_TransactionList() { return $('.dataTable>.dataTableBody>tr'); }
  get checkbox_FirstTransaction() { return $('.dataTable>.dataTableBody>tr .checkbox'); }
  get texts_TransactionDescription() { return $$('.dataTable>.dataTableBody>tr .description_column'); }
  get checkboxes_SelectTransaction() { return $$('.dataTable>.dataTableBody>tr .checkbox'); }
  get button_Delete() { return $('button=Delete'); }
  get button_ConfirmDelete() { return $('.dialog_button_area>div:nth-child(2)'); }

  get input_Search() { return $('input[placeholder="Search by account, description or amount"]'); }
  get button_Search() { return $('.btn.transactionSearchBtn'); }
  get icon_SearchWaitBar() { return $('div.trans_waitbox'); }
  get text_Total() { return $('div.list_total_title'); }

  get button_Filter() { return $('button[title="Additional Filters"]'); }
  get rows_ExistedFilters() { return $$('.fRow:not(.hide)'); }
  get firstRow_ExistedFilters() { return $('.fRow:not(.hide)'); }
  get selectButton_AccountVaule() { return $('div.filter_value .newAccountContainer'); }
  get input_AccountValue() { return $('.newAccountDropdown input'); }
  get firstItem_AccountSearchList() { return $('.newAccountDropdown>.select2-results>ul>li:nth-child(1)'); }
  get buttons_DeleteFilter() { return $$('.row:not(.hide) button.fDelete'); }
  get button_AddNewFilter() { return $('button=Add New Filter'); }
  get button_ApplyFilters() { return $('button=Apply'); }
  get Badge_filter() { return $('.filterBadge'); }
  get button_Reset() { return $('.resetBtn'); }

  get selectButton_FinancialYear() { return $('div.filterWrapper input.sixui_dropdown_nonedit'); }
  get option_PreviousFinancialYear() { return $('div=Previous Financial Year'); }
  get text_DateFrom() { return $('div.filterWrapper>div:nth-child(3) input'); }
  get text_DateTo() { return $('div.filterWrapper>div:nth-child(5) input'); }

  get checkbox_Journal() { return $('.pull-right>.transaction_category_filter_container:nth-child(1)>.checkbox-wrap>.checkbox'); }
  get checkbox_BankStatement() { return $('.pull-right>.transaction_category_filter_container:nth-child(2)>.checkbox-wrap>.checkbox'); }
  get checkbox_CorporateAction() { return $('.pull-right>.transaction_category_filter_container:nth-child(3)>.checkbox-wrap>.checkbox'); }
  get checkbox_SystemJournal() { return $('.pull-right>.transaction_category_filter_container:nth-child(4)>.checkbox-wrap>.checkbox'); }
  get checkbox_Depreciation() { return $('.pull-right>.transaction_category_filter_container:nth-child(5)>.checkbox-wrap>.checkbox'); }

  get button_Unmatched() { return $('.transaction_category*=Unmatched'); }
  get button_ManuallyMatched() { return $('.transaction_category*=Manually Matched'); }
  get button_AutoMatched() { return $('.transaction_category*=Auto Matched'); }

  get text_UnmatchedCount() { return $('.transaction_category*=Unmatched').$('.transaction_category_count'); }
  get text_ManuallyMatchedCount() { return $('.transaction_category*=Manually Matched').$('.transaction_category_count'); }
  get text_AutoMatchedCount() { return $('.transaction_category*=Auto Matched').$('.transaction_category_count'); }

  get selectButton_ResultsPerPage() { return $('.perPageArea select'); }
  get text_totalSearchResults() { return $('.list_page_tip_row'); }
  get buttons_pageNums() { return $$('table.trans-pagination div[class="pageNum"]') }

  get button_Help() { return $('a#gethelp'); }
  get input_SearchHelp() { return $('input#searchHelp'); }
  get text_Title_FirstSearchResult_Help() { return $('#main-content .search-results-list li.search-result-list-item:nth-child(1)>.search-result-title>a'); }

  async searchByFilters(fts) {
    await this.button_Filter.waitForEnabled();
    // await this.button_Filter.click();
    await browser.execute(async (ele) => { await ele.click(); }, await this.button_Filter);
    await browser.pause(waitTime.medium);
    await this.firstRow_ExistedFilters.waitForDisplayed();
    const existedFiltersNumber = await this.rows_ExistedFilters.length;
    let i = 0, j = 0;
    if (fts[0].field === 'Transaction Date') { i = 1, j = 1 };
    for (; i < existedFiltersNumber; i += 1) {
      await this.buttons_DeleteFilter[j].waitForEnabled();
      // await this.buttons_DeleteFilter[j].click();
      await browser.execute(async (ele) => { await ele.click(); }, await this.buttons_DeleteFilter[j]);
      await browser.pause(waitTime.medium);
    }
    if (fts[0].field === 'Transaction Date') {
      await (await this.rows_ExistedFilters[0].$(this.selectButtons_SelectConditon)).waitForEnabled();
      switch (fts[0].condition) {
        case 'Equals':
          await (await this.rows_ExistedFilters[0].$(this.selectButtons_SelectConditon)).selectByVisibleText('equals');
          break;
        case 'Contains':
          await (await this.rows_ExistedFilters[0].$(this.selectButtons_SelectConditon)).selectByVisibleText('contains');
          break;
        case 'Between':
          await (await this.rows_ExistedFilters[0].$(this.selectButtons_SelectConditon)).selectByVisibleText('Between');
          break;
      }
      await browser.pause(waitTime.short);
      if (fts[0].condition === 'Between') {
        await (await this.rows_ExistedFilters[0].$(this.input_FilterRangeStart)).waitForEnabled();
        await (await this.rows_ExistedFilters[0].$(this.input_FilterRangeStart)).setValue(`${fts[0].value[0]}`);
        await browser.pause(waitTime.short);
        await (await this.rows_ExistedFilters[0].$(this.input_FilterRangeEnd)).waitForEnabled();
        await (await this.rows_ExistedFilters[0].$(this.input_FilterRangeEnd)).setValue(`${fts[0].value[1]}`);
        await browser.pause(waitTime.short);
      } else {
        await (await this.rows_ExistedFilters[0].$(this.input_FilterValue)).waitForEnabled();
        await (await this.rows_ExistedFilters[0].$(this.input_FilterValue)).setValue(`${fts[0].value[0]}`);
        await browser.pause(waitTime.short);
      }
      i = 1;
    } else i = 0;

    for (; i < fts.length; i += 1) {
      await this.button_AddNewFilter.waitForEnabled();
      await this.button_AddNewFilter.click();
      await browser.pause(waitTime.short);
      await (await this.rows_ExistedFilters[i].$(this.selectButtons_SelectFilter)).waitForEnabled();
      await (await this.rows_ExistedFilters[i].$(this.selectButtons_SelectFilter)).selectByVisibleText(fts[i].field);
      await browser.pause(waitTime.long);
      if (!['Bank Account', 'Data Source'].includes(fts[i].field)) {
        await (await this.rows_ExistedFilters[i].$(this.selectButtons_SelectConditon)).waitForEnabled();
        switch (fts[i].condition) {
          case 'Equals':
            await (await this.rows_ExistedFilters[i].$(this.selectButtons_SelectConditon)).selectByVisibleText('equals');
            break;
          case 'Contains':
            await (await this.rows_ExistedFilters[i].$(this.selectButtons_SelectConditon)).selectByVisibleText('contains');
            break;
          case 'Between':
            await (await this.rows_ExistedFilters[i].$(this.selectButtons_SelectConditon)).selectByVisibleText('Between');
            break;
        }
      }
      await browser.pause(waitTime.medium);
      if (fts[i].condition === 'Between') {
        await (await this.rows_ExistedFilters[i].$(this.input_FilterRangeStart)).waitForEnabled();
        await (await this.rows_ExistedFilters[i].$(this.input_FilterRangeStart)).setValue(`${fts[i].value[0]}`);
        await browser.pause(waitTime.short);
        await (await this.rows_ExistedFilters[i].$(this.input_FilterRangeEnd)).waitForEnabled();
        await (await this.rows_ExistedFilters[i].$(this.input_FilterRangeEnd)).setValue(`${fts[i].value[1]}`);
        await browser.pause(waitTime.short);
      } else {
        if (fts[i].field === 'Account') {
          // await this.selectButton_AccountVaule.waitForEnabled();
          // await browser.pause(waitTime.medium);
          // await this.selectButton_AccountVaule.click();
          // await browser.execute(async (ele) => { await ele.click(); }, await this.selectButton_AccountVaule);
          await browser.keys('Tab');
          await browser.pause(waitTime.medium);
          await this.input_AccountValue.waitForEnabled();
          await this.input_AccountValue.setValue(fts[i].value[0]);
          await browser.waitUntil(async () => (await this.firstItem_AccountSearchList.getText()).includes(fts[i].value[0]), waitTime.superLong, `Can not find the specified Account in filters: ${fts[i].value[0]}`);
        } else {
          await (await this.rows_ExistedFilters[i].$(this.input_FilterValue)).waitForEnabled();
          await (await this.rows_ExistedFilters[i].$(this.input_FilterValue)).setValue(`${fts[i].value[0]}`);
          await browser.pause(waitTime.medium);
        }
        if (['Bank Account', 'Data Source', 'Account'].includes(fts[i].field)) {
          await browser.keys(['Enter']);
          await browser.pause(waitTime.short);
        }
      }
    }
    await this.button_ApplyFilters.waitForEnabled();
    // await this.button_ApplyFilters.click();
    await browser.execute(async (ele) => { await ele.click(); }, await this.button_ApplyFilters);

    await browser.pause(waitTime.long);
    await transactionListPage.text_Total.waitForExist();
    await browser.pause(waitTime.long);

    await this.text_totalSearchResults.waitForDisplayed();
    const textTotalSearchResults = (await this.text_totalSearchResults.getText()).split(' ');
    assert.equal(textTotalSearchResults[textTotalSearchResults.length - 1], fts[fts.length - 1].expectedItems);
    await browser.pause(waitTime.medium);
  }

  async getTransactionDataOneLine(index, withAccoutName = false) {
    const actualData = [];
    const ele = await this.items_TransactionList[index];
    const dateRefDes = {};
    dateRefDes.date = await (await ele.$('.date_column')).getText();
    dateRefDes.reference = await (await ele.$('.ref_column')).getText();
    dateRefDes.description = await (await ele.$('.description_column')).getText();
    actualData.push(dateRefDes);

    const accounts = await ele.$$('.account_column');
    const units = await ele.$$('.units_column');
    const debits = await ele.$$('td:not(.creditCol)>.drcr_column');
    const credits = await ele.$$('.creditCol>.drcr_column');

    const accountNumbers = accounts.length;
    for (let i = 0; i < accountNumbers; i += 1) {
      if (withAccoutName === false) actualData.push({
        account: await (await accounts[i].$('span:nth-child(1)')).getText(),
        units: await units[i].getText(),
        debit: await debits[i].getText(),
        credit: await credits[i].getText()
      });
      else actualData.push({
        accountCode: await (await accounts[i].$('span:nth-child(1)')).getText(),
        accountName: (await (await accounts[i].$('span:nth-child(2)')).getText()).slice(1, -1),
        units: await units[i].getText(),
        debit: await debits[i].getText(),
        credit: await credits[i].getText()
      });
    }
    return actualData;
  }

  /* eslint-disable no-param-reassign */
  // Verify one new added transaction
  async verifyTransaction(bankStatementFlag, actualData, expectedData) {
    if (bankStatementFlag === true) {
      let totalDebit = 0;
      let totalCredit = 0;
      for (let i = 2; i < expectedData.length; i += 1) {
        if (expectedData[i].debit !== '') totalDebit += expectedData[i].debit;
        if (expectedData[i].credit !== '') totalCredit += expectedData[i].credit;
      }
      if (totalDebit >= totalCredit) {
        expectedData[1].credit = totalDebit - totalCredit;
      } else {
        expectedData[1].debit = totalCredit - totalDebit;
      }
    }
    for (let i = 1; i < expectedData.length; i += 1) {
      const keys = Object.keys(expectedData[i]);
      for (const key of keys) {
        if (key === 'units') {
          if (expectedData[i][key] !== '') {
            expectedData[i][key] = Number(expectedData[i][key].toFixed(6)).toLocaleString();
            const dotIndex = expectedData[i][key].indexOf('.');
            if (dotIndex === -1) expectedData[i][key] = `${expectedData[i][key]}.000000`;
            else {
              const addZero = 6 - (expectedData[i][key].length - dotIndex - 1);
              for (let q = 0; q < addZero; q += 1) { expectedData[i][key] = `${expectedData[i][key]}0`; }
            }
          }
        } else if (key === 'debit' || key === 'credit') {
          if (expectedData[i][key] !== '') {
            expectedData[i][key] = Number(expectedData[i][key].toFixed(2)).toLocaleString();
            const dotIndex = expectedData[i][key].indexOf('.');
            if (dotIndex === -1) expectedData[i][key] = `${expectedData[i][key]}.00`;
            else {
              const addZero = 2 - (expectedData[i][key].length - dotIndex - 1);
              for (let q = 0; q < addZero; q += 1) { expectedData[i][key] = `${expectedData[i][key]}0`; }
            }
          }
        }
      };
    }
    for (let i = 0; i < expectedData.length; i += 1) {
      assert.deepEqual(actualData[i], expectedData[i], `The ${i} account is not correct!`);
    }
  }
  /* eslint-enable no-param-reassign */

  async verifyOneSearchResultByKeyword(oneResult, keyword) {
    for (const res of oneResult) {
      for (const name in res) {
        if (name === 'reference' || name === 'description' || name === 'accountCode' || name === 'accountName') {
          if (res[name].includes(keyword)) return true;
        }
        if (name === 'units' || name === 'debit' || name === 'credit') {
          if (Number(res[name].replace(',', '')) === Number(keyword)) return true;
        }
      }
    }
    return false;
  }

  // UI - search transaction by description
  async searchDescription(description) {
    const eles = await this.texts_TransactionDescription;
    let index;
    for (let i = 0; i < eles.length; i += 1) {
      if ((await eles[i].getText()) === description) {
        index = i;
        break;
      }
    }
    return index;
  }

  // UI - delete transaction by index
  async deleteTransaction(index) {
    const ele = this.items_TransactionList[index];
    await (await ele.$('.checkbox')).click();
    await this.button_Delete.waitForDisplayed();
    await this.button_Delete.click();
    await this.button_ConfirmDelete.waitForDisplayed();
    await this.button_ConfirmDelete.click();
    await browser.pause(waitTime.medium);
  }
}

export const transactionListPage = new TransactionListPage();


