import { context } from '../data/context.js';
import * as sfFirmUtil from '../lib/firm-util.js';

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.button_DoNotShowThisAgain = page.getByRole('button', { name: 'Don\'t show this again' })
    this.button_ENTITYSETUP = page.getByRole('link', { name: /^ENTITY SETUP$/ });
    this.heading_EntitySetup = page.getByRole('heading', { name: "Entity Setup" });
  }
  // API get cookies
  async login_api(firm) {
    console.log(`login to ${context.TestConfig.environment} - ${firm}`);

    const rawCookies = await sfFirmUtil.login(firm);
    const formattedCookies = rawCookies.map(({ key, expires, sameSite, ...rest }) => {
      const cookie = {
        name: key,
        ...rest,
      };
      // Add expires only if valid number and not Infinity
      if (typeof expires === 'number' && isFinite(expires)) {
        cookie.expires = expires;
      }
      // Normalize sameSite value if valid
      if (typeof sameSite === 'string') {
        const normalizedSameSite = sameSite.charAt(0).toUpperCase() + sameSite.slice(1).toLowerCase();
        if (['Strict', 'Lax', 'None'].includes(normalizedSameSite)) {
          cookie.sameSite = normalizedSameSite;
        }
      }
      return cookie;
    });

    await this.page.context().addCookies(formattedCookies);
    await this.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Home_Entity_workflow}?firm=${firm}&uid=${context.TestConfig.uid}`)
    // await page.pause();
    try {
      await this.button_DoNotShowThisAgain.waitFor({ state: 'visible', timeout: 5000 });
      await this.button_DoNotShowThisAgain.click();
    } catch (err) {
      // no new features splash page do nothing
    }
  }
}
