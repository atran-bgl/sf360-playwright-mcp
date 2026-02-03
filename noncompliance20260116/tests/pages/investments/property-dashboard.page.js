import Page from '../page.js';
import { browser, $, $$ } from '@wdio/globals';
class PropertyDashboardPage extends Page {
  get button_AddNewProperty() { return $('button[data-target="#newProperty"]'); }
  get input_Address() { return $('#pac-input'); }
  get input_SecurityCode() { return $('#securityCode'); }
  get button_AddAccount() { return $('button=Add Account'); }
  get image_Loading_AddAccount() { return $('.modal-footer img[src*="blue-loading"]'); }
  get text_AccountCode_FirstRow() { return $('table#dashboard>tbody:nth-child(2) td:nth-child(2)>p'); }
  get text_AccountCode_SecondRow() { return $('table#dashboard>tbody:nth-child(3) td:nth-child(2)>p'); }
  get text_SecurityCodeExists() { return $('p=Security code entered already exists. A unique security code has been generated.'); }
}

export const propertyDashboardPage = new PropertyDashboardPage();
