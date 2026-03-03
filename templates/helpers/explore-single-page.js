/**
 * SF360 Single Page Explorer
 * Authenticates, navigates to specific page, captures elements for test generation
 *
 * Usage: node templates/helpers/explore-single-page.js --page=<page_key> [--reuse-session]
 * Example: node templates/helpers/explore-single-page.js --page=member_dashboard
 * Example: node templates/helpers/explore-single-page.js --page=member_dashboard --reuse-session
 */

require('dotenv').config();
const { chromium } = require('playwright');
const setupTest = require('./auth');
const fs = require('fs');
const path = require('path');

/**
 * Validate if existing session can be reused for this page
 */
function validateExistingSession(sessionPath, pageInfo) {
  // Check if session file exists
  if (!fs.existsSync(sessionPath)) {
    return { valid: false, reason: 'Session file not found' };
  }

  let session;
  try {
    session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  } catch (error) {
    return { valid: false, reason: 'Failed to parse session file' };
  }

  // Check if session has expired
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  if (now >= expiresAt) {
    return { valid: false, reason: 'Session expired' };
  }

  // Session is valid if cookies haven't expired
  // setupTest will create fund/member if needed

  // Calculate remaining time
  const remainingMs = expiresAt - now;
  const remainingMin = Math.floor(remainingMs / 60000);

  return {
    valid: true,
    session: session,
    remainingMinutes: remainingMin
  };
}

async function exploreSinglePage(pageKey, options = {}) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SF360 Single Page Explorer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Read menu mapping to get page requirements
  const mappingPath = path.join(__dirname, '../config/menu-mapping.json');
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  const pageInfo = findPageInMapping(mapping, pageKey);

  if (!pageInfo) {
    console.error(`❌ Page key "${pageKey}" not found in menu-mapping.json`);
    console.error('\nAvailable pages:');
    listAvailablePages(mapping);
    process.exit(1);
  }

  console.log(`🔍 Exploring: ${pageInfo.name}`);
  console.log(`   Section: ${pageInfo.section}`);
  console.log(`   URL: ${pageInfo.url}`);
  console.log(`   Requires Fund: ${pageInfo.requiresFund}`);
  console.log(`   Requires Member: ${pageInfo.requiresMember}\n`);

  // Check for existing session if --reuse-session flag is set
  const tmpDir = path.join(process.cwd(), 'tmp');
  const sessionPath = path.join(tmpDir, 'exploration-context.json');
  let ctx = null;
  let sessionReused = false;

  if (options.reuseSession) {
    console.log('━━━ Step 1: Checking Existing Session ━━━\n');
    const validation = validateExistingSession(sessionPath, pageInfo);

    if (validation.valid) {
      console.log('✓ Valid session found');
      console.log(`  Remaining time: ${validation.remainingMinutes} minutes`);
      if (validation.session.fundId) {
        console.log(`  Fund: ${validation.session.fundName} (${validation.session.fundId})`);
      }
      if (validation.session.memberId) {
        console.log(`  Member: ${validation.session.memberName} (${validation.session.memberCode})`);
      }
      console.log('\n✓ Reusing existing session (skipping authentication)\n');
      ctx = validation.session;
      sessionReused = true;
    } else {
      console.log(`⚠️  Cannot reuse session: ${validation.reason}`);
      console.log('   Creating new session...\n');
    }
  }

  let browser;
  try {
    // 2. Launch browser
    const stepNum = sessionReused ? 2 : 1;
    console.log(`━━━ Step ${stepNum}: Launching Browser ━━━\n`);
    browser = await chromium.launch({
      headless: false,  // Visible for debugging
      slowMo: 100       // Slow down for visibility
    });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // 3. Authenticate or restore session
    const authStepNum = stepNum + 1;
    console.log(`━━━ Step ${authStepNum}: ${sessionReused ? 'Restoring Session & Setup' : 'Authenticating'} ━━━\n`);

    if (sessionReused) {
      // Restore cookies to browser context
      await context.addCookies(ctx.cookies);
      console.log(`✓ Restored ${ctx.cookies.length} cookies to browser`);

      // Also restore cookies to authContext for API calls
      const authContext = require('./auth-context');
      const { Cookie } = require('tough-cookie');
      const toughCookies = ctx.cookies.map(pc => {
        const cookieStr = `${pc.name}=${pc.value}; Domain=${pc.domain}; Path=${pc.path || '/'}` +
          (pc.httpOnly ? '; HttpOnly' : '') +
          (pc.secure ? '; Secure' : '') +
          (pc.sameSite ? `; SameSite=${pc.sameSite}` : '');
        try {
          const cookie = Cookie.parse(cookieStr);
          if (cookie) {
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
          console.log(`⚠️  Failed to parse cookie ${pc.name}`);
        }
        return null;
      }).filter(Boolean);
      authContext.setCookies(toughCookies);
      console.log(`✓ Restored cookies to authContext for API calls`);

      // Use setupTest with existing context - it will only create fund/member if page requires them
      ctx = await setupTest(page, {
        firm: ctx.firm,
        fund: pageInfo.requiresFund ? 'create' : 'skip',
        member: pageInfo.requiresMember ? 'create' : 'skip',
        existingContext: ctx,
        verbose: true
      });
    } else {
      // Full authentication flow
      ctx = await setupTest(page, {
        firm: process.env.FIRM,
        fund: pageInfo.requiresFund ? 'create' : 'skip',
        member: pageInfo.requiresMember ? 'create' : 'skip',
        verbose: true
      });
    }

    console.log('\n✓ Setup complete');
    if (ctx.fundId) {
      console.log(`  Fund: ${ctx.fundName} (${ctx.fundId})`);
    }
    if (ctx.memberId) {
      console.log(`  Member: ${ctx.memberName} (${ctx.memberCode})`);
    }

    // 4. Save/update session to tmp/
    const saveStepNum = authStepNum + 1;
    console.log(`\n━━━ Step ${saveStepNum}: Saving Session ━━━\n`);
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
      cookies: await context.cookies(),
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    };

    fs.writeFileSync(sessionPath, JSON.stringify(explorationContext, null, 2));
    console.log(`✓ Session saved to: tmp/exploration-context.json`);
    console.log(`  Valid until: ${explorationContext.expiresAt}`);

    // Navigate to target page
    const navStepNum = sessionReused ? 4 : 5;
    console.log(`\n━━━ Step ${navStepNum}: Navigating to Page ━━━\n`);
    const url = buildPageUrl(pageInfo.url, ctx);
    console.log(`  URL: ${url}`);
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded');

    // Create organized output directory
    const discoveryDir = path.join(process.cwd(), '.playwright-mcp', 'discoveries', pageKey);
    if (!fs.existsSync(discoveryDir)) {
      fs.mkdirSync(discoveryDir, { recursive: true });
    }

    // Create screenshot subfolder
    const screenshotDir = path.join(discoveryDir, 'screenshot');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Capture screenshot
    const screenshotStepNum = navStepNum + 1;
    console.log(`\n━━━ Step ${screenshotStepNum}: Capturing Screenshot ━━━\n`);
    const screenshotPath = path.join(screenshotDir, 'main.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`✓ Screenshot saved: .playwright-mcp/discoveries/${pageKey}/screenshot/main.png`);

    // Capture accessibility snapshot
    const snapshotStepNum = screenshotStepNum + 1;
    console.log(`\n━━━ Step ${snapshotStepNum}: Capturing Element Snapshot ━━━\n`);
    const snapshotPath = path.join(discoveryDir, 'snapshot.json');

    let snapshot = null;
    try {
      if (page.accessibility && typeof page.accessibility.snapshot === 'function') {
        snapshot = await page.accessibility.snapshot();
      }
    } catch (error) {
      console.log(`⚠️  Accessibility snapshot failed: ${error.message}`);
    }

    if (snapshot) {
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
      console.log(`✓ Snapshot saved: .playwright-mcp/discoveries/${pageKey}/snapshot.json`);
    } else {
      console.log('⚠️  No accessibility snapshot available for this page');
      // Save empty object so file exists
      fs.writeFileSync(snapshotPath, JSON.stringify({ warning: 'No accessibility tree available', pageUrl: url }, null, 2));
    }

    // 9. Save page metadata
    const metadataPath = path.join(discoveryDir, 'metadata.json');
    const metadata = {
      pageKey: pageKey,
      pageName: pageInfo.name,
      pageUrl: pageInfo.url,
      fullUrl: url,
      section: pageInfo.section,
      requiresFund: pageInfo.requiresFund,
      requiresMember: pageInfo.requiresMember,
      discoveredAt: new Date().toISOString(),
      testData: {
        fundId: ctx.fundId,
        fundName: ctx.fundName,
        memberId: ctx.memberId,
        memberName: ctx.memberName,
        memberCode: ctx.memberCode
      }
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`✓ Metadata saved: .playwright-mcp/discoveries/${pageKey}/metadata.json`);

    // Output summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Page Discovery Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Session:');
    console.log(`  tmp/exploration-context.json ${sessionReused ? '(reused)' : '(created)'}`);
    console.log('\nDiscovery Outputs:');
    console.log(`  .playwright-mcp/discoveries/${pageKey}/`);
    console.log(`    ├── screenshot/`);
    console.log(`    │   └── main.png`);
    console.log(`    ├── snapshot.json`);
    console.log(`    └── metadata.json`);
    console.log('\nNext Steps:');
    console.log('  1. Use MCP Playwright to analyze snapshot.json');
    console.log('  2. Generate element inventory (elements.json)');
    console.log('  3. Create test file using "generate-test" MCP tool');
    if (!sessionReused) {
      console.log('\nTip: Use --reuse-session flag to speed up discovery of multiple pages');
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Page Exploration Failed!\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Find page definition in menu mapping
 */
function findPageInMapping(mapping, pageKey) {
  for (const section in mapping) {
    if (section === '_comment') continue;
    if (mapping[section][pageKey]) {
      return mapping[section][pageKey];
    }
  }
  return null;
}

/**
 * List all available page keys
 */
function listAvailablePages(mapping) {
  const pages = [];
  for (const section in mapping) {
    if (section === '_comment') continue;
    for (const pageKey in mapping[section]) {
      const page = mapping[section][pageKey];
      pages.push({
        key: pageKey,
        name: page.name,
        section: page.section
      });
    }
  }

  // Group by section
  const grouped = {};
  pages.forEach(p => {
    if (!grouped[p.section]) grouped[p.section] = [];
    grouped[p.section].push(p);
  });

  // Print organized list
  for (const section in grouped) {
    console.log(`\n  ${section}:`);
    grouped[section].forEach(p => {
      console.log(`    ${p.key.padEnd(35)} - ${p.name}`);
    });
  }
  console.log('');
}

/**
 * Build full page URL with query parameters
 */
function buildPageUrl(url, ctx) {
  let fullUrl = `${ctx.baseUrl}${url}`;

  // Build query params
  const params = new URLSearchParams({
    firm: ctx.firm,
    uid: ctx.uid
  });

  if (ctx.fundId) {
    params.append('mid', ctx.fundId);
  }

  // Check if URL already has query params
  if (fullUrl.includes('?')) {
    return `${fullUrl}&${params.toString()}`;
  } else {
    return `${fullUrl}?${params.toString()}`;
  }
}

// Parse command line args
const args = process.argv.slice(2);
const pageKeyArg = args.find(arg => arg.startsWith('--page='));
const reuseSession = args.includes('--reuse-session');

// Handle --list flag
if (args.includes('--list')) {
  const mappingPath = path.join(__dirname, '../config/menu-mapping.json');
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  console.log('\n📋 Available Pages:');
  listAvailablePages(mapping);
  process.exit(0);
}

if (!pageKeyArg) {
  console.error('\n❌ Missing required argument\n');
  console.error('Usage: node templates/helpers/explore-single-page.js --page=<page_key> [--reuse-session]');
  console.error('Example: node templates/helpers/explore-single-page.js --page=member_dashboard\n');
  console.error('Options:');
  console.error('  --reuse-session  Reuse existing session if valid (skips authentication)\n');
  console.error('Run with --list to see all available pages:\n');
  console.error('  node templates/helpers/explore-single-page.js --list\n');
  process.exit(1);
}

const pageKey = pageKeyArg.split('=')[1];

// Run exploration
exploreSinglePage(pageKey, { reuseSession }).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
