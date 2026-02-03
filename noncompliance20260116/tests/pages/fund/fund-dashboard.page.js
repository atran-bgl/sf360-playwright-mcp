import { assert } from '../../lib/util.js';
import Page from '../page.js';

class FundDashboardPage extends Page {
  get text_Title() { return $('.title'); }
  get text_FundName() { return $('h2.panelTitle'); }
  get link_Connections() { return $('.Connect>div>h3>a'); }
  get link_Investments() { return $('.Investments>div>h3>a'); }
  get text_SmartDocsEmail() { return $('.emailTrim'); }

  // Verify fund name
  async verifyFundName(expectedFundName) {
    await this.text_FundName.waitForDisplayed();
    assert.include(await this.text_FundName.getText(), expectedFundName);
  }
}

export const fundDashboardPage = new FundDashboardPage();
