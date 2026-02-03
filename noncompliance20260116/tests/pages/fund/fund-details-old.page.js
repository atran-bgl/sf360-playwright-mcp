import Page from '../page.js';

class FundDetailsOldPage extends Page {
  get buttons_SelecteCountry() { return $$('select.gwt-ListBox'); }
  get button_Save() { return $('button=Save'); }
  get text_DetailsSavedSuccessfully() { return $('div.dialog_content'); }
  get button_Ok() { return $('div.dialog_button_area>div:nth-child(2)'); }
}

export const fundDetailsOldPage = new FundDetailsOldPage();

