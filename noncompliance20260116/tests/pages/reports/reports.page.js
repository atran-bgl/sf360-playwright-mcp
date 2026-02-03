import Page from '../page.js';

class ReportsPage extends Page {
  get button_StartingUsingReports_Tips() { return $('.sixui_button.report_starting_button.report_button'); }
  get text_Title_SelectFundFirst() { return $('.dialog_content '); }
  get button_Yes_SelectFundFirst() { return $('.dialog_button_text'); }
}

export const reportsPage = new ReportsPage();
