/**
 * SF360 Page Discovery Test
 *
 * Logs into SF360, navigates to specified page, and captures elements for documentation.
 *
 * Usage:
 *   npx playwright test discover-page -- --page-key=settings.badges
 */

const { test } = require('../fixtures/sf360');
const fs = require('fs');
const path = require('path');

// Get page key from command line argument
const pageKeyArg = process.argv.find(arg => arg.startsWith('--page-key='));
const PAGE_KEY = pageKeyArg ? pageKeyArg.split('=')[1] : 'settings.badges';

// Configure fixture to use the specified page key
test.use({ sf360PageKey: PAGE_KEY });

test(`discover ${PAGE_KEY}`, async ({ page, sf360 }) => {
  console.log(`\n🔍 Discovering page: ${PAGE_KEY}\n`);
  console.log(`✓ Authenticated as ${sf360.firm} (UID: ${sf360.uid})\n`);

  if (sf360.fundId) {
    console.log(`✓ Fund created: ${sf360.fundName} (ID: ${sf360.fundId})\n`);
  }

  if (sf360.memberId) {
    console.log(`✓ Member created: ${sf360.memberName} (Code: ${sf360.memberCode})\n`);
  }

  // Step 3: Wait for page to stabilize
  console.log('→ Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  console.log('✓ Page loaded\n');

  // Step 4: Get current URL
  const currentUrl = page.url();
  console.log(`→ Current URL: ${currentUrl}\n`);

  // Step 5: Take screenshot
  const screenshotDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const screenshotPath = `screenshots/${PAGE_KEY}-discovery.png`;
  console.log(`→ Taking screenshot: ${screenshotPath}...`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });
  console.log('✓ Screenshot saved\n');

  // Step 6: Get accessibility snapshot
  console.log('→ Capturing accessibility tree...');
  const snapshot = await page.accessibility.snapshot();
  console.log('✓ Accessibility tree captured\n');

  // Step 7: Output snapshot as JSON
  console.log('=== ACCESSIBILITY SNAPSHOT ===');
  console.log(JSON.stringify(snapshot, null, 2));
  console.log('=== END SNAPSHOT ===\n');

  // Step 8: Get page title
  const title = await page.title();
  console.log(`→ Page title: ${title}\n`);

  // Summary
  console.log('✅ Discovery complete!');
  console.log(`   Page Key: ${PAGE_KEY}`);
  console.log(`   URL: ${currentUrl}`);
  console.log(`   Screenshot: ${screenshotPath}`);
  console.log(`   Title: ${title}`);
  console.log('\n💡 Parse the accessibility snapshot above to extract elements.');
});
