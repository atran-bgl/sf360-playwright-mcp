
import Page from '../page.js';
import { assert } from '../../lib/util.js';

import { context } from '../../data/context.js';


const { waitTime } = context.TestSettings;
class EntitySelectionPage extends Page {
  get systemInformation_PleaseWait() { return $('.dialog_content_panel .dialog_wait_msg'); }
  get selectButton_Label() { return $('#labelSearchDiv>.select-button'); }
  get input_Label() { return $('.select-button-popupPanel input[type="text"]'); }
  get checkBox_FirstLabel() { return $('.select-button-popupPanel .dataTable>tbody>tr>td:nth-child(1) .checkbox'); }
  get button_SearchLabel() { return $('.select-button-popupPanel>.popupContent>div>div:nth-child(3)').$('div=Search'); }
  get pageLink_2() { return $('.base-pagination tbody>tr>td:nth-child(5)'); }
  get text_Alllabels() { return $$('.fund_list_table>tbody:not([style="display: none;"])>tr>td:nth-child(4) span'); }

  get checkBox_FirstEntity() { return $('.fund_list_table>tbody:not([style="display: none;"])>tr:nth-child(1)>td:nth-child(1) input'); }
  get selectButton_LabelAs() { return $('#labelAsDiv>.select-button'); }
  get button_AddNewLabel() { return $('.select-button-popupPanel>.popupContent>div>div:nth-child(3)>div:nth-child(1) .fb_middle'); }
  get button_ManageLabels() { return $('.select-button-popupPanel>.popupContent>div>div:nth-child(3)>div:nth-child(3) .fb_middle'); }
  get input_NewLabel() { return $('.gwt-PopupPanel>.popupContent .au_dialog_content input'); }
  get button_CreateLabel() { return $('.gwt-PopupPanel>.popupContent .au_dialog_footer>div:nth-child(1) .fb_middle'); }

  get input_SearchEntity() { return $('input.qs_search_text_box'); }
  get button_SearchEntity() { return $('div.qs_search_btn_div'); }
  get button_ApplyLabels() { return $('.select-button-popupPanel>.popupContent>div>div:nth-child(3)>div:nth-child(2) .fb_middle'); }
  get message_LabelsApplied() { return $('div=Labels have been applied successfully.'); }
  get button_Ok_LabelsApplied() { return $('.dialog_button'); }

  get text_FirstEntityLabels() { return $('.fund_list_table>tbody:not([style="display: none;"])>tr:nth-child(1)>td:nth-child(4) span'); }
  get text_AllEntityCodes() { return $$('.fund_list_table>tbody:not([style="display: none;"])>tr>td:nth-child(2) span'); }

  get input_Label_ManageLabelsPage() { return $('input.searchTextBox'); }
  get button_Search_ManageLabelsPage() { return $('div.search_pink_btn_text'); }
  get checkBox_FirstLabel_ManageLabelsPage() { return $('tbody>tr:nth-child(1)>td input'); }
  get link_Edit_FirstLabel_ManageLabelsPage() { return $('=Edit'); }
  get button_Cancel_EditEntityLabel() { return $('div=Cancel'); }
  get checkBox_SelectAllLabel_ManageLabelsPage() { return $('th input[type="checkbox"]'); }
  get button_Delete_ManageLabelsPage() { return $('div.delete-button-middle'); }
  get button_Ok_DeleteLabel_ManageLabelsPage() { return $('div.dialog_button_area>div.dialog_button:nth-child(2)'); }
  get text_LabelsDeleted_ManageLabelPage() { return $('div=The selected fundLabels have been deleted.'); }
  get button_Ok_LabelsDeleted_ManageLabelPage() { return $('div.dialog_button_area>div.dialog_button'); }

  async addNewLabel(labelName) {
    await browser.url(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Home_Entity_selection}?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`);
    await browser.pause(waitTime.medium);
    await this.systemInformation_PleaseWait.waitForDisplayed({ reverse: true, timeout: waitTime.loadMedium });
    await browser.pause(waitTime.medium);

    await this.checkBox_FirstEntity.waitForEnabled();
    await this.checkBox_FirstEntity.click();
    await browser.pause(waitTime.medium);

    await this.selectButton_LabelAs.waitForDisplayed();
    await this.selectButton_LabelAs.waitForEnabled();
    await this.selectButton_LabelAs.click();
    await browser.pause(waitTime.medium);
    await this.button_AddNewLabel.waitForEnabled();
    await this.button_AddNewLabel.click();
    await browser.pause(waitTime.medium);
    await this.input_NewLabel.waitForEnabled();
    await browser.pause(waitTime.medium);
    await this.input_NewLabel.setValue(labelName);
    await browser.pause(waitTime.medium);
    await this.button_CreateLabel.waitForEnabled();
    await this.button_CreateLabel.click();
    await browser.pause(waitTime.long);
  }

  async labelUnlabelEntity(entityCode, labelNames) {
    await browser.url(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Home_Entity_selection}?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`);
    await browser.pause(waitTime.medium);
    await this.systemInformation_PleaseWait.waitForDisplayed({ reverse: true, timeout: waitTime.loadMedium });
    await browser.pause(waitTime.medium);

    await this.input_SearchEntity.waitForEnabled();
    await this.input_SearchEntity.setValue(entityCode);
    await browser.pause(waitTime.medium);
    await this.button_SearchEntity.waitForEnabled();
    await this.button_SearchEntity.click();
    await browser.pause(waitTime.medium);
    await this.systemInformation_PleaseWait.waitForDisplayed({ reverse: true, timeout: waitTime.loadMedium });
    await browser.pause(waitTime.medium);

    await this.checkBox_FirstEntity.waitForEnabled();
    await this.checkBox_FirstEntity.click();
    await browser.pause(waitTime.medium);

    await this.selectButton_LabelAs.waitForDisplayed();
    await this.selectButton_LabelAs.waitForEnabled();
    await this.selectButton_LabelAs.click();
    await browser.pause(waitTime.medium);

    for (const labelName of labelNames) {
      await this.input_Label.waitForDisplayed();
      await this.input_Label.waitForEnabled();
      await this.input_Label.setValue((await '\uE003'.repeat((await this.input_Label.getValue()).length)) + labelName);
      await browser.pause(waitTime.long);
      await this.checkBox_FirstLabel.waitForEnabled();
      await this.checkBox_FirstLabel.click();
      await browser.pause(waitTime.long);
    }
    await this.button_ApplyLabels.waitForEnabled();
    await this.button_ApplyLabels.click();
    await browser.pause(waitTime.medium);
    await this.message_LabelsApplied.waitForDisplayed();
    await this.button_Ok_LabelsApplied.waitForEnabled();
    await this.button_Ok_LabelsApplied.click();
    await browser.pause(waitTime.medium);
  }

  async verifyLabels(entityCode, labelNames) {
    await browser.url(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Home_Entity_selection}?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`);
    await browser.pause(waitTime.medium);
    await this.systemInformation_PleaseWait.waitForDisplayed({ reverse: true, timeout: waitTime.loadMedium });
    await this.input_SearchEntity.waitForEnabled();
    await this.input_SearchEntity.setValue(entityCode);
    await browser.pause(waitTime.medium);
    await this.button_SearchEntity.waitForEnabled();
    await this.button_SearchEntity.click();
    await browser.pause(waitTime.medium);
    await this.systemInformation_PleaseWait.waitForDisplayed({ reverse: true, timeout: waitTime.loadMedium });
    await browser.pause(waitTime.medium);

    await this.text_FirstEntityLabels.waitForExist();
    assert.sameMembers((await this.text_FirstEntityLabels.getText()).split(' '), labelNames);
    await browser.pause(waitTime.medium);
  }

  async searchByLabel(labelNames, expectedSearchResult) {
    await browser.url(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Home_Entity_selection}?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`);
    await browser.pause(waitTime.medium);
    await this.systemInformation_PleaseWait.waitForDisplayed({ reverse: true, timeout: waitTime.loadMedium });
    await browser.pause(waitTime.medium);

    await this.selectButton_Label.waitForEnabled();
    await this.selectButton_Label.click();
    await browser.pause(waitTime.medium);

    for (const labelName of labelNames) {
      await this.input_Label.waitForDisplayed();
      await this.input_Label.waitForEnabled();
      await this.input_Label.setValue((await '\uE003'.repeat((await this.input_Label.getValue()).length)) + labelName);
      await browser.pause(waitTime.long);
      await this.checkBox_FirstLabel.waitForEnabled();
      await this.checkBox_FirstLabel.click();
      await browser.pause(waitTime.long);
    }

    await this.button_SearchLabel.waitForEnabled();
    await this.button_SearchLabel.click();
    await browser.pause(waitTime.medium);
    await this.systemInformation_PleaseWait.waitForDisplayed({ reverse: true, timeout: waitTime.loadMedium });
    await browser.pause(waitTime.long);

    const allEntityCodes = await this.text_AllEntityCodes;
    const searchResult = [];
    for (const entity of allEntityCodes) {
      searchResult.push(await entity.getText());
    }
    assert.sameMembers(searchResult, expectedSearchResult);
  }

  async DeleteLabel(labelName) {
    await browser.url(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Home_Entity_selection}?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`);
    await browser.pause(waitTime.medium);
    await this.systemInformation_PleaseWait.waitForDisplayed({ reverse: true, timeout: waitTime.loadMedium });
    await browser.pause(waitTime.medium);

    await this.checkBox_FirstEntity.waitForEnabled();
    await this.checkBox_FirstEntity.click();
    await browser.pause(waitTime.medium);

    await this.selectButton_LabelAs.waitForDisplayed();
    await this.selectButton_LabelAs.waitForEnabled();
    await this.selectButton_LabelAs.click();
    await browser.pause(waitTime.medium);
    await this.button_ManageLabels.waitForEnabled();
    await this.button_ManageLabels.click();
    await browser.pause(waitTime.medium);
    await this.input_Label_ManageLabelsPage.waitForDisplayed()
    await this.input_Label_ManageLabelsPage.waitForEnabled();
    await this.input_Label_ManageLabelsPage.setValue(labelName);
    await browser.pause(waitTime.medium);
    await this.button_Search_ManageLabelsPage.waitForEnabled();
    await this.button_Search_ManageLabelsPage.click();
    await browser.pause(waitTime.long);

    await (await this.checkBox_FirstLabel_ManageLabelsPage).waitForDisplayed();
    await (await this.checkBox_FirstLabel_ManageLabelsPage).waitForEnabled();
    // await (await this.checkBox_FirstLabel_ManageLabelsPage).click();
    await browser.execute(async (ele) => { await ele.click(); }, await this.checkBox_FirstLabel_ManageLabelsPage);
    await browser.pause(waitTime.medium);
    await this.button_Delete_ManageLabelsPage.waitForEnabled();
    await this.button_Delete_ManageLabelsPage.click();
    await browser.pause(waitTime.medium);
    await this.button_Ok_DeleteLabel_ManageLabelsPage.waitForEnabled();
    await this.button_Ok_DeleteLabel_ManageLabelsPage.click();
    await this.text_LabelsDeleted_ManageLabelPage.waitForDisplayed();
    await this.button_Ok_LabelsDeleted_ManageLabelPage.waitForEnabled();
    await this.button_Ok_LabelsDeleted_ManageLabelPage.click();
    await browser.pause(waitTime.medium);
  }
}

export const entitySelectionPage = new EntitySelectionPage();
