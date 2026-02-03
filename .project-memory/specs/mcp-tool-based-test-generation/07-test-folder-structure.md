# Test Folder Structure & Organization

## Purpose

Define how tests, plans, screenshots, and reports are organized when users generate many tests.

---

## Default Structure (Flat/Type-based)

**Recommended for initial implementation and projects with <30 tests.**

```
tests/
├── members-create.spec.js            ← Test files (all in root)
├── members-edit.spec.js
├── members-delete.spec.js
├── transactions-add.spec.js
├── transactions-edit.spec.js
├── dashboard-verify-widgets.spec.js
│
├── plans/                            ← All plan files grouped
│   ├── members-create-plan.json
│   ├── members-edit-plan.json
│   ├── members-delete-plan.json
│   ├── transactions-add-plan.json
│   ├── transactions-edit-plan.json
│   └── dashboard-verify-widgets-plan.json
│
├── screenshots/                      ← All screenshots grouped
│   ├── members-create-error-1738152600.png
│   ├── members-edit-error-1738152650.png
│   └── transactions-add-error-1738152700.png
│
├── reports/                          ← All reports grouped
│   ├── members-create-report.md
│   ├── members-edit-report.md
│   ├── transactions-add-report.md
│   └── dashboard-verify-widgets-report.md
│
├── helpers/                          ← Shared helpers
│   ├── auth.js                       ← Authentication (setupTest)
│   └── test-utils.js                 ← Shared utilities
│
├── config/
│   └── menu-mapping.json             ← Page metadata
│
└── playwright.config.js              ← Playwright configuration
```

**Benefits:**
- ✅ Simple to implement
- ✅ Easy to understand
- ✅ Standard Playwright pattern
- ✅ No complex auto-organization logic
- ✅ Works great for <30 tests

**Finding related files:**
Uses consistent naming: `{page}-{action}`
- Test: `members-create.spec.js`
- Plan: `plans/members-create-plan.json`
- Report: `reports/members-create-report.md`
- Screenshots: `screenshots/members-create-error-*.png`

---

## File Naming Conventions

### Test Files
```
{page}-{action}.spec.js

Examples:
- members-create.spec.js
- members-edit.spec.js
- transactions-add.spec.js
- dashboard-verify-widgets.spec.js
```

### Plan Files
```
{page}-{action}-plan.json

Examples:
- members-create-plan.json
- transactions-add-plan.json
```

### Screenshots
```
{page}-{action}-error-{timestamp}.png

Examples:
- members-create-error-1738152600000.png
- transactions-add-error-1738152650000.png
```

### Reports
```
{page}-{action}-report.md

Examples:
- members-create-report.md
- transactions-add-report.md
```

---

## Auto-Organization Logic

### In sf360-test-plan Tool

When user requests: **"Create test to add a new member"**

```javascript
// Parse request
const parsed = {
  targetPage: "members",         // From menu-mapping.json (fund.members)
  action: "create",
  testName: "members-create"     // Auto-generated: {page}-{action}
};

// Determine file paths (flat structure)
const testFile = `tests/${parsed.testName}.spec.js`;
const planFile = `tests/plans/${parsed.testName}-plan.json`;

// Create artifact directories if needed
fs.mkdirSync('tests/plans', { recursive: true });
fs.mkdirSync('tests/screenshots', { recursive: true });
fs.mkdirSync('tests/reports', { recursive: true });

// Save files
savePlan(planFile);

// Return paths for next phase
return {
  success: true,
  planFile: planFile,
  testName: parsed.testName,
  summary: { ... }
};
```

### File Path Pattern

All phases use consistent naming: `{page}-{action}`

**Phase 1 (test-plan):**
- Input: User request + optional testName
- Output: `tests/plans/{testName}-plan.json`
- Returns: `{ planFile: "tests/plans/members-create-plan.json" }`

**Phase 2 (test-generate):**
- Input: `planFile` from Phase 1
- Output: `tests/{testName}.spec.js`
- Returns: `{ testFile: "tests/members-create.spec.js", planFile: "..." }`

**Phase 3 (test-evaluate):**
- Input: `testFile` from Phase 2
- Reads: `planFile` from test file comments (optional)
- Output: Screenshots to `tests/screenshots/{testName}-error-{timestamp}.png`
- Returns: `{ result: "PASS", fixesApplied: [...], planFile: "..." }`

**Phase 4 (test-report):**
- Input: `testFile`, `planFile`, `evaluationResult`
- Output: `tests/reports/{testName}-report.md`
- Returns: `{ reportFile: "tests/reports/members-create-report.md" }`

### Folder Creation Order

1. **Create artifact folders once** (on first test generation)
   ```bash
   mkdir -p tests/plans
   mkdir -p tests/screenshots
   mkdir -p tests/reports
   ```

2. **Generate test name** from page + action: `members-create`

3. **Save plan file**: `tests/plans/members-create-plan.json`

4. **Save test file**: `tests/members-create.spec.js`

5. **Reference plan in test** (comment at top of test file):
   ```javascript
   // Test: members-create
   // Plan: tests/plans/members-create-plan.json
   // Generated: 2026-01-29
   ```

---

## Test Runner Scripts

### package.json

```json
{
  "name": "user-sf360-tests",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:headed": "playwright test --headed",

    "test:members": "playwright test --grep members",
    "test:transactions": "playwright test --grep transactions",
    "test:dashboard": "playwright test --grep dashboard",

    "test:report": "playwright show-report",
    "test:clean": "node scripts/clean-artifacts.js"
  }
}
```

### Usage

```bash
# Run all tests
npm test

# Run with UI mode (recommended for debugging)
npm run test:ui

# Run specific feature (uses --grep pattern matching)
npm run test:members           # Runs all tests matching "members"
npm run test:transactions      # Runs all tests matching "transactions"

# Run specific test by name
npm test -- members-create     # Runs members-create.spec.js

# Run with browser visible
npm run test:headed

# View last report
npm run test:report

# Clean old screenshots/reports
npm run test:clean
```

---

## Playwright Configuration

**File:** `playwright.config.js`

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',

  // Run tests in parallel
  fullyParallel: true,
  workers: 3,

  // Retry failed tests
  retries: 1,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'https://sf360.uat.bgl360.com.au',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Trace on first retry
    trace: 'on-first-retry',
  },

  // Project-specific settings
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
```

---

## Artifact Cleanup Script

**File:** `scripts/clean-artifacts.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DAYS_TO_KEEP = 7; // Keep artifacts for 7 days
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const cutoffTime = Date.now() - (DAYS_TO_KEEP * MS_PER_DAY);

function cleanOldFiles(dir, pattern = /./) {
  if (!fs.existsSync(dir)) return 0;

  let deletedCount = 0;

  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);

    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        traverse(filePath); // Recursive

        // Remove empty directories
        if (fs.readdirSync(filePath).length === 0) {
          fs.rmdirSync(filePath);
          console.log(`Removed empty dir: ${filePath}`);
        }
      } else if (pattern.test(file) && stats.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Deleted: ${filePath}`);
      }
    });
  }

  traverse(dir);
  return deletedCount;
}

console.log(`🧹 Cleaning artifacts older than ${DAYS_TO_KEEP} days...\n`);

let total = 0;

// Clean screenshots
console.log('Cleaning screenshots...');
total += cleanOldFiles('tests', /\.png$/);

// Clean old reports
console.log('\nCleaning reports...');
total += cleanOldFiles('tests', /-report\.md$/);

// Clean Playwright artifacts
console.log('\nCleaning Playwright traces/videos...');
if (fs.existsSync('test-results')) {
  total += cleanOldFiles('test-results');
}

console.log(`\n✅ Cleaned ${total} old files`);
```

**Usage:**
```bash
# Clean artifacts older than 7 days
npm run test:clean

# Or run directly
node scripts/clean-artifacts.js
```

---

## Test Helper Script

**File:** `scripts/run-test.js` (Optional - for custom test runner)

```javascript
#!/usr/bin/env node

const { spawn } = require('child_process');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
SF360 Test Runner

Usage:
  npm test                    # Run all tests
  npm test -- <test-name>     # Run specific test
  npm test -- <folder>/       # Run tests in folder
  npm test -- --ui            # Run with UI mode
  npm test -- --headed        # Run with browser visible
  npm test -- --debug         # Run in debug mode

Examples:
  npm test                           # All tests
  npm test -- members-create         # Specific test
  npm test -- members/               # All member tests
  npm test -- --grep "create"        # Tests matching pattern
  npm test -- members/ --headed      # With browser visible
  npm test -- --ui                   # UI mode
  `);
  process.exit(0);
}

// Build command
const command = ['npx', 'playwright', 'test', ...args];

// Run
const child = spawn(command[0], command.slice(1), {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('exit', (code) => {
  process.exit(code);
});
```

---

## Benefits of Flat Structure

### For Users

✅ **Simple to understand** - All tests in one place
✅ **Easy to find tests** - No nested folders
✅ **Standard Playwright pattern** - Familiar to most developers
✅ **Easy to run specific tests** - `npm test -- members-create`
✅ **Clean workspace** - Automated cleanup of old artifacts
✅ **Works great for <30 tests** - No premature complexity

### For Developers

✅ **Simple implementation** - No complex folder logic
✅ **Consistent naming** - `{page}-{action}` pattern for all files
✅ **Easy debugging** - Artifacts grouped by type
✅ **Version control friendly** - Clear diffs on test changes

---

## Future Enhancement: Page-based Structure

**For projects with 30+ tests**, consider page-based organization:

```
tests/
├── members/
│   ├── create.spec.js
│   ├── edit.spec.js
│   ├── plans/
│   ├── screenshots/
│   └── reports/
│
├── transactions/
│   ├── add.spec.js
│   ├── plans/
│   ├── screenshots/
│   └── reports/
│
└── helpers/
```

**Benefits:**
- Each feature has its own folder
- Easier to navigate with 50+ tests
- Artifacts grouped with related tests

**Migration script** (when users need it):

**File:** `scripts/migrate-to-page-based.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Migrating to page-based structure...\n');

// Read all test files
const tests = fs.readdirSync('tests').filter(f => f.endsWith('.spec.js'));

tests.forEach(testFile => {
  // Parse page name (e.g., "members-create.spec.js" → "members")
  const match = testFile.match(/^([^-]+)-/);
  if (!match) return;

  const page = match[1];
  const action = testFile.replace(`${page}-`, '').replace('.spec.js', '');
  const newDir = `tests/${page}`;

  // Create directories
  fs.mkdirSync(`${newDir}/plans`, { recursive: true });
  fs.mkdirSync(`${newDir}/screenshots`, { recursive: true });
  fs.mkdirSync(`${newDir}/reports`, { recursive: true });

  // Move test file (rename: members-create.spec.js → create.spec.js)
  fs.renameSync(`tests/${testFile}`, `${newDir}/${action}.spec.js`);
  console.log(`Moved: ${testFile} → ${page}/${action}.spec.js`);

  // Move related files
  const baseName = testFile.replace('.spec.js', '');

  // Move plan
  if (fs.existsSync(`tests/plans/${baseName}-plan.json`)) {
    fs.renameSync(
      `tests/plans/${baseName}-plan.json`,
      `${newDir}/plans/${action}-plan.json`
    );
  }

  // Move screenshots
  if (fs.existsSync('tests/screenshots')) {
    const screenshots = fs.readdirSync('tests/screenshots')
      .filter(f => f.startsWith(baseName));
    screenshots.forEach(screenshot => {
      fs.renameSync(
        `tests/screenshots/${screenshot}`,
        `${newDir}/screenshots/${screenshot.replace(baseName, action)}`
      );
    });
  }

  // Move reports
  if (fs.existsSync(`tests/reports/${baseName}-report.md`)) {
    fs.renameSync(
      `tests/reports/${baseName}-report.md`,
      `${newDir}/reports/${action}-report.md`
    );
  }
});

// Clean up old empty folders
['plans', 'screenshots', 'reports'].forEach(folder => {
  const dir = `tests/${folder}`;
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    console.log(`Removed empty folder: ${dir}`);
  }
});

console.log('\n✅ Migration complete!');
console.log('📝 Update package.json scripts:');
console.log('   "test:members": "playwright test tests/members/"');
```

---

## Example: Generated Test Structure

After user generates 10 tests:

```
tests/
├── members-create.spec.js              ← Test files (10 files)
├── members-edit.spec.js
├── members-delete.spec.js
├── members-verify-list.spec.js
├── transactions-add.spec.js
├── transactions-edit.spec.js
├── transactions-verify-balance.spec.js
├── dashboard-verify-widgets.spec.js
├── dashboard-verify-charts.spec.js
├── dashboard-verify-data.spec.js
│
├── plans/                              ← Plan files (10 files)
│   ├── members-create-plan.json
│   ├── members-edit-plan.json
│   ├── members-delete-plan.json
│   ├── members-verify-list-plan.json
│   ├── transactions-add-plan.json
│   ├── transactions-edit-plan.json
│   ├── transactions-verify-balance-plan.json
│   ├── dashboard-verify-widgets-plan.json
│   ├── dashboard-verify-charts-plan.json
│   └── dashboard-verify-data-plan.json
│
├── screenshots/                        ← Debug screenshots (5 files)
│   ├── members-create-error-1738152600.png
│   ├── members-edit-error-1738152650.png
│   ├── transactions-add-error-1738152700.png
│   ├── dashboard-verify-widgets-error-1738152750.png
│   └── dashboard-verify-charts-error-1738152800.png
│
└── reports/                            ← Test reports (10 files)
    ├── members-create-report.md
    ├── members-edit-report.md
    ├── members-delete-report.md
    ├── members-verify-list-report.md
    ├── transactions-add-report.md
    ├── transactions-edit-report.md
    ├── transactions-verify-balance-report.md
    ├── dashboard-verify-widgets-report.md
    ├── dashboard-verify-charts-report.md
    └── dashboard-verify-data-report.md

Total: 10 tests in flat structure
Easy to run: npm test, npm run test:members (grep pattern)
Finding related files: Use {testName} prefix (e.g., "members-create")
```

### Cross-References Between Files

Each test file includes references in comments:

```javascript
// Test: members-create
// Plan: tests/plans/members-create-plan.json
// Report: tests/reports/members-create-report.md
// Generated: 2026-01-29

const { test, expect } = require('@playwright/test');
const { setupTest } = require('../helpers/auth');
// ... rest of test
```

This makes it easy to find related files when debugging.

---

## Next Steps

### Version 1.0 (Initial Implementation)

1. **sf360-test-plan** tool:
   - Generate test name: `{page}-{action}` (e.g., "members-create")
   - Create artifact folders: `tests/plans/`, `tests/screenshots/`, `tests/reports/`
   - Save plan: `tests/plans/{testName}-plan.json`
   - Return `planFile` path for next phase

2. **sf360-test-generate** tool:
   - Read `planFile` from Phase 1
   - Generate test with header comment referencing plan file
   - Save test: `tests/{testName}.spec.js`
   - Return `testFile` and `planFile` paths

3. **sf360-test-evaluate** tool:
   - Read `testFile` from Phase 2
   - Save screenshots: `tests/screenshots/{testName}-error-{timestamp}.png`
   - Return result with `testFile` and `planFile` references

4. **sf360-test-report** tool:
   - Read `testFile`, `planFile`, `evaluationResult`
   - Generate report with cross-references
   - Save report: `tests/reports/{testName}-report.md`
   - Return `reportFile` path

5. **Add to template:**
   - `scripts/clean-artifacts.js` - Cleanup script
   - Update `package.json` with test runner scripts
   - Update `playwright.config.js` with artifact settings

### Version 1.5 (Future Enhancement)

6. **Add page-based structure as opt-in:**
   - Add tool parameter: `organizeByFeature: boolean`
   - Provide migration script: `scripts/migrate-to-page-based.js`
   - Update documentation with pros/cons of each structure
