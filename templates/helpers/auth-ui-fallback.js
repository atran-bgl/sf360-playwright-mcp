/**
 * SF360 UI-Based Login Fallback
 * For users without AWS Parameter Store access
 */

const { authenticator } = require('otplib');
const { Cookie } = require('tough-cookie');
const authContext = require('./auth-context');

/**
 * UI-based login fallback (for users without AWS access)
 * @param {Object} page - Playwright page object
 * @param {Object} options - Login options
 * @param {string} options.username - Username
 * @param {string} options.password - Password
 * @param {string} options.totpSecret - TOTP secret
 * @param {string} options.firm - Firm short name
 * @param {string} options.url - Login URL (from 360_UAT_URL)
 * @param {number} options.uid - User ID
 * @param {boolean} [options.verbose=false] - Enable verbose logging
 * @returns {Promise<Object>} Login context {baseUrl, firm, uid}
 */
async function loginUI(page, options) {
  const {
    username,
    password,
    totpSecret,
    firm,
    url,
    uid,
    verbose = false
  } = options;

  if (!url) {
    throw new Error('360_UAT_URL is required for UI-based login. Add it to your .env file.');
  }

  if (verbose) {
    console.log('Using UI-based login (fallback mode)...');
    console.log(`URL: ${url}`);
    console.log(`Username: ${username}`);
  }

  // Navigate to login page
  await page.goto(url);
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);

  // Submit login form - click and wait for 2FA page to appear
  await page.getByTestId('submit-button').click();

  // Wait for 2FA page by checking for specific elements (more reliable than waitForNavigation)
  await page.waitForSelector('input[placeholder*="Security Code"]', { timeout: 30000 });

  if (verbose) console.log('✓ Navigated to 2FA page');

  // Generate and enter TOTP code
  if (totpSecret) {
    const totpCode = authenticator.generate(totpSecret);

    if (totpCode) {
      if (verbose) console.log(`Generated TOTP code: ${totpCode}`);

      // Find the TOTP input field
      const totpInput = page.locator('input[placeholder*="Security Code"]').first();
      await totpInput.fill(totpCode);

      // Submit TOTP form - wait for button to be visible and click
      const submitButton = page.locator('button:has-text("Submit")');
      await submitButton.waitFor({ state: 'visible', timeout: 5000 });

      // Wait a moment for the button to become enabled after filling the code
      await page.waitForTimeout(500);
      await submitButton.click();

      // Wait for post-login page (could be multiFirm, dashboard, or landing page)
      if (verbose) console.log('Waiting for post-login page...');
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Give extra time for any auto-redirects to complete
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️  otplib not installed. Please enter the OTP code manually in the browser.');
      // Wait for manual input
      await page.waitForNavigation({ timeout: 60000 });
    }
  } else {
    console.log('ℹ️  TOTP secret not provided. Please enter the code manually.');
    // Wait for manual input
    await page.waitForNavigation({ timeout: 60000 });
  }

  // Wait for firm selection page or dashboard
  await page.waitForLoadState('networkidle');

  // Check current URL and handle different post-login pages
  let currentUrl = page.url();
  if (verbose) console.log(`Post-login URL: ${currentUrl}`);

  // Handle multi-firm selection page
  if (currentUrl.includes('multiFirm')) {
    if (verbose) console.log(`Selecting firm: ${firm}...`);

    // Click on firm selector
    await page.getByRole('combobox', { name: 'Select Firm...' }).click();

    // Select the firm
    await page.getByRole('option', { name: firm }).click();

    // Click "Go to" button
    await page.getByRole('button', { name: /Go to/ }).click();

    // Wait for navigation to SF360 to complete
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(1000);

    currentUrl = page.url();
    if (verbose) console.log(`After firm selection: ${currentUrl}`);
  } else if (currentUrl.includes('sso.')) {
    // Still on SSO domain, may need manual navigation or redirect
    if (verbose) console.log('Still on SSO domain, checking for auto-redirect...');

    // Wait a bit more for auto-redirect
    await page.waitForTimeout(3000);
    currentUrl = page.url();

    if (verbose) console.log(`After waiting: ${currentUrl}`);
  }

  if (verbose) console.log('✓ UI-based login successful');

  // Extract firm and uid from the current URL after successful login
  const finalUrl = new URL(page.url());
  const finalParams = new URLSearchParams(finalUrl.search);

  // Determine base URL - should be SF360 domain, not SSO domain
  let baseUrl = `${finalUrl.protocol}//${finalUrl.host}`;

  // If still on SSO domain, derive SF360 URL from the SSO URL
  if (baseUrl.includes('sso.uat.bgl360.com.au')) {
    baseUrl = 'https://uat.sf360.com.au';
  } else if (baseUrl.includes('sso.bgl360.com.au')) {
    baseUrl = 'https://sf360.com.au';
  }

  const firmParam = finalParams.get('firm') || firm;
  const uidParam = finalParams.get('uid') || uid;

  if (verbose) console.log(`Final URL: ${page.url()}`);
  if (verbose) console.log(`Base URL: ${baseUrl}`);

  // CRITICAL: Extract cookies from Playwright and store in authContext
  // This makes cookies accessible to API calls (fund/member creation)
  // Same pattern as AWS authentication path
  const playwrightCookies = await page.context().cookies();

  if (verbose) {
    console.log(`Extracted ${playwrightCookies.length} cookies from browser:`);
    playwrightCookies.forEach(c => {
      console.log(`  - ${c.name} (domain: ${c.domain})`);
    });
  }

  // Convert Playwright cookies to tough-cookie format
  const toughCookies = playwrightCookies.map(pc => {
    const cookieStr = `${pc.name}=${pc.value}; Domain=${pc.domain}; Path=${pc.path || '/'}` +
      (pc.httpOnly ? '; HttpOnly' : '') +
      (pc.secure ? '; Secure' : '') +
      (pc.sameSite ? `; SameSite=${pc.sameSite}` : '');

    try {
      const cookie = Cookie.parse(cookieStr);
      if (cookie) {
        // Return in format compatible with authContext
        return {
          key: pc.name,
          value: pc.value,
          domain: pc.domain,
          path: pc.path || '/',
          httpOnly: pc.httpOnly,
          secure: pc.secure
        };
      }
    } catch (error) {
      if (verbose) console.log(`⚠️  Failed to parse cookie ${pc.name}: ${error.message}`);
    }
    return null;
  }).filter(Boolean);

  // Store in authContext for API calls (same as AWS path)
  authContext.setCookies(toughCookies);

  if (verbose) console.log(`✓ Stored ${toughCookies.length} cookies in authContext for API calls`);

  return {
    baseUrl,
    firm: firmParam,
    uid: uidParam ? parseInt(uidParam, 10) : uid
  };
}

module.exports = { loginUI };
