import Page from '../page.js';
import { context } from '../../data/context.js';
import * as firmUtil from '../../lib/firm-util.js';
import * as migrationUtil from '../../lib/migration-util.js';

class CgtRegisterPage extends Page {
  get button_DownloadExcel() { return $('=Download Excel'); }

  get button_OpenCGTHealthCheck() { return $('button.openModalBtn'); }
  get buttons_ExpandCollapse() { return $$('.expandBtn'); }
  get input_JumpToPage() { return $('input[aria-label="jump to page"]'); }

  get input_Investment1_Line1() { return $('div.rt-tbody>div:nth-child(1)>div:nth-child(2) input'); }
  get input_Investment1_Line2() { return $('div.rt-tbody>div:nth-child(1)>div:nth-child(3) input'); }
  get input_Investment1_Line3() { return $('div.rt-tbody>div:nth-child(1)>div:nth-child(4) input'); }
  get input_Investment1_Line4() { return $('div.rt-tbody>div:nth-child(1)>div:nth-child(5) input'); }
  get input_Investment1_Line5() { return $('div.rt-tbody>div:nth-child(1)>div:nth-child(6) input'); }

  get input_Investment2_Line1() { return $('div.rt-tbody>div:nth-child(2)>div:nth-child(2) input'); }
  get input_Investment2_Line2() { return $('div.rt-tbody>div:nth-child(2)>div:nth-child(3) input'); }
  get input_Investment2_Line3() { return $('div.rt-tbody>div:nth-child(2)>div:nth-child(4) input'); }
  get input_Investment2_Line5() { return $('div.rt-tbody>div:nth-child(2)>div:nth-child(6) input'); }

  get button_Process() { return $('button=Process'); }
  get button_ConfirmProcess() { return $('div.modal-body button:nth-child(3)'); }

  get circleLoader_ProcessComplete() { return $('.circle-loader.load-complete'); }

  get text_WarningText() { return $('div.CompactWarningText'); }

  async prepareTestDataForCGTHealthCheck(entityData) {
    console.log(`Logging in to firm ${context.TestConfig.firm}`);
    await browser.call(() => firmUtil.login(context.TestConfig.firm));

    console.log('Deleting existing entity for this test');
    await browser.call(() => firmUtil.deleteEntities(entityData.entityCode));

    console.log('Migrating entity for this test');
    await browser.call(() => migrationUtil.migrateEntity(entityData.entityCode,
      entityData.migrationFolderPath, entityData.migrationOptions));
  }
}

export const cgtRegisterPage = new CgtRegisterPage();


