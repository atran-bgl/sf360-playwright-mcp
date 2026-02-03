import fs from 'fs';
import Page from '../page.js';
import { context } from '../../data/context.js';


const { waitTime } = context.TestSettings;

class DocumentsPage extends Page {
  get button_Delete() { return $('button[aria-label="document-delete-button"]'); }
  get button_Delete_Document_Ok() { return $('button[aria-label="delete-document-button-ok"]'); }
  get button_Delete_Documents_Ok() { return $('button[aria-label="download-infected-documents-confirm-button-ok"]'); }
  get button_Download() { return $('button[aria-label="document-download-button"]'); }
  get button_Update_Multi() { return $('button[aria-labelledby="document-change-multi-update-button"]'); }

  get button_Refresh() { return $('button[aria-label="document-refresh-button"]'); }
  get button_Upload() { return $('button[aria-label="document-upload-button"]'); }
  get button_All_Documents() { return $('button[aria-labelledby="financial-year-tab-All Documents"]'); }
  get button_Select_Financial_Year() { return $('button[aria-labelledby="financial-year-select"]'); }
  get button_Search_Clear_All() { return $('button=Clear All'); }
  get button_Search_Filter() { return $('input[value=Filter]'); }
  get button_Settings() { return $('button[aria-label="document-setting-button"]'); }

  get label_Entity_Folder_Count() { return $('#root > div > div.MuiBox-root > div > div.MuiBox-root > span'); }
  get label_Entity_Folder_Path() { return $('ol[class="MuiBreadcrumbs-ol"]'); }
  get list_Entity_Folder() { return $('ul[role="tree"]'); }
  get input_Search() { return $('input[placeholder="Search Document"]'); }
  get items_Documents() { return $$('#document-table>tbody>tr'); }

  get tickBox_All_Documents() { return $('#document-table>thead input'); }
  get tableHeader_Documents() { return $('#document-table>thead'); }
  get progressBar_Documents() { return $('div[role="progressbar"]'); }

  // Upload Files dialog
  get button_selectFinancialYear() { return $('div.MuiDialogContent-root>div>div:nth-child(3)>div'); }
  get button_Upload_File() { return $('div.MuiDialogActions-root>button'); }
  get input_Upload_File() { return $('div.MuiDialogContent-root>div>div:nth-child(5)>div>input'); }
  get items_Upload_Document() { return $$('body > div.MuiDialog-root > div.MuiDialog-container.MuiDialog-scrollPaper > div > div.MuiDialogContent-root.MuiDialogContent-dividers > div > div:nth-child(6) > div > ul > div > div > li'); }

  // Settings dialog
  get button_Settings_Close() { return $('button[aria-label="close"]'); }
  get items_Settings() { return $$('div[id="setting-panel"] tbody tr'); }

  // Comments dialo
  get items_Comment() { return $$('div[role="tooltip"] p'); } // first item: comment, the following item: date time

  async selectFinancialYear(financialYear) {
    await this.button_Select_Financial_Year.waitForDisplayed();
    await this.button_Select_Financial_Year.waitForEnabled();
    await this.button_Select_Financial_Year.click();

    await $(`li[value='${financialYear}']`).waitForDisplayed();
    await $(`li[value='${financialYear}']`).click();

    await this.progressBar_Documents.waitForDisplayed({
      reverse: true,
    });
  }

  async selectEntityFolder(folderName) {
    if (folderName === 'Entity Folder') {
      await $('h5=Entity Folder').waitForDisplayed();
      await $('h5=Entity Folder').waitForEnabled();
      await $('h5=Entity Folder').click();
    } else {
      await this.list_Entity_Folder.waitForDisplayed();
      await this.list_Entity_Folder.waitForEnabled();
      await (await (await this.list_Entity_Folder).$(`p[aria-label='${folderName}']`)).waitForDisplayed();
      await (await (await this.list_Entity_Folder).$(`p[aria-label='${folderName}']`)).click();
    }

    await this.progressBar_Documents.waitForDisplayed({
      reverse: true,
    });
  }

  async searchDocuments(options) {
    if (Object.prototype.hasOwnProperty.call(options, 'refresh')) {
      console.log('Refreshing search....');
      await this.button_Refresh.click();
    }

    if (Object.prototype.hasOwnProperty.call(options, 'clearAll')) {
      if ((await this.button_Search_Clear_All.isDisplayed()) && (await this.button_Search_Clear_All.isEnabled())) {
        await this.button_Search_Clear_All.click();
      }
      else {
        console.log('clear all option is not there');
      }
    }

    if (Object.prototype.hasOwnProperty.call(options, 'financialYear')) {
      await this.selectFinancialYear(options.financialYear);
    }

    if (Object.prototype.hasOwnProperty.call(options, 'entityFolder')) {
      await this.selectEntityFolder(options.entityFolder);
    }

    if (Object.prototype.hasOwnProperty.call(options, 'keyword')) {
      // await this.input_Search.clearValue();
      await this.input_Search.setValue('\uE003'.repeat(await this.input_Search.getValue().length) + options.keyword);
    }

    if (Object.prototype.hasOwnProperty.call(options, 'filters')) {
      await this.button_Search_Filter.click();

      for (const f of options.filters) {
        await $(`button=${f.name}`).waitForDisplayed();
        await $(`button=${f.name}`).click();

        if (f.name === 'File Owner') {
          const v = context.TestConfig.username;
          await $(`label=${v}`).waitForDisplayed();
          await $(`label=${v}`).waitForEnabled();
          await $(`label=${v}`).click();
        } else if (f.name === 'Document Updated Date') {
          const todayDate = new Date();
          let mm = todayDate.getMonth() + 1;
          if (mm < 10) mm = `0${mm}`;
          const dateString = `${todayDate.getDate()}${mm}${todayDate.getFullYear()}`;

          await (await $$('div[role="tabpanel"] input'))[0].setValue(dateString);
          await (await $$('div[role="tabpanel"] input'))[1].setValue(dateString);
        } else {
          for (const v of f.values) {
            await $(`label=${v}`).waitForDisplayed();
            await $(`label=${v}`).waitForEnabled();
            await $(`label=${v}`).click();
          };
        }
      };

      await $('button=Apply').click();
    }

    await browser.pause(waitTime.medium);
    await this.progressBar_Documents.waitForDisplayed({
      reverse: true,
    });
  }

  async selectMultiDocuments(options) {
    if (options && Object.prototype.hasOwnProperty.call(options, 'search')) {
      await this.searchDocuments(options.search);
    }

    if (Object.prototype.hasOwnProperty.call(options, 'selectAll')) {
      await this.tickBox_All_Documents.click();
    }

    if (Object.prototype.hasOwnProperty.call(options, 'documents')) {
      const documentRows = await this.items_Documents;

      for (const d of options.documents) {
        // const foundRow = documentRows.find(async (r) => await (await r.$('td:nth-child(3)>div>div>div>p')).getText() === d.name);
        let foundRow = '';
        for (const dr of documentRows) {
          if (await (await dr.$('td:nth-child(3)>div>div>div>p')).getText() === d.name) {
            foundRow = dr;
            break;
          }
        }

        if (!foundRow) throw new Error(`Unable to find document:${d.name}`);

        await (await foundRow.$('td:nth-child(1) input')).waitForEnabled();
        await (await foundRow.$('td:nth-child(1) input')).click();
      };
    }
  }

  async deleteDocuments(options) {
    console.log('deleting documents');
    await this.selectMultiDocuments(options);

    await this.button_Delete.waitForDisplayed();
    await this.button_Delete.waitForEnabled();
    await this.button_Delete.click();

    await this.button_Delete_Documents_Ok.waitForDisplayed();
    await this.button_Delete_Documents_Ok.waitForEnabled();
    await this.button_Delete_Documents_Ok.click();

    await this.button_Delete_Documents_Ok.waitForDisplayed({
      reverse: true,
      timeout: waitTime.loadBig,
    });

    // await this.tableHeader_Documents.waitForDisplayed();
    await this.progressBar_Documents.waitForDisplayed({
      reverse: true,
    });
  }

  async updateMultipleDocumentsInDialog(financialYear) {
    await (await $('div[id=update-multiple-documents-dialog-title]').$('p=Update Multiple Documents')).waitForDisplayed();

    const selectFYInput = await $('label=Select Financial Year').parentElement().$('input');
    await selectFYInput.waitForEnabled();
    await selectFYInput.setValue(financialYear);
    
    const firstListItem = await $('div[x-placement=bottom]').$(`li=${financialYear}`);
    await firstListItem.waitForDisplayed();
    await firstListItem.click();

    await $('button=Replace').waitForEnabled();
    await $('button=Replace').click();

    await $('button=Replace').waitForDisplayed({
      reverse: true,
      timeout: waitTime.loadBig,
    });

    await this.progressBar_Documents.waitForDisplayed({
      reverse: true,
    });
  }

  async updateMultipleDocuments(options) {
    console.log('updating multiple documents');
    await this.selectMultiDocuments(options);

    await this.button_Update_Multi.waitForDisplayed();
    await this.button_Update_Multi.waitForEnabled();
    await this.button_Update_Multi.click();

    await this.updateMultipleDocumentsInDialog(options.financialYear);
  }

  async downloadDocuments(options) {
    console.log('download documents');
    await this.selectMultiDocuments(options);

    await this.button_Download.waitForDisplayed();
    await this.button_Download.waitForEnabled();

    const checkedRows = await this.items_Documents.filter(async (r) => await (await r.$('td:nth-child(1) input')).isSelected());

    const fileName = (checkedRows.length === 1) ? await (await checkedRows[0].$('td:nth-child(3)>div>div>div>p')).getText() : 'files.zip';
    const fullFilePath = `${global.downloadDir}/${fileName}`;

    if (fs.existsSync(fullFilePath)) {
      console.log(`deleting existing downloaded file: ${fullFilePath}`);
      fs.unlinkSync(fullFilePath);
      await browser.pause(waitTime.medium);
    }

    await this.button_Download.click();

    await browser.waitUntil(async () => fs.existsSync(fullFilePath), waitTime.loadBig, 'Download is not finished in 30 seconds!', 10);
    await this.button_Download.waitForClickable();
    await browser.pause(waitTime.long);

    expect(
      fs.existsSync(fullFilePath),
    ).toBe(true);
    await browser.pause(waitTime.long);
  }

  async uploadDocuments(options) {
    await this.button_Upload.waitForDisplayed();
    await this.button_Upload.waitForEnabled();
    await this.button_Upload.click();

    if (Object.prototype.hasOwnProperty.call(options, 'financialYear')) {
      await this.button_selectFinancialYear.waitForEnabled();
      await this.button_selectFinancialYear.click();
      await browser.pause(waitTime.medium);
      await $(`li[data-value="${options.financialYear}"]`).waitForDisplayed();
      await $(`li[data-value="${options.financialYear}"]`).click();
    }

    let remoteFilePath = '';
    for (const f of options.files) {
      remoteFilePath += await browser.uploadFile(`${f.filePath}/${f.fileName}`);
      if (options.files.indexOf(f) !== options.files.length - 1) {
        remoteFilePath += '\n';
      }
    };

    await this.input_Upload_File.addValue(remoteFilePath);

    for (const f of options.files) {
      // const uploadedItem = await this.items_Upload_Document.find(async (d) => await (await d.getText()).startsWith(f.fileName));
      let uploadedItem = '';
      for (const iud of await this.items_Upload_Document) {
        if ((await iud.getText()).startsWith(f.fileName)) {
          uploadedItem = iud;
          break;
        }
      }
      if (Object.prototype.hasOwnProperty.call(f, 'newTags')) {
        if (!(await (await (await uploadedItem.parentElement()).$('input')).isDisplayed())) await (await uploadedItem.$('button[title="Tag"]')).click();
        for (const t of f.newTags) {
          await (await (await uploadedItem.parentElement()).$('input')).setValue(t);
          await $('li*=Create new tag').waitForDisplayed();
          await $('li*=Create new tag').click();
          await (await (await uploadedItem.parentElement()).$(`span=${t}`)).waitForDisplayed();
        };
      }
      if (Object.prototype.hasOwnProperty.call(f, 'existingTags')) {
        if (!(await (await (await uploadedItem.parentElement()).$('input')).isDisplayed())) await (await uploadedItem.$('button[title="Tag"]')).click();
        for (const t of f.existingTags) {
          await (await (await uploadedItem.parentElement()).$('input')).setValue(t);
          await $(`li=${t}`).waitForDisplayed();
          await $(`li=${t}`).click();
          await (await (await uploadedItem.parentElement()).$(`span=${t}`)).waitForDisplayed();
        };
      }
    };

    await this.button_Upload_File.waitForEnabled();
    await this.button_Upload_File.click();

    await this.button_Upload_File.waitForDisplayed({
      reverse: true,
      timeout: waitTime.loadBig,
    });

    // await this.tableHeader_Documents.waitForDisplayed();
    await this.progressBar_Documents.waitForDisplayed({
      reverse: true,
    });
  }

  async checkDocuments(options) {
    if (options && Object.prototype.hasOwnProperty.call(options, 'search')) {
      await this.searchDocuments(options.search);
    }

    if (options && Object.prototype.hasOwnProperty.call(options.expected, 'folders')) {
      expect(
        await this.label_Entity_Folder_Path
      ).toHaveText(options.expected.folders.join('\n'));
    }

    await browser.pause(waitTime.long);
    const documentRows = await this.items_Documents;

    if (Object.prototype.hasOwnProperty.call(options.expected, 'totalDocumentsCount')) {
      expect(documentRows).toBeElementsArrayOfSize(options.expected.totalDocumentsCount);
    }

    if (!(Object.prototype.hasOwnProperty.call(options.expected, 'documents'))) return;

    for (const d of options.expected.documents) {
      console.log(`checking for document:${d.name}`);
      // const foundRow = documentRows.find(async (r) => (await (await r.$('td:nth-child(3)>div>div>div>p')).getText()) === d.name);
      let foundRow = '';
      for (const dr of documentRows) {
        if (await (await dr.$('td:nth-child(3)>div>div>div>p')).getText() === d.name) {
          foundRow = dr;
          break;
        }
      }
      if (!foundRow) throw new Error(`Unable to find document:${d.name}`);

      if (Object.prototype.hasOwnProperty.call(d, 'status')) {
        expect(
          await foundRow.$('td:nth-child(3)>div>div>div>div>p:nth-last-child(1)')
        ).toHaveText(d.status);
      }

      if (Object.prototype.hasOwnProperty.call(d, 'tags')) {
        expect(
          await foundRow.$('td:nth-child(4)')
        ).toHaveText(d.tags.join('\n'));
      }

      if (Object.prototype.hasOwnProperty.call(d, 'financialYear')) {
        expect(
          await foundRow.$('td:nth-child(5)')
        ).toHaveText(d.financialYear);
      }

      if (Object.prototype.hasOwnProperty.call(d, 'folders')) {
        for (const f of d.folders) {
          expect(
            await foundRow.$(`p[aria-label='${f}']`)
          ).toBeDisplayed();
        };
      }

      if (Object.prototype.hasOwnProperty.call(d, 'comments')) {
        const foundCell = await foundRow.$('td:nth-child(6)');

        expect(
          await (await (await foundCell.$('svg[data-testid=ChatBubbleIcon]')).parentElement()).$('span')
        ).toHaveText(d.comments.length.toString());

        await (await foundCell.$('svg[data-testid=ChatBubbleIcon]')).click();
        await $('textarea[aria-invalid="false"]').waitForDisplayed();

        const commentsAllItems = await this.items_Comment;

        const commentsAllItems1 = commentsAllItems.filter((c) => commentsAllItems.indexOf(c) % 2 === 0);
        const commentsAllItems2 = [];
        for (const cai of commentsAllItems1) {
          commentsAllItems2.push(await cai.getText())
        }
        console.log(`AAAAAAAA ${commentsAllItems2}`);
        expect(commentsAllItems2).toStrictEqual(d.comments);

        await $('button=Close').waitForDisplayed();
        await $('button=Close').waitForEnabled();
        await $('button=Close').click();
      }
    };
  }

  async viewDocuments(options) {
    if (options && (Object.prototype.hasOwnProperty.call(options, 'search'))) {
      await this.searchDocuments(options.search);
    }

    const documentRows = await this.items_Documents;

    for (const d of options.documents) {
      console.log(`viewing for document:${d.name}`);
      // const foundRow = documentRows.find(async (r) => (await (await r.$('td:nth-child(3)>div>div>div>p')).getText()) === d.name);

      let foundRow = '';
      for (const dr of documentRows) {
        if (await (await dr.$('td:nth-child(3)>div>div>div>p')).getText() === d.name) {
          foundRow = dr;
          break;
        }
      }
      if (!foundRow) throw new Error(`Unable to find document:${d.name}`);

      const viewButton = await foundRow.$('td:nth-child(3)>div>div>div>p');
      await viewButton.waitForClickable();
      await viewButton.doubleClick();
      await browser.pause(waitTime.medium);

      if (await d.name.endsWith('.pdf')) {
        await $('div[id=viewer]').waitForDisplayed();
        await $('div[id=viewer]').waitForEnabled();
        await (await $('div[id=viewer]').$('div[class="react-pdf__Document "]')).waitForDisplayed();
        await (await $('div[id=viewer]').$('div[class="react-pdf__Document "]')).waitForEnabled();
        await browser.pause(waitTime.superLong);
        expect(
          await $('div[aria-describedby="simple-modal-description"] h5')
        ).toHaveText(d.name);

        const exitViewerButton = 'div[class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-content-xs-flex-end MuiGrid-grid-xs-2"]>button';
        await $(exitViewerButton).waitForDisplayed();
        await $(exitViewerButton).waitForEnabled();
        await $(exitViewerButton).waitForClickable();
        await $(exitViewerButton).click();
        await this.tableHeader_Documents.waitForDisplayed();
      }
      else {
        await browser.waitUntil(async () => fs.existsSync(`${global.downloadDir}/${d.name}`), waitTime.loadBig, 'Download is not finished in 30 seconds!', 10);
        await viewButton.waitForClickable();
        await browser.pause(waitTime.superLong);

        console.log(`${global.downloadDir}/${d.name}`);
        expect(
          fs.existsSync(`${global.downloadDir}/${d.name}`),
        ).toBe(true);
      }
    };
  }

  async checkDocumentTotalForEntityFolders(expectedResults) {
    for (const r of expectedResults) {
      let actualCountEle;
      if (r.folderName === 'Entity Folder') {
        actualCountEle = await this.label_Entity_Folder_Count.getText();
      } else {
        await this.list_Entity_Folder.waitForDisplayed();
        await this.list_Entity_Folder.waitForEnabled();

        await (await this.list_Entity_Folder.$(`p[aria-label='${r.folderName}']`)).waitForDisplayed();
        await (await this.list_Entity_Folder.$(`p[aria-label='${r.folderName}']`)).waitForEnabled();

        const countElement = await (await (await this.list_Entity_Folder.$(`p[aria-label='${r.folderName}']`)).parentElement()).$('span');
        await countElement.waitForDisplayed();
        actualCountEle = await countElement.getText();
      }

      expect(
        actualCountEle
      ).toHaveText(r.expectedTotal.toString());
    };
  }

  async clearSearchFilters(filters) {
    const actualFilters = await $$('section');

    for (const f of filters) {
      if (f.name === 'Clear All') {
        await this.button_Search_Clear_All.click();
        return;
      }
      // const foundFilter = actualFilters.find(async (af) => {
      //   const pList = await af.$$('p');
      //   if (pList.length !== 2) throw new Error(`Actual search filter does not contain name value p pair. ${await af.getText()}`);
      //   return ((await pList[0].getText()) === f.name && (await pList[1].getText()) === f.value);
      // });
      let foundFilter = '';
      for (const af of actualFilters) {
        const pList = await af.$$('p');
        if (pList.length !== 2) throw new Error(`Actual search filter does not contain name value p pair. ${await af.getText()}`);
        if ((await pList[0].getText()) === f.name && (await pList[1].getText()) === f.value) {
          foundFilter = af;
          break;
        }
      }
      if (!foundFilter) throw new Error(`Unable to find filter for: ${f.name}:${f.value}`);

      await (await (await (await foundFilter.parentElement()).parentElement()).$('svg')).click();
    };
    await this.progressBar_Documents.waitForDisplayed({
      reverse: true,
    });
  }

  async searchTags(options) {
    await this.button_Settings.waitForDisplayed();
    await this.button_Settings.waitForEnabled();
    await this.button_Settings.click();

    await $('input[placeholder="Search Tag"]').setValue(options.keyword);

    for (const et of options.expectedTags) {
      // const foundRow = await this.items_Settings.find(async (r) => (await (await r.$('td>div>div>input')).getAttribute('value')) === et.tagName && (await r.getText()) === et.tagType);
      let foundRow = '';
      for (const is of await this.items_Settings) {
        if (await (await is.$('td>div>div>input')).getAttribute('value') === et.tagName && await is.getText() === et.tagType) {
          foundRow = is;
          break;
        }
      }
      if (!foundRow) throw new Error(`Unable to find tag:${et.tagName} type:${et.tagType}`);
    };
    await this.button_Settings_Close.click();
  }

  async createTags(newTags) {
    await this.button_Settings.waitForDisplayed();
    await this.button_Settings.waitForEnabled();
    await this.button_Settings.click();

    for (const t of newTags) {
      await $('button=Create').click();
      await $('input[placeholder="New tag name"]').setValue(t.tagName);

      await $('button[aria-label="add tag-button"]').click();
      if (Object.prototype.hasOwnProperty.call(t, 'duplicateTagError')) {
        const errorElement = $('p[class="MuiFormHelperText-root MuiFormHelperText-contained Mui-error MuiFormHelperText-filled"]');
        await errorElement.waitForDisplayed();

        expect(
          await $('button[aria-label="add tag-button"]')
        ).toBeDisabled();

        expect(
          await errorElement
        ).toHaveText([
          'DUPLICATED TAG NOT ALLOWED',
          'Duplicated tag error message should be displayed',
        ]);

        await (await $$('button[aria-label="add tag-button"]'))[1].click();
        return;
      }

      if (Object.prototype.hasOwnProperty.call(t, 'invalidTagNameError')) {
        const errorElement = $('div[role="alert"]');
        await errorElement.waitForDisplayed();

        expect(
          await errorElement
        ).toHaveText([
          "Invalid character [_'?*.]. included in tag name.",
          'Invalid character in new tag name error message should be displayed',
        ]);

        await (await $$('button[aria-label="add tag-button"]'))[1].click();
        return;
      }

      await browser.pause(waitTime.long);

      // expect(
      //   await this.items_Settings.map(async (r) => await (await r.$('td>div>div>input')).getAttribute('value')))
      //   .toContain(t.tagName.toString().toUpperCase())

      const isArray = await this.items_Settings;
      const isArray1 = [];
      for (const is of isArray) {
        isArray1.push(await (await is.$('td>div>div>input')).getAttribute('value'));
      }
      expect(isArray1).toContain(t.tagName.toString().toUpperCase());
    };
    await this.button_Settings_Close.click();
  }

  async deleteTags(tags) {
    await this.button_Settings.waitForDisplayed();
    await this.button_Settings.waitForEnabled();
    await this.button_Settings.click();

    await $('div[id=setting-panel] table').waitForDisplayed();
    await $('div[id=setting-panel] table').waitForEnabled();

    for (const t of tags) {
      // const foundRow = await this.items_Settings.find(async (r) => (await (await r.$('td>div>div>input')).getAttribute('value')) === t.tagName);
      let foundRow = '';
      for (const is of await this.items_Settings) {
        if (await (await is.$('td>div>div>input')).getAttribute('value') === t.tagName) {
          foundRow = is;
          break;
        }
      }
      if (!foundRow) throw new Error(`Unable to find tag:${t.tagName}`);
      await browser.pause(waitTime.medium);

      await (await foundRow.$('input[type="checkbox"]')).click();
      await $('button[aria-label="tag-panel-delete-button"]').click();

      await $('h6[aria-label="delete-tag-content"]').waitForDisplayed();

      if (Object.prototype.hasOwnProperty.call(t, 'expectedTaggedDocumentCount')) {
        const deleteMsg = await $('h6[aria-label="delete-tag-content"]').getText();
        const deleteMsgTokenList = deleteMsg.split(' ');

        expect(
          deleteMsgTokenList[deleteMsgTokenList.length - 6],
        ).toBe(
          t.expectedTaggedDocumentCount.toString(),
          `The tagged document count is correct for tag: ${t.tagName}`,
        );
      }

      await $('button=Ok').waitForDisplayed();
      await $('button=Ok').waitForEnabled();
      await $('button=Ok').click();
      await $('button=Ok').waitForDisplayed({
        reverse: true,
      });
      await browser.pause(waitTime.medium);

      // expect(
      //   await this.items_Settings.map(async (r) => await (await r.$('td>div>div>input')).getAttribute('value'))
      // ).not.toContain(t.tagName.toString().toUpperCase());

      const isArray = await this.items_Settings;
      const isArray1 = [];
      for (const is of isArray) {
        isArray1.push(await (await is.$('td>div>div>input')).getAttribute('value'));
      }
      expect(isArray1).not.toContain(t.tagName.toString().toUpperCase());
    };

    await this.button_Settings_Close.click();
  }

  async updateFinancialYearInDialog(financialYear) {
    await (await $('div[id=financial-year-select-dialog-title]').$('p=Update Financial Year')).waitForDisplayed();

    await $('div[aria-labelledby="financial-year-select"]').waitForDisplayed();
    await $('div[aria-labelledby="financial-year-select"]').waitForEnabled();
    await $('div[aria-labelledby="financial-year-select"]').click();

    await $(`li[data-value="${financialYear}"]`).waitForDisplayed();
    await $(`li[data-value="${financialYear}"]`).click();

    await $('button=Ok').waitForEnabled();
    await $('button=Ok').click();
  }

  async editOneDocument(options) {
    // const foundRow = await this.items_Documents.find(async (r) => (await (await r.$('td:nth-child(3)>div>div>div>p')).getText()) === options.name);
    let foundRow = '';
    for (const id of await this.items_Documents) {
      if (await (await id.$('td:nth-child(3)>div>div>div>p')).getText() === options.name) {
        foundRow = id;
        break;
      }
    }
    if (!foundRow) throw new Error(`Unable to find document:${options.name}`);

    if (Object.prototype.hasOwnProperty.call(options, 'addTags')) {
      const foundCell = await foundRow.$('td:nth-child(4)');
      if (Object.prototype.hasOwnProperty.call(options.addTags, 'newTags')) {
        if (!(await (await foundCell.$('input')).isDisplayed())) await (await foundCell.$('div>div>div')).click();
        for (const t of options.addTags.newTags) {
          await (await foundCell.$('input')).waitForClickable();
          await (await foundCell.$('input')).click();
          await browser.pause(waitTime.medium);
          await (await foundCell.$('input')).setValue(t);
          await $('li*=Create new tag').waitForClickable();
          await $('li*=Create new tag').click();
          await (await foundCell.$(`span=${t}`)).waitForDisplayed();
          await browser.pause(waitTime.medium);
        };
      }
      if (Object.prototype.hasOwnProperty.call(options.addTags, 'existingTags')) {
        if (!(await (await foundCell.$('input')).isDisplayed())) await (await foundCell.$('div>div>div')).click();
        for (const t of options.addTags.existingTags) {
          await (await foundCell.$('input')).waitForClickable();
          await (await foundCell.$('input')).click();
          await (await foundCell.$('input')).setValue(t);
          await $(`li=${t}`).waitForClickable();
          await $(`li=${t}`).click();
          await (await foundCell.$(`span=${t}`)).waitForDisplayed();
          await browser.pause(waitTime.medium);
        };
      }
    }

    if (Object.prototype.hasOwnProperty.call(options, 'removeTags')) {
      const foundCell = await foundRow.$('td:nth-child(4)');

      for (const t of options.removeTags) {
        await (await foundCell.$(`span=${t}`)).waitForDisplayed();
        await (await (await (await foundCell.$(`span=${t}`)).parentElement()).$('svg')).click();
        await browser.pause(waitTime.medium);
        await (await foundCell.$(`span=${t}`)).waitForDisplayed({
          reverse: true,
        });
        await browser.pause(waitTime.medium);
      };
    }

    if (Object.prototype.hasOwnProperty.call(options, 'updateFinancialYear')) {
      const foundCell = await foundRow.$('td:nth-child(5)');

      await foundCell.click();
      await this.updateFinancialYearInDialog(options.updateFinancialYear);
      await browser.pause(waitTime.medium);
    }

    if (Object.prototype.hasOwnProperty.call(options, 'addComments')) {
      const foundCell = await foundRow.$('td:nth-child(6)');

      await (await foundCell.$('svg[data-testid=ChatBubbleIcon]')).click();

      for (const c of options.addComments) {
        await $('textarea[aria-invalid="false"]').waitForDisplayed();
        await $('textarea[aria-invalid="false"]').waitForEnabled();
        await $('textarea[aria-invalid="false"]').setValue(c);

        await $('button=Add Comment').waitForDisplayed();
        await $('button=Add Comment').waitForEnabled();
        await $('button=Add Comment').click();

        await browser.pause(waitTime.medium);

        await $('button=Add Comment').waitForEnabled({
          reverse: true,
        });

        const commentItems = await this.items_Comment;

        if (commentItems.length < 2) throw new Error(`New Comment is not added for "${c}".`);

        expect(
          await commentItems[commentItems.length - 2].getText(),
        ).toBe(c);
      };

      await $('button=Close').waitForDisplayed();
      await $('button=Close').waitForEnabled();
      await $('button=Close').click();
      await browser.pause(waitTime.medium);
    }

    if (Object.prototype.hasOwnProperty.call(options, 'removeComments')) {
      const foundCell = await foundRow.$('td:nth-child(6)');

      await (await foundCell.$('svg[data-testid=ChatBubbleIcon]')).click();

      for (const ct of options.removeComments) {
        const commentsAllItems = await this.items_Comment;
        const commentTextItems = commentsAllItems.filter((c) => commentsAllItems.indexOf(c) % 2 === 0);
        // const foundItem = commentTextItems.find(async (c) => (await c.getText()) === ct);
        let foundItem = '';
        for (const cti of commentTextItems) {
          if (await cti.getText() === ct) {
            foundItem = cti;
            break;
          }
        }

        if (!foundItem) throw new Error(`Unable to find comment:"${ct}" in document:${options.name}`);

        const deleteCommentButton = await (await foundItem.parentElement()).$('button');
        await deleteCommentButton.waitForDisplayed();
        await deleteCommentButton.waitForEnabled();
        await deleteCommentButton.click();

        await browser.pause(waitTime.medium);
      };

      await $('button=Close').waitForDisplayed();
      await $('button=Close').waitForEnabled();
      await $('button=Close').click();
      await browser.pause(waitTime.medium);
    }

    if (Object.prototype.hasOwnProperty.call(options, 'delete')) {
      const foundCell = await foundRow.$('td:nth-child(6)');

      await (await foundCell.$('button')).click();
      await $('li=Delete').waitForDisplayed();
      await $('li=Delete').click();

      await this.button_Delete_Document_Ok.waitForDisplayed();
      await this.button_Delete_Document_Ok.waitForEnabled();
      await this.button_Delete_Document_Ok.click();

      await this.button_Delete_Document_Ok.waitForDisplayed({
        reverse: true,
        timeout: waitTime.loadBig,
      });
      await browser.pause(waitTime.medium);
    }
  }
}

export const documentsPage = new DocumentsPage();

