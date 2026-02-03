import Page from '../page.js';

class FundExportPage extends Page {
  get text_Title() { return $('.fe_fund_name>b'); }
  get text_TitleFundName() { return $('.fe_fund_name>b>span'); }
}

export const fundExportPage = new FundExportPage();

