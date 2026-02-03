---
status: active
domain: mcp-server
implementation-status: NOT-STARTED
impediment: none
---

# Spec: MCP Tool Integration for setupTest()

**Feature:** Expose setupTest() usage in MCP tool prompts
**Priority:** High
**Estimated Complexity:** Low

---

## Overview

Update MCP tool prompts to instruct Claude to use `setupTest()` correctly when generating tests. Claude needs to understand when to create funds vs skip them.

---

## Affected MCP Tools

### 1. generate-test Tool

**Purpose:** Generate Playwright test from natural language specification

**Changes Needed:**
- Add setupTest() import statement
- Show usage with pageKey auto-detection
- Show usage with explicit fund: 'create' / 'skip'
- Explain when to use each approach

---

### 2. discover-page Tool

**Purpose:** Discover page elements for test generation

**Changes Needed:**
- Update discover-page.test.js to use setupTest()
- Auto-detect fund requirement from pageKey
- Ensure discovery runs with proper context

---

## MCP Tool: generate-test

### Updated Tool Description

```javascript
{
  name: 'generate-test',
  description:
    'Generate a complete Playwright test from natural language specification. ' +
    'Includes automatic login setup with smart fund/member creation based on page requirements.',
  inputSchema: {
    type: 'object',
    properties: {
      spec: {
        type: 'string',
        description: 'Natural language test specification describing what to test',
      },
      pageName: {
        type: 'string',
        description: 'Optional: Target page key from menu-mapping.json (e.g., "fund.members")',
      },
      testName: {
        type: 'string',
        description: 'Name for the generated test file (without extension)',
      },
    },
    required: ['spec', 'testName'],
  },
}
```

---

## Updated generate-test-prompt.md

### Key Sections to Add

#### Section 1: Understanding Page Requirements

```markdown
## Step 1: Determine Page Requirements

Check `sf360-playwright/config/menu-mapping.json` to understand page requirements:

```json
{
  "settings": {
    "badges": {
      "requiresFund": false,    // ← Firm-level page
      "requiresMember": false
    }
  },
  "fund": {
    "members": {
      "requiresFund": true,     // ← Fund-level page
      "requiresMember": false
    },
    "member_details": {
      "requiresFund": true,
      "requiresMember": true    // ← Member-level page
    }
  }
}
```

**Classification:**
- `requiresFund: false` → Firm-level test (no fund creation)
- `requiresFund: true, requiresMember: false` → Fund-level test (create fund)
- `requiresFund: true, requiresMember: true` → Member-level test (create fund + member)
```

#### Section 2: Test Structure with setupTest()

```markdown
## Step 2: Test Structure

### Template

```javascript
const { test, expect } = require('@playwright/test');
const { setupTest } = require('./helpers/auth');

test.describe('{{TEST_NAME}}', () => {
  test('should {{BEHAVIOR}}', async ({ page }) => {
    // Step 1: Setup (REQUIRED - always first)
    const ctx = await setupTest(page, {
      firm: process.env.FIRM,
      pageKey: '{{PAGE_KEY}}'  // Auto-detects requirements
    });

    // Step 2: Navigate to feature (if needed)
    // Page navigation may already be done by setupTest()

    // Step 3: Perform test actions
    // ... test implementation based on {{SPEC}} ...

    // Step 4: Assert results
    await expect(page.getByText('Expected Text')).toBeVisible();
  });
});
```

### Examples by Page Type

**Firm-Level Test (No Fund):**
```javascript
test('update firm badge settings', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    pageKey: 'settings.badges'  // requiresFund: false
  });
  // ctx = { baseUrl, firm, uid }
  // Already on badges page, no fund created

  await page.getByRole('button', { name: 'Create Badge' }).click();
  // ...
});
```

**Fund-Level Test (Auto-Create Fund):**
```javascript
test('add new member', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    pageKey: 'fund.members'  // requiresFund: true
  });
  // ctx = { baseUrl, firm, uid, fundId, fundName }
  // Fresh fund created, ready to add member

  await page.getByRole('button', { name: 'Add Member' }).click();
  // ...
});
```

**Member-Level Test (Auto-Create Fund + Member):**
```javascript
test('view member details', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    pageKey: 'fund.member_details'  // requiresMember: true
  });
  // ctx = { baseUrl, firm, uid, fundId, fundName, memberId, memberName }
  // Fund AND member created, on member details page

  await expect(page.getByText(ctx.memberName)).toBeVisible();
  // ...
});
```
```

#### Section 3: When User Doesn't Specify pageKey

```markdown
## Step 3: Handling Missing pageKey

If user spec doesn't mention a specific page, infer from test scenario:

**Scenario mentions...**
- "firm settings", "badges", "users" → Firm-level (no fund)
- "members", "transactions", "banking" → Fund-level (create fund)
- "member details", "member transactions" → Member-level (create fund + member)

**If uncertain:**
- Default to fund creation for safety: `fund: 'create'`
- Add comment explaining why

**Example:**
```javascript
test('test generic feature', async ({ page }) => {
  // Creating fund for safety (page requirements unclear)
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    fund: 'create'  // Explicit fund creation
  });
  // ...
});
```
```

#### Section 4: Using Context in Tests

```markdown
## Step 4: Using Setup Context

The `ctx` object contains useful information:

```javascript
const ctx = await setupTest(page, { /* ... */ });

// Always available:
ctx.baseUrl   // "https://sf360.uat.bgl360.com.au"
ctx.firm      // "tinabgl"
ctx.uid       // 1234

// Available if fund created:
ctx.fundId    // "8a8bc49f889413c40188942462720056"
ctx.fundName  // "AutoTest SMSF 1738053600000"

// Available if member created:
ctx.memberId   // "8a8bc49f889413c40188942462720099"
ctx.memberName // "Test Member1738053600000"
```

**Usage in assertions:**
```javascript
// Verify fund name appears
await expect(page.getByText(ctx.fundName)).toBeVisible();

// Verify member details page URL
expect(page.url()).toContain(`fundId=${ctx.fundId}`);
expect(page.url()).toContain(`memberId=${ctx.memberId}`);
```
```

---

## MCP Tool: discover-page

### Updated discover-page-prompt.md

#### Section: Run Discovery Test

```markdown
### 2. Run Discovery Test

The discovery test at `sf360-playwright/tests/discover-page.test.js` automatically:
- Authenticates using setupTest()
- **Auto-detects fund requirement** from pageKey
- Navigates to target page with proper context
- Captures screenshot
- Outputs accessibility snapshot

**Run the discovery test:**

```bash
PAGE_KEY={{PAGE_KEY}} npx playwright test discover-page
```

**What happens internally:**
```javascript
// discover-page.test.js uses setupTest()
const ctx = await setupTest(page, {
  firm: process.env.FIRM,
  pageKey: process.env.PAGE_KEY  // Auto-detects from menu-mapping
});

// If pageKey requires fund:
//   → Fund created automatically
//   → Navigate to /s/[page]/?firm=X&uid=Y&fundId=Z

// If pageKey doesn't require fund:
//   → No fund created
//   → Navigate to /s/[page]/?firm=X&uid=Y
```

**Output:**
- Screenshot: `screenshots/{{PAGE_KEY}}-discovery.png`
- Console: Accessibility snapshot JSON
- Fund created: Yes/No (logged in output)
```

---

## discover-page.test.js Implementation

### Updated Test File

```javascript
const { test } = require('@playwright/test');
const { setupTest } = require('./helpers/auth');
const fs = require('fs');
const path = require('path');

test('discover page elements', async ({ page }) => {
  const pageKey = process.env.PAGE_KEY || 'home.insights_dashboard';

  console.log(`\n━━━ Discovering Page: ${pageKey} ━━━\n`);

  // Smart setup with auto-detection
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    pageKey: pageKey,  // Auto-detects fund/member requirements
    verbose: true
  });

  // Load page config
  const menuMapping = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'config', 'menu-mapping.json'), 'utf8')
  );

  const keys = pageKey.split('.');
  let pageConfig = menuMapping;
  for (const key of keys) {
    pageConfig = pageConfig[key];
  }

  if (!pageConfig) {
    throw new Error(`Page key '${pageKey}' not found in menu-mapping.json`);
  }

  // Navigate to target page (may already be there from setupTest)
  const currentUrl = new URL(page.url());
  const targetPath = pageConfig.url;

  if (!currentUrl.pathname.includes(targetPath)) {
    let pageUrl;
    if (pageConfig.external) {
      pageUrl = pageConfig.url;
    } else {
      pageUrl = `${ctx.baseUrl}${targetPath}?firm=${ctx.firm}&uid=${ctx.uid}`;
      if (ctx.fundId) pageUrl += `&fundId=${ctx.fundId}`;
      if (ctx.memberId) pageUrl += `&memberId=${ctx.memberId}`;
    }

    console.log(`Navigating to: ${pageUrl}`);
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');
  }

  // Capture screenshot
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const screenshotPath = path.join(screenshotDir, `${pageKey}-discovery.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`\n✓ Screenshot saved: ${screenshotPath}`);

  // Capture accessibility snapshot
  console.log('\n━━━ Accessibility Snapshot ━━━\n');
  const snapshot = await page.accessibility.snapshot();
  console.log(JSON.stringify(snapshot, null, 2));

  // Output summary
  console.log('\n━━━ Discovery Complete ━━━');
  console.log(`Page: ${pageConfig.name}`);
  console.log(`Screenshot: ${screenshotPath}`);
  if (ctx.fundId) console.log(`Fund: ${ctx.fundName} (${ctx.fundId})`);
  if (ctx.memberId) console.log(`Member: ${ctx.memberName} (${ctx.memberId})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
```

---

## Prompt Variable Injection

### generate-test Tool Handler

```javascript
case 'generate-test':
  prompt = loadPrompt('generate-test-prompt.md');
  prompt = prompt
    .replace(/\{\{SPEC\}\}/g, String(args.spec || ''))
    .replace(/\{\{PAGE_NAME\}\}/g, String(args.pageName || 'auto-detect'))
    .replace(/\{\{TEST_NAME\}\}/g, String(args.testName || 'generated-test'));
  break;
```

### discover-page Tool Handler

```javascript
case 'discover-page':
  prompt = loadPrompt('discover-page-prompt.md');
  prompt = prompt
    .replace(/\{\{PAGE_KEY\}\}/g, String(args.pageKey || ''))
    .replace(/\{\{OUTPUT_FILE\}\}/g, String(args.outputFile || 'auto-generated'));
  break;
```

---

## Acceptance Criteria

### generate-test Tool
- [ ] Prompt explains requiresFund/requiresMember flags
- [ ] Prompt shows setupTest() usage with pageKey
- [ ] Prompt shows explicit fund: 'create'/'skip' options
- [ ] Prompt provides examples for each page type
- [ ] Prompt explains how to use ctx object
- [ ] Generated tests include setupTest() call
- [ ] Generated tests pass pageKey when available

### discover-page Tool
- [ ] discover-page.test.js uses setupTest()
- [ ] Test auto-detects requirements from pageKey
- [ ] Test logs fund/member creation status
- [ ] Prompt explains automatic fund creation
- [ ] Discovery works for firm-level pages (no fund)
- [ ] Discovery works for fund-level pages (with fund)
- [ ] Discovery works for member-level pages (with fund + member)

---

## Dependencies

- Spec: `active.auth-setup-test-api.md` - setupTest() API
- File: `templates/prompts/generate-test-prompt.md` - Test generation prompt
- File: `templates/prompts/discover-page-prompt.md` - Discovery prompt
- File: `templates/tests/discover-page.test.js` - Discovery test
- File: `mcp-server/src/index.ts` - MCP tool handlers

---

## Related Files

- Prompts: `templates/prompts/*.md` - All MCP tool prompts
- Tests: `templates/tests/discover-page.test.js` - Discovery test
- MCP Server: `mcp-server/src/index.ts` - Tool definitions

---

## Notes

- Claude must understand menu-mapping.json structure
- Prompts should be clear and include many examples
- Default to fund creation if uncertain (safer for test isolation)
- Context object (ctx) is useful for assertions and debugging
