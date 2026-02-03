
import Page from '../page.js';
import { assert } from '../../lib/util.js';
import { context } from '../../data/context.js';
import { browser, $, $$ } from '@wdio/globals';

const { waitTime } = context.TestSettings;
class EntitySetupPage extends Page {
  // get selectButton_selectEntityType() { return $('#entityType_root'); }
  // get borderColor_selectEntityType() { return $('#entityType_root>div>div'); }
  // get option_EntityType_SMSF() { return $('.InputSelect__menu>div>div:nth-child(1)'); }

  get button_EntityType_SMSF() { return $('span=SMSF'); }

  get text_SelectedBadgeName() { return $('#badgeId_root .InputSelect__single-value'); }
  get link_BadgeSettings() { return $('=Badge Settings'); }
  get input_Name() { return $('#name'); }
  get input_Code() { return $('#portalCode'); }
  get hint_Code() { return $('i.NcSiHint'); }
  get tooltip_Code() { return $('#root #app > div.__react_component_tooltip'); }
  get input_ABN() { return $('#abn'); }
  get input_TFN() { return $('.DataContainer>div:nth-child(2)>div:nth-child(2)>div:nth-child(5) input'); }

  get input_DateFormed() { return $('#establishmentDate'); }
  get selectButton_selectFY() { return $('.DataContainer>div:nth-child(3)>div:nth-child(2)>div:nth-child(4) span.FyQuarterSelectorBtn>button'); }
  get input_FinancialYearFrom() { return $('#yearFrom'); }
  get input_FinancialYearTo() { return $('#yearTo'); }
  get switch_EnterOpeningBalance() { return $('#OPENING_BALANCE+.switch-items'); }
  get input_SystemStartDate() { return $('#systemtStartDate'); }

  get button_CreateXXX() { return $('.CreateEntityApp>div>div>div.footer>button'); }

  get errorMessage_ABN() { return $('#abn+span'); }
  get errorMessage_TFN() { return $('.DataContainer>div:nth-child(2)>div:nth-child(2)>div:nth-child(5) input+span'); }
  get errorMessage_DateFormed() { return $('.DataContainer>div:nth-child(3) .inputTextError'); }

  get errorMessage_FundCodeExisting() { return $('.loadingError>div'); }
  get button_OK_FundCodeExistingError() { return $('.loadingError>button'); }
  get warningMessageTitle_TFNExisting() { return $('h5=Warning: TFN already exists'); }
  get warningMessageBody_TFNExisting() { return $('div.modal-body'); }
  get button_Cancel_TFNExistingWarning() { return $('button=Cancel'); }
  get button_Proceed_TFNExistingWarning() { return $('button=Proceed'); }

  get text_XXXCreated() { return $('h2*=Created!'); }

  // verifyTipPosition(ele, tip) {
  //   const eleLocation = ele.getLocation();
  //   const eleSize = ele.getSize();
  //   const tipLocation = tip.getLocation();
  //   const tipSize = tip.getSize();
  //   assert.closeTo(tipLocation.x + tipSize.width / 2, eleLocation.x + eleSize.width / 2, 1, `"${tip.getText()}" is not in the middle of the input box!`);
  //   assert.equal(tipLocation.y, eleLocation.y - tipSize.height - 5, `"${tip.getText()}" is not just on the top of the input box!`); // the height of arrow button is 5px
  // }

  async selectAndVerifyFY(fy) {
    await (await this.selectButton_selectFY).waitForDisplayed();
    await (await this.selectButton_selectFY).waitForEnabled();
    await (await this.selectButton_selectFY).click();
    await browser.pause(waitTime.medium);
    await $(`button=FY ${fy}`).waitForExist();
    await $(`button=FY ${fy}`).click();
    await browser.pause(waitTime.long);
    // await $(`button=FY ${fy}`).click();
    // await browser.pause(waitTime.long);
    assert.equal(await this.input_FinancialYearFrom.getValue(), `01/07/${fy - 1}`);
    assert.equal(await this.input_FinancialYearTo.getValue(), `30/06/${fy}`);
  }

  async inputAndVerifyFY(from, to, expectedFy) {
    await this.input_FinancialYearFrom.waitForEnabled();
    await this.input_FinancialYearFrom.scrollIntoView();
    await browser.pause(waitTime.long);
    // await this.input_FinancialYearFrom.click();
    await this.input_FinancialYearFrom.setValue((await '\uE003'.repeat((await this.input_FinancialYearFrom.getValue()).length)) + from);
    await browser.pause(waitTime.medium);

    await this.input_FinancialYearTo.waitForEnabled();
    await browser.pause(waitTime.medium);
    // await this.input_FinancialYearTo.click();
    await this.input_FinancialYearTo.setValue((await '\uE003'.repeat((await this.input_FinancialYearFrom.getValue()).length)) + to);
    await browser.pause(waitTime.medium);
    await browser.keys('Tab');
    await browser.pause(waitTime.medium);

    assert.equal(await this.selectButton_selectFY.getText(), expectedFy);
  }
}

export const entitySetupPage = new EntitySetupPage();