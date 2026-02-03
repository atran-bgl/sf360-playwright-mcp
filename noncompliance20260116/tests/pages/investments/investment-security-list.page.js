import Page from '../page.js';
import compareAsc from 'date-fns/compareAsc';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import { subDays } from 'date-fns';
import { assert } from '../../lib/util.js';


import Holidays from 'date-holidays';
const hd_US_NY = new Holidays('US', 'NY');
const hd_GB_ENG = new Holidays('GB', 'ENG');
const hd_HK = new Holidays('HK');
const hd_SG = new Holidays('SG');
// const hd_NZ_AUK = new Holidays('NZ', 'AUK');
const hd_AU_ACT = new Holidays('AU', 'ACT');

const marketMapping = {
  "NYSE": hd_US_NY,
  "NYSE_ARCX": hd_US_NY,
  "NASDAQ": hd_US_NY,
  "LSE": hd_GB_ENG,
  "HKEX": hd_HK,
  "SGX": hd_SG,
  "ASX": hd_AU_ACT,
  "Cryptocurrency": hd_US_NY,
  "UUT": hd_AU_ACT,
};

class InvestmentSecurityListPage extends Page {
  get firstLine_InvestmentSecurityList() { return $('#security-list table>tbody>tr:nth-child(1)'); }
  get firstSecurityCode_InvestmentSecurityList() { return $('#security-list table>tbody>tr:nth-child(1)>td:nth-child(2)>button'); }
  get allLines_InvestmentSecurityList() { return $$('#security-list table>tbody>tr'); }
  get tab_SecurityPrices() { return $('#securityDetailsModal>.MuiBox-root').$('button=Security Prices'); }
  get tab_Income() { return $('#securityDetailsModal>.MuiBox-root').$('button=Income'); }
  get tab_AssetAllocation() { return $('#securityDetailsModal>.MuiBox-root').$('button=Asset Allocation'); }
  get button_AddNew_SecurityPricesTab() { return $('#securityDetailsModal>.MuiBox-root').$('button=Add New'); }
  get button_AddNew_IncomeTab() { return $('#securityDetailsModal>.MuiBox-root').$('button=Add New'); }
  get button_AddNew_AssetAllocationTab() { return $('#securityDetailsModal>.MuiBox-root').$('button=Add New'); }

  get checkbox_FundLevelCustomPrice() { return $('#update-modal .modal-body .MuiSwitch-root input'); }
  get input_PriceDate() { return $('#update-modal .modal-body input#updateDate'); }
  get input_Price() { return $('#update-modal .modal-body input#value'); }
  get input_ExitPrice() { return $('#update-modal .modal-body input#exitPrice'); }
  get input_ExDistributionPrice() { return $('#update-modal .modal-body input#exDistributionPrice'); }
  get input_NetAssetValue() { return $('#update-modal .modal-body input#netAssetValue'); }
  get button_SaveChanges() { return $('#update-modal .modal-footer').$('button=Save changes'); }
  get button_Close() { return $('#update-modal .modal-footer').$('button=Close'); }
  get button_ViewSecurityData() { return $('#update-modal .modal-footer').$('button=View security data'); }

  get input_SearchDateActive_SecurityPricesTab() { return $('input#search-date-active'); }
  get checkbox_CustomPrice_SecurityPricesTab() { return $('#prices-container>.prices-buttons>.custom-price-switch input'); }
  get checkbox_FundLevelPrice_SecurityPricesTab() { return $('#prices-container>.prices-buttons>.custom-price-switch input'); }
  get allLines_SecurityPricesTab() { return $$('.prices-table tbody>tr'); }
  get firstLine_SecurityPricesTab() { return $('.prices-table tbody>tr:first-child'); }

  get input_ExDate() { return $('#update-modal .modal-body input#exDate'); }
  get input_PayableDate() { return $('#update-modal .modal-body input#payableDate'); }
  get input_RecordDate() { return $('#update-modal .modal-body input#dividendDate'); }
  get selectButton_Type() { return $('#update-modal .modal-body>div.MuiBox-root>div:nth-child(4) div[role="combobox"]'); }
  get input_Description() { return $('#update-modal .modal-body input#description'); }
  get input_Amount() { return $('#update-modal .modal-body input#amount'); }
  get input_Franked() { return $('#update-modal .modal-body input#franking'); }
  get selectButton_DRPIndicator() { return $('#update-modal .modal-body>div.MuiBox-root>div:nth-child(8) div[role="combobox"]'); }

  get allLines_IncomeTab() { return $$('#income-container tbody>tr'); }
  get firstLine_IncomeTab() { return $('#income-container tbody>tr:first-child'); }
  get input_SearchDateActive_IncomeTab() { return $('input#search-date-active'); }

  get button_DeleteEntry_SecurityPrice() { return $('#delete-security-data .modal-footer').$('button=Delete Entry'); }
  get button_Close_DeleteSecurityPrice() { return $('#delete-security-data .modal-footer').$('button=Close'); }
  get text_ShowingPageResults() { return $('#securityDetailsModal .pages-results>span'); }

  get button_DeleteEntry_SecurityIncome() { return $('#delete-security-data .modal-footer').$('button=Delete Entry'); }
  get button_Close_DeleteSecurityIncome() { return $('#delete-security-data .modal-footer').$('button=Close'); }

  get input_Date_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-body input#updateDate'); }
  get input_AustralianShares_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-body input#australianShares'); }
  get input_InternationalShares_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-body input#internationalShares'); }
  get input_Cash_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-body input#cash'); }
  get input_FixedInterestAustralian_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-body input#fixedInterestAustralian'); }
  get input_FixedInterestInternational_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-body input#fixedInterestInternational'); }
  get input_Mortgages_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-body input#mortgages'); }
  get input_DirectProperty_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-body input#directProperty'); }
  get input_ListedProperty_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-body input#listedProperty'); }
  get input_Other_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-body input#other'); }

  get input_SearchDateActive_AssetAllocationTab() { return $('input#search-date-active'); }
  get allLines_AssetAllocationTab() { return $$('#asset-container>.react-table tbody>tr'); }
  get firstLine_AssetAllocationTab() { return $('#asset-container>.react-table tbody>tr:nth-child(1)'); }
  get button_SaveChanges_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-footer').$('button=Save changes'); }
  get button_Close_AssetAllocation() { return $('#update-modal:not([aria-hidden="true"]) .modal-footer').$('button=Close'); }
  get button_DeleteEntry_AssetAllocation() { return $('#delete-security-data .modal-footer').$('button=Delete Entry'); }
  get button_Close_DeleteAssetAllocation() { return $('#delete-security-data .modal-footer').$('button=Close'); }

  get input_CodeOrName_SearchGlobally() { return $('input#search-input'); }
  get button_Search_SearchGlobally() { return $('input#search-button'); }
  get input_Date_SearchGlobally() { return $('input#date-search-date-picker'); }
  get firstResult_SearchGlobally() { return $('.search-suggestion tbody>tr:nth-child(1)>.quick-search-code>button'); }
  get text_PriceDate() { return $('#security-list tbody>tr>td:nth-child(4)'); }
  get text_PriceUtilised() { return $('#security-list tbody>tr>td:nth-child(5)>span'); }

  get allSecurityCode_OnePage_InvestmentSecurityList() { return $$('#security-list table>tbody>tr>td:nth-child(2)>button'); }
  get text_TotalResults_InvestmentSecurityList() { return $('.pages-results>span'); }

  get button_SwitchActiveHoldingToggle() { return $('.second-row-buttons .switch-box button'); }
  get dropDownButton_Date() { return $('.second-row-buttons>div:nth-child(1)'); }
  get item_Custom_Date() { return $('ul[role="listbox"]>li:nth-child(3)'); }
  get input_Date() { return $('input#date-search-date-picker'); }
  get button_Reset() { return $('#reset-button'); }
  get button_SortSecurityCode() { return $('#security-list thead>tr>th:nth-child(2)'); }
  get button_SortSecurityName() { return $('#security-list thead>tr>th:nth-child(3)'); }
  get button_Page2() { return $('.pager>li:nth-child(3)>button'); }
  get dropDownbutton_MarketType() { return $('#security-list thead>tr>th:nth-child(9) button'); }
  get dropDownbutton_FeedSource() { return $('#security-list thead>tr>th:nth-child(10) button'); }
  get input_SearchFeedSource() { return $('#simple-popover>div:nth-child(3) input'); }

  get button_AddSecurity() { return $('.button-areas>div:nth-child(1)>button'); }
  get input_MarketType() { return $('#add-security-details>div>div:nth-child(1) .input-form-input>div input'); }
  get input_SecurityCode() { return $('input#add-security-code'); }
  get input_SecurityName() { return $('input#add-security-name'); }
  get button_Save_AddSecurity() { return $('.save-data button.primary-button'); }
  get button_Close_AddSecurity() { return $('button=Close'); }
  get button_DeleteSecurity() { return $('button.more-action-delete'); }
  get button_DeleteSecurity_Confirmation() { return $('button=Delete Security'); }

  get button_EditSecurity() { return $('button#more-action-edit-security'); }
  get tab_SecurityDetails() { return $('div[role="tablist"]>button#tab-0'); }
  // get tab_SecurityPrices() { return $('div[role="tablist"]>button#tab-1'); }
  // get tab_Income() { return $('div[role="tablist"]>button#tab-2'); }
  // get tab_AssetAllocation() { return $('div[role="tablist"]>button#tab-3'); }
  get firstLine_SecurityPrice() { return $('#prices-container>table>tbody>tr:nth-child(1)'); }
  get allLines_Page1_SecurityPrice() { return $$('#prices-container>table>tbody>tr'); }
  get firstLine_AssetAllocation() { return $('#asset-container>table>tbody>tr:nth-child(1)'); }
  get allLines_Page1_AssetAllocation() { return $$('#asset-container>table>tbody>tr'); }
  get text_PageResult() { return $('.edit-security-body-container .pages-results>span'); }
  get text_MarketType() { return $('.edit-security-body-container>.sec-details>div:nth-child(1)>div:nth-child(2)>div>div>div>div>div>div:nth-child(1)'); }
  get text_SecurityCode() { return $('.edit-security-body-container>.sec-details>div:nth-child(2)>div:nth-child(2)>div>div>div>div>input'); }
  get text_DataFeedSource() { return $('#tabpanel-0 .sec-details>div:nth-child(9) span'); }
  get text_DataFeedSource1() { return $('#tabpanel-0 .sec-details>div:nth-child(10) span'); }
  get text_DataFeedSource2() { return $('#tabpanel-0 .sec-details>div:nth-child(7) span'); }
  get firstLine_Income() { return $('#income-container>table>tbody>tr:nth-child(1)'); }
  get allLines_Page1_Income() { return $$('#income-container>table>tbody>tr'); }
  get loadingBar() { return $('.overlay>.overlay-inner>.overlay-content'); }

  getTheLatestWorkday(market) {
    const currentDate = new Date().toLocaleDateString("en-AU");  // DD/MM/YYYY
    const currentDateYYYYMMDD = format(parse(currentDate, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'); // yyyy-MM-dd
    // console.log('currentDateYYYYMMDD--->', currentDateYYYYMMDD);
    const currentYear = currentDate.split('/')[2];
    const currentYearHolidays = marketMapping[market].getHolidays(currentYear);

    let theLastestWorkdayYYYMMDD = '';

    for (let i = 1; i <= 7; i++) {
      let date = subDays(new Date(currentDateYYYYMMDD), i);
      // console.log('date--->', date)
      let dateYYYMMDD = format(parse(date.toLocaleDateString(), 'MM/dd/yyyy', new Date()), 'yyyy-MM-dd');

      if (date.getDay() == 6 || date.getDay() == 0) continue;
      else {
        let holidayFlag = false;
        for (const hd of currentYearHolidays) {
          if (hd.date == `${dateYYYMMDD} 00:00:00`) {
            holidayFlag = true;
            break;
          }
        }

        if (holidayFlag) continue;
      }
      theLastestWorkdayYYYMMDD = dateYYYMMDD;
      break;
    }
    return theLastestWorkdayYYYMMDD;
  }

  checkPriceDate(securityCode, priceDateYYYYMMDD, expectedDateYYYYMMDD, tolerance) {
    let result = false;
    let newTolerance = tolerance;

    const currentDate = new Date().toLocaleDateString("en-AU");  // DD/MM/YYYY
    const currentDateYYYYMMDD = format(parse(currentDate, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'); // yyyy-MM-dd
    if (priceDateYYYYMMDD == currentDateYYYYMMDD) {
      result = true;
    }
    else if (compareAsc(new Date(priceDateYYYYMMDD), new Date(expectedDateYYYYMMDD)) > 0) {
      result = true;
    }
    else {
      for (let i = 0; i <= newTolerance; i++) {
        const date = subDays(new Date(expectedDateYYYYMMDD), i);
        if (date.getDay() == 0) newTolerance = tolerance + 2;
        // console.log('date--->', date)
        const dateYYYMMDD = format(parse(date.toLocaleDateString(), 'MM/dd/yyyy', new Date()), 'yyyy-MM-dd');
        if (priceDateYYYYMMDD == dateYYYMMDD) {
          result = true;
          console.log('\x1b[32m%s\x1b[0m', `The price date of ${securityCode} is ${dateYYYMMDD} which is in the tolerance of ${tolerance}`);
          break;
        }
      }
    }

    assert.equal(result, true, `The price date of ${securityCode} is ${priceDateYYYYMMDD} which is not in the tolerance of ${tolerance} !!`);
  }
}

export const investmentSecurityListPage = new InvestmentSecurityListPage();

