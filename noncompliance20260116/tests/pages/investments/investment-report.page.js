import Page from '../page.js';

class InvestmentReportPage extends Page {
  get text_Title() { return $('h4.section-heading>strong>span'); }
}

export const investmentReportPage = new InvestmentReportPage();
