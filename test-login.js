/**
 * Test Script: SF360 Login Verification
 *
 * This script tests the authentication helpers by:
 * 1. Fetching AWS Parameter Store configuration
 * 2. Authenticating with Cognito (JWT)
 * 3. Logging into SSO
 * 4. Injecting cookies into Playwright
 * 5. Navigating to SF360
 * 6. Taking a screenshot as proof
 *
 * Usage:
 *   node test-login.js
 *
 * Prerequisites:
 *   - .env file with credentials (ENVIRONMENT, USERNAME, USER_PASSWORD, TOTP_SECRET, UID, FIRM)
 *   - AWS CLI configured (aws configure)
 *   - npm install @playwright/test
 */

require('dotenv').config();
const { chromium } = require('playwright');
const setupTest = require('./templates/helpers/auth');

async function testLogin() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SF360 Login Test (API-based authentication)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const startTime = Date.now();
  let browser;

  try {
    // Check .env
    if (!process.env.FIRM) {
      throw new Error('FIRM not found in .env. Please create .env file with credentials.');
    }

    console.log(`Environment: ${process.env.ENVIRONMENT || 'uat'}`);
    console.log(`Firm: ${process.env.FIRM}`);
    console.log(`Username: ${process.env.USERNAME}\n`);

    // Launch browser
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // Test setupTest() with verbose output
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const ctx = await setupTest(page, {
      firm: process.env.FIRM,
      pageKey: 'home.entity_selection',  // Navigate to entity selection page
      verbose: true
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Wait a bit for page to load
    console.log('Waiting for page to stabilize...');
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotPath = 'test-login-proof.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✓ Screenshot saved: ${screenshotPath}\n`);

    // Show results
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Login Test Successful!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Results:');
    console.log(`  Total Time: ${totalTime}s`);
    console.log(`  Base URL: ${ctx.baseUrl}`);
    console.log(`  Firm: ${ctx.firm}`);
    console.log(`  UID: ${ctx.uid}`);
    console.log(`  Current URL: ${page.url()}\n`);

    console.log('Context returned by setupTest():');
    console.log(JSON.stringify(ctx, null, 2));
    console.log('\n');

    // Keep browser open for 5 seconds so you can see it
    console.log('Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Login Test Failed!\n');
    console.error('Error:', error.message);

    if (error.message.includes('AWS')) {
      console.error('\nAWS Configuration Issue:');
      console.error('  1. Run: aws configure');
      console.error('  2. Ensure you have SSM:GetParameters permission');
      console.error('  3. Verify access to BGL AWS account (ap-southeast-2)\n');
    } else if (error.message.includes('.env')) {
      console.error('\nEnvironment Configuration Issue:');
      console.error('  1. Create .env file in project root');
      console.error('  2. Required fields: ENVIRONMENT, USERNAME, USER_PASSWORD, TOTP_SECRET, UID, FIRM');
      console.error('  3. Copy from templates/.env.template\n');
    } else if (error.message.includes('Cognito')) {
      console.error('\nCognito Authentication Issue:');
      console.error('  1. Verify USERNAME and USER_PASSWORD are correct');
      console.error('  2. Verify TOTP_SECRET is correct (base32 encoded)');
      console.error('  3. Check if user account is active\n');
    }

    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the test
testLogin().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
