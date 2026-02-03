import Page from '../page.js';
import { context } from '../../data/context.js';
import { browser, $, $$ } from '@wdio/globals';

const { waitTime } = context.TestSettings;

class ChartOfAccountsPage extends Page {
  // Common
  get title_ChartOfAccounts() { return $('span=Chart of Accounts'); }
  get button_AddAccount() { return $('div=Add Account'); }
  get button_AddInvestment() { return $('div=Investment'); }
  get button_AddProperty() { return $('div=Property'); }
  get button_AddBankAccount() { return $('div=Bank'); }
  get button_AddOther() { return $('div=Other'); }
  get button_AddLiabilityLRBA() { return $('div.selBtnItem*=Liability'); }

  // Bank & LRBA
  get selectButton_BankType() { return $('.popupContent>.bankground>div>div>div:nth-child(3)>div>div:nth-child(2)>select'); }
  get option_TermDeposits() { return $('option=Term Deposits'); }
  get checkbox_MakeDefaultBankAcc_BankAcc() { return $('.defaultBankCheckbox>.checkbox'); }
  get text_MakeDefaultBankAcc_BankAcc() { return $('div=Make Default Bank Account'); }
  get input_BSB_BankAcc() { return $('.member_info_panel_contact_textbox'); }
  get text_ANZ_BankAcc() { return $('div=Australia & New Zealand Banking Group Limited'); }
  get text_CBA_BankAcc() { return $('div=Commonwealth Bank of Australia'); }
  get text_NAB_BankAcc() { return $('div=National Australia Bank Limited'); }
  get input_AccountNumber_BankAcc() { return $('.ym-clearfix.ym-gl.ym-grid>.ym-grid.ym-gl>.ym-grid:nth-child(7) .gwt-TextBox'); }
  get input_BankCode_BankAcc() { return $('.ym-clearfix.ym-gl.ym-grid>.ym-grid.ym-gl>.ym-grid:nth-child(12) .gwt-TextBox'); }
  get text_CodeIsAvailable_BankAcc() { return $('span=Code is available.'); }
  get input_Name_BankAcc() { return $('.ym-clearfix.ym-gl.ym-grid>.ym-grid.ym-gl>.ym-grid:nth-child(13) .gwt-TextBox'); }

  get input_AccountNumber_LRBA() { return $('.otheraccountbackground>div>div>div:nth-child(3)>div:nth-child(6)>div:nth-child(4) input[maxlength="20"]'); }
  get input_ControlAccCode_LRBA() { return $('.otheraccountbackground>div>div>div:nth-child(3)>div:nth-child(7) input[maxlength="5"]'); }
  get input_NewSubAccCode_LRBA() { return $('.otheraccountbackground>div>div>div:nth-child(3)>div:nth-child(7) input[maxlength="20"]'); }
  get input_NewSubAccName_LRBA() { return $('.otheraccountbackground>div>div>div:nth-child(3)>div:nth-child(9) input'); }
  get input_Code_LRBA() { return $('.otheraccountbackground>div>div>div:nth-child(3)>div:nth-child(8) input'); }
  get input_Name_LRBA() { return $('.otheraccountbackground>div>div>div:nth-child(3)>div:nth-child(9) input'); }

  get button_Save_EditControlAcc_LRBA() { return $('div=Save'); }

  // Investment
  get selectButton_SelectAccountClass_Investment() { return $('.account-class-listbox'); }
  get selectButton_SelectSecurities() { return $('div=Select Securities'); }
  get input_SecurityName() { return $('.select-button-popupPanel input.gwt-TextBox'); }
  get loadingBar_SecuritySearch() { return $('.select-button-popupPanel .GLSHQUMBOK img'); }
  get firstItem_SecuritySearchResult() { return $('.select-button-popupPanel tr.GLSHQUMBJE'); }
  get input_ControlAccountCode() { return $('.fm-item>input.code-textbox:nth-child(1)'); }
  get input_InvestmentCode() { return $('.inves-code-textbox'); }
  get input_NewControlAccCode_Investment() { return $('input.code-textbox:nth-child(2)'); }
  get input_NewControlAccName_Investment() { return $('label=Name:').$(function () { return this.nextElementSibling }); }
  get button_Save_EditControlAcc_Investment() { return $('button.save-button'); }

  // Other
  get input_ControlAccCode_Other() { return $('.popupContent div:nth-child(6) input[maxlength="5"]'); }
  get input_NewSubAccCode_Other() { return $('.popupContent div:nth-child(6) input[maxlength="20"]'); }
  get input_NewSubAccName_Other() { return $('.popupContent div:nth-child(8) input'); }
  get text_ControlAccName_Other() { return $('span.cbContainer'); }
  get text_ControlAccNotExistError() { return $('span.commonFieldError'); }
  get input_Code_Other() { return $('.otheraccountbackground>div>div>div:nth-child(3)>div:nth-child(7) input'); }
  get input_Name_Other() { return $('.otheraccountbackground>div>div>div:nth-child(3)>div:nth-child(8) input'); }
  get button_Save_EditControlAcc_Other() { return $('div=Save'); }

  // Common
  get selectButton_SelectAccountClass() { return $('div=Account Class:').$(function () { return this.nextElementSibling }); }
  get option_SubAccount() { return $('select>option[value="S"]'); }
  get option_Control() { return $('select>option[value="C"]'); }
  get option_Normal() { return $('select>option[value="N"]'); }

  get button_Save() { return $('button=Save'); }
  get button_Save_EditAcc() { return $('div=Save'); }
  get text_SaveSuccessfully() { return $('div.tipMsg*=has been saved successfully'); }
  get text_DeleteSuccessfully() { return $('div.tipMsg*=Account deleted'); }
  get button_MoreDetails() { return $('a*=More Details'); }

  get button_SwitchChartView() { return $('.switch_bg'); }
  get input_AccountSearchKeyword() { return $('.searchWrapper input'); }
  get button_AccountSearch() { return $('.transactionSearchBtn'); }
  get loadingBar_AccountSearch() { return $('.loading_td>img'); }
  get button_Delete() { return $('button=Delete'); }
  get button_ConfirmDelete() { return $('div=Yes'); }

  get firstItem_AccountList() { return $('.dataTable.stickyHeader>tbody>tr'); }
  get subItmes_FirstItem() { return $$('.dataTable.stickyHeader>tbody>tr:nth-child(1)>td'); }
  get firstItem_Checkbox_AccountList() { return $('.dataTable.stickyHeader>tbody>tr:nth-child(1) .checkb-box'); }
  get firstItem_Code_AccountList() { return $('.dataTable.stickyHeader>tbody>tr:nth-child(1)>.codeCol'); }
  get firstItem_Name_AccountList() { return $('.dataTable.stickyHeader>tbody>tr:nth-child(1)>.nameCol'); }
  get firstItem_Tag_AccountList() { return $('.dataTable.stickyHeader>tbody>tr:nth-child(1)>.tagCol'); }
  get firstItem_LinkedAcc_AccountList() { return $('.dataTable.stickyHeader>tbody>tr:nth-child(1)>.linkedCol'); }

  get items_AccountList() { return $$('.dataTable.stickyHeader>tbody>tr'); }
  get items_Code_AccountList() { return $$('.dataTable.stickyHeader>tbody>tr>.codeCol'); }
  get items_Name_AccountList() { return $$('.dataTable.stickyHeader>tbody>tr>.nameCol'); }
  get items_Tag_AccountList() { return $$('.dataTable.stickyHeader>tbody>tr>.tagCol'); }
  get items_LinkedAcc_AccountList() { return $$('.dataTable.stickyHeader>tbody>tr>.linkedCol'); }

  get text_ResultNumber() { return $('.list_page_tip_row>span:nth-child(2)'); }
  // get pageNumbers() { return $$('.pageNum'); } // include pagePrevious and pageNext
  get pageNumbers() { return $$('.trans-pagination>tbody>tr td[style="width:1%;"]'); } // include pagePrevious and pageNext
  get checkbox_AttachToAllEntities() { return $('.popupContent  .checkbox[tabindex="301"]'); }
  get button_SelectEntities() { return $('button.btn-MultiEntitySelector'); }
  get input_SearchEntity_MultiEntitySelector() { return $('.MultiEntitySelector input.sf360-searchbar'); }
  get firstItem_EntityList_MultiEntitySelector() { return $('.entityList>div>div>div:first-child'); }
  get button_SaveChanges_MultiEntitySelector() { return $('button=Save Changes'); }

  async getAllResults(expectedResultFlag) {
    const allResults = [];
    if (expectedResultFlag === 0) {
      const resultCount = await this.items_AccountList.length;
      if (resultCount === 1) {
        const info = await this.firstItem_AccountList.getText();
        allResults.push({ resultCount, info });
      } else {
        allResults.push({ resultCount, info: 'Get unexpected result! The expected result is "No result."' });
      }
    } else {
      if (await this.subItmes_FirstItem.length > 1) {
        const pages = await this.pageNumbers.length - 3;
        console.log("pages---->", pages);
        for (let i = 1; i <= pages; i += 1) {
          for (let j = 0; j < await this.items_AccountList.length; j += 1) {
            allResults.push({
              code: await this.items_Code_AccountList[j].getText(),
              name: await this.items_Name_AccountList[j].getText(),
              tag: await this.items_Tag_AccountList[j].getText(),
              linkedAcc: await this.items_LinkedAcc_AccountList[j].getText(),
            });
          }
          if (i + 1 <= pages) {
            await this.pageNumbers[i + 2].click();
            await this.firstItem_Code_AccountList.waitForDisplayed();
          }
        }
      } else {
        allResults.push({ code: '', name: '', tag: '', linkedAcc: '' });
      }
    }
    return allResults;
  }
}

export const chartOfAccountsPage = new ChartOfAccountsPage();
