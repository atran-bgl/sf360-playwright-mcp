/**
 * SF360 Menu Explorer
 * Logs in, creates a fund, and systematically explores all menu pages
 * to document which pages require fund/member
 */

require('dotenv').config();
const { chromium } = require('playwright');
const setupTest = require('./templates/helpers/auth');
const fs = require('fs');
const path = require('path');

async function exploreAllPages() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SF360 Menu Explorer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let browser;
  const discoveries = [];

  try {
    // Launch browser
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Step 1: Login and create fund (skip member for now)
    console.log('\n━━━ Step 1: Login & Create Test Data ━━━\n');
    const ctx = await setupTest(page, {
      firm: process.env.FIRM,
      fund: 'create',      // Create fund
      member: 'skip',      // Skip member (can create manually if needed)
      verbose: true
    });

    console.log('\n✓ Setup complete');
    console.log(`  Fund: ${ctx.fundName} (ID: ${ctx.fundId})`);
    console.log(`  Member: ${ctx.memberName} (Code: ${ctx.memberCode})`);

    // Save cookies and context for Playwright MCP
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const explorationContext = {
      baseUrl: ctx.baseUrl,
      firm: ctx.firm,
      uid: ctx.uid,
      fundId: ctx.fundId,
      fundName: ctx.fundName,
      memberId: ctx.memberId,
      memberName: ctx.memberName,
      memberCode: ctx.memberCode,
      cookies: await context.cookies(),  // Get all Playwright cookies
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    };

    fs.writeFileSync(path.join(tmpDir, 'exploration-context.json'), JSON.stringify(explorationContext, null, 2));
    console.log('✓ Saved cookies and context to: tmp/exploration-context.json');
    console.log(`  Valid until: ${explorationContext.expiresAt}`);

    // Step 2: Navigate to fund selection page
    console.log('\n━━━ Step 2: Navigate to Fund List ━━━\n');
    await page.goto(`${ctx.baseUrl}/s/entity/fundlist/?firm=${ctx.firm}&uid=${ctx.uid}`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of fund list
    await page.screenshot({ path: 'exploration-1-fundlist.png' });
    console.log('✓ Screenshot: exploration-1-fundlist.png');

    // Step 3: Select the fund we created
    console.log('\n━━━ Step 3: Select Fund ━━━\n');

    // Click on the fund row to select it
    try {
      await page.click(`text=${ctx.fundName}`);
      await page.waitForTimeout(2000);
      console.log(`✓ Selected fund: ${ctx.fundName}`);
    } catch (error) {
      console.log('⚠️  Could not auto-select fund, continuing...');
    }

    // Step 4: Get menu structure
    console.log('\n━━━ Step 4: Explore Menu Structure ━━━\n');
    console.log('Waiting for menu to load...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot of menu
    await page.screenshot({ path: 'exploration-2-menu.png', fullPage: true });
    console.log('✓ Screenshot: exploration-2-menu.png');

    // Get the accessibility tree to find menu items
    console.log('\nExtracting menu structure...');
    try {
      const snapshot = await page.accessibility.snapshot();
      fs.writeFileSync('menu-snapshot.json', JSON.stringify(snapshot, null, 2));
      console.log('✓ Saved menu structure: menu-snapshot.json');
    } catch (error) {
      console.log('⚠️  Could not extract accessibility snapshot:', error.message);
    }

    // Step 5: Manual exploration prompt
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Browser is ready for manual exploration!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Instructions:');
    console.log('  1. The browser window is open with a fund selected');
    console.log('  2. Manually click through each menu item');
    console.log('  3. Note the URL for each page');
    console.log('  4. Press Ctrl+C when done exploring\n');
    console.log('Fund Details:');
    console.log(`  Fund Name: ${ctx.fundName}`);
    console.log(`  Fund ID: ${ctx.fundId}`);
    console.log(`  Member Name: ${ctx.memberName}`);
    console.log(`  Member Code: ${ctx.memberCode}`);
    console.log(`  Member ID: ${ctx.memberId}\n`);

    // Keep browser open indefinitely
    await page.waitForTimeout(1000000);

  } catch (error) {
    console.error('\n❌ Exploration Failed!\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run exploration
exploreAllPages().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
