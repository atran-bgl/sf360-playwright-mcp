import Page from '../page.js';

class FundDetailsNewPage extends Page {
  get button_SelecteCountry() { return $('#country-name'); }
  get button_Save() { return $('button=Save changes'); }
  get circleLoader_SaveComplete() { return $('.circle-loader.load-complete'); }
  get text_ChangesSaved() { return $('.successMessage'); }

  get input_ABN() { return $('div.dataContainerBody>div:nth-child(2)>div:nth-child(2)>div:nth-child(1) input'); }
  get input_ESA() { return $('div.dataContainerBody>div:nth-child(2)>div:nth-child(2)>div:nth-child(3) input.InputText'); }
}

export const fundDetailsNewPage = new FundDetailsNewPage();

