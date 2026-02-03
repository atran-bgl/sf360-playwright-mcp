# Test Folder Structure

**Standard**: Flat/Type-Based Organization
**Version**: 1.0.0
**Applies To**: User projects (consuming projects)

---

## 📁 Folder Structure

```
your-project/
├── tests/                           # All test files (flat structure)
│   ├── members-create.spec.js       # Test: Create member
│   ├── members-edit.spec.js         # Test: Edit member
│   ├── transactions-add.spec.js     # Test: Add transaction
│   ├── badges-create.spec.js        # Test: Create badge
│   └── ...
│
├── tests/plans/                     # Test plans (type grouping)
│   ├── members-create-plan.json     # Plan for members-create test
│   ├── members-edit-plan.json       # Plan for members-edit test
│   ├── transactions-add-plan.json   # Plan for transactions-add test
│   └── ...
│
├── tests/screenshots/               # Error screenshots (type grouping)
│   ├── members-create-error-123.png
│   ├── members-edit-error-456.png
│   ├── transactions-add-error-789.png
│   └── ...
│
├── tests/reports/                   # Test reports (type grouping)
│   ├── members-create-report.md     # Report for members-create test
│   ├── members-edit-report.md       # Report for members-edit test
│   ├── transactions-add-report.md   # Report for transactions-add test
│   └── ...
│
├── helpers/                         # Auth and utility helpers
│   ├── auth.js                      # Primary: setupTest()
│   ├── auth-cognito.js              # Cognito JWT authentication
│   ├── auth-sso-login.js            # SSO login with cookies
│   ├── fund-api.js                  # Fund creation API
│   ├── member-api.js                # Member creation API
│   └── data-factory.js              # Test data generators
│
├── config/
│   └── menu-mapping.json            # SF360 page mappings
│
├── playwright.config.js             # Playwright configuration
├── .env                             # Environment variables (DO NOT COMMIT)
└── package.json
```

---

## 🏷️ Naming Convention

### Pattern: `{page}-{action}`

All related files share the same base name for easy correlation.

### Examples

**Test about creating a member:**
- Test file: `tests/members-create.spec.js`
- Plan file: `tests/plans/members-create-plan.json`
- Report file: `tests/reports/members-create-report.md`
- Screenshot: `tests/screenshots/members-create-error-{timestamp}.png`

**Test about editing a badge:**
- Test file: `tests/badges-edit.spec.js`
- Plan file: `tests/plans/badges-edit-plan.json`
- Report file: `tests/reports/badges-edit-report.md`

**Test about adding a transaction:**
- Test file: `tests/transactions-add.spec.js`
- Plan file: `tests/plans/transactions-add-plan.json`
- Report file: `tests/reports/transactions-add-report.md`

---

## 📝 File Extensions

| Type | Extension | Example |
|------|-----------|---------|
| **Test** | `.spec.js` | `members-create.spec.js` |
| **Plan** | `-plan.json` | `members-create-plan.json` |
| **Report** | `-report.md` | `members-create-report.md` |
| **Screenshot** | `-error-{id}.png` | `members-create-error-123.png` |

---

## 🎯 Why This Structure?

### Flat Test Directory
**Benefit**: Easy to find all tests in one place
- ✅ All test files at same level
- ✅ No deep nesting by feature/page
- ✅ Alphabetical sorting works well

### Type-Based Subdirectories
**Benefit**: Organized by artifact type, not feature
- ✅ All plans together in `tests/plans/`
- ✅ All screenshots together in `tests/screenshots/`
- ✅ All reports together in `tests/reports/`
- ✅ Easy to clean up old artifacts by type

### Consistent Naming
**Benefit**: Predictable file relationships
- ✅ Know the plan file for any test
- ✅ Know the report file for any test
- ✅ Easy to correlate failures with artifacts

---

## 🔍 Examples

### Example 1: Member Creation Test

```
tests/members-create.spec.js
tests/plans/members-create-plan.json
tests/reports/members-create-report.md
tests/screenshots/members-create-error-1738053600000.png
```

**Test file** (`tests/members-create.spec.js`):
```javascript
// Test: members-create
// Plan: tests/plans/members-create-plan.json
// Generated: 2026-01-29

const { test, expect } = require('@playwright/test');
const { setupTest } = require('../helpers/auth');

test.describe('Member Management', () => {
  test('should create new member', async ({ page }) => {
    // Setup: Auth + fund creation (auto)
    const ctx = await setupTest(page, {
      firm: process.env.FIRM,
      pageKey: 'fund.members'
    });

    // Test code here...
  });
});
```

**Plan file** (`tests/plans/members-create-plan.json`):
```json
{
  "metadata": {
    "testName": "members-create",
    "generated": "2026-01-29T10:00:00Z"
  },
  "targetPage": {
    "pageKey": "fund.members",
    "requiresFund": true,
    "requiresMember": false
  },
  "testSteps": [
    {
      "step": 1,
      "type": "setup",
      "description": "Authenticate and create fund"
    },
    {
      "step": 2,
      "type": "action",
      "description": "Click Add Member button"
    },
    // ...
  ]
}
```

**Report file** (`tests/reports/members-create-report.md`):
```markdown
# Test Report: members-create

**Status**: ✅ PASS
**Duration**: 4.5s
**Date**: 2026-01-29

## Summary
Test successfully created a new member and verified existence in the table.

## Test Details
- Plan: tests/plans/members-create-plan.json
- Test: tests/members-create.spec.js
- Attempts: 1 (passed on first try)

## Context
- Fund: AutoTest SMSF 1738053600000
- Fund ID: 8a8bc49f889413c40188942462720056

## Evidence
No screenshots (test passed)
```

---

### Example 2: Transaction Test with Failure

```
tests/transactions-add.spec.js
tests/plans/transactions-add-plan.json
tests/reports/transactions-add-report.md
tests/screenshots/transactions-add-error-1738053700000.png
tests/screenshots/transactions-add-error-1738053705000.png
```

**Multiple screenshots**: Each debug attempt gets timestamped screenshot

---

## 🧹 Cleanup Strategy

### Old Artifacts

Over time, you'll accumulate old plans, screenshots, and reports.

**Recommended cleanup intervals**:
- **Screenshots**: Delete after 30 days (or after test passes)
- **Plans**: Keep indefinitely (small size, useful for regeneration)
- **Reports**: Archive after 90 days

**Cleanup script** (`scripts/cleanup-artifacts.js`):
```javascript
// Deletes screenshots older than 30 days
// Deletes reports older than 90 days
// Plans are kept
```

Usage:
```bash
# Dry run (show what would be deleted)
npm run cleanup-artifacts -- --dry-run

# Actually delete
npm run cleanup-artifacts

# Custom age
npm run cleanup-artifacts -- --screenshots=7 --reports=30
```

---

## 📊 File Sizes

Typical sizes for reference:

| Type | Typical Size | Example |
|------|--------------|---------|
| Test file | 1-5 KB | `members-create.spec.js` ~2 KB |
| Plan JSON | 2-10 KB | `members-create-plan.json` ~5 KB |
| Report MD | 1-3 KB | `members-create-report.md` ~2 KB |
| Screenshot | 50-500 KB | `members-create-error.png` ~200 KB |

**Total per test**: ~5-15 KB (excluding screenshots)
**With screenshots**: ~200-500 KB per failed test

---

## 🚫 Anti-Patterns (What NOT to Do)

### ❌ Nested by Feature
```
tests/
├── members/
│   ├── create.spec.js
│   ├── edit.spec.js
│   └── delete.spec.js
├── transactions/
│   ├── add.spec.js
│   └── edit.spec.js
└── badges/
    └── create.spec.js
```
**Problem**: Harder to navigate, need to know feature hierarchy

### ❌ Mixed Artifact Types
```
tests/
├── members-create.spec.js
├── members-create-plan.json       ← Plan mixed with tests
├── members-create-report.md       ← Report mixed with tests
├── members-create-error.png       ← Screenshot mixed with tests
└── members-edit.spec.js
```
**Problem**: Cluttered directory, hard to clean up by type

### ❌ Inconsistent Naming
```
tests/
├── create-member.spec.js          ← Action-page order
├── member-edit.spec.js            ← Page-action order (inconsistent)
├── addTransaction.spec.js         ← camelCase (inconsistent)
└── badge_creation.spec.js         ← snake_case (inconsistent)
```
**Problem**: Hard to find related files, no predictable pattern

---

## ✅ Best Practices

1. **Always use {page}-{action} pattern** for all related files
2. **Keep tests/ flat** - don't nest by feature
3. **Group by artifact type** in subdirectories (plans/, screenshots/, reports/)
4. **Include plan reference** in test file header comments
5. **Use descriptive action names**: `create`, `edit`, `delete`, `view`, `list`
6. **Clean up old artifacts** regularly (especially screenshots)
7. **Use .gitignore** for screenshots and reports (optional)

---

## 📦 Git Ignore Recommendations

```gitignore
# Test artifacts (optional - you may want to commit reports)
tests/screenshots/
tests/reports/

# Environment (always ignore)
.env
.env.*

# Test cache
.sf360-token-cache

# Playwright
test-results/
playwright-report/
playwright/.cache/
```

**Decision**:
- **Plans**: Commit (useful for regeneration)
- **Tests**: Commit (source code)
- **Screenshots**: Don't commit (large, temporary)
- **Reports**: Your choice (useful for history, but can regenerate)

---

## 🔧 Setup Commands

### Create Structure

```bash
mkdir -p tests/plans tests/screenshots tests/reports
```

### Verify Structure

```bash
tree tests -L 1
# tests
# ├── plans
# ├── screenshots
# ├── reports
# ├── members-create.spec.js
# └── ...
```

---

## 📚 Related Documentation

- **Test Generation**: See MCP tool specs for how tests are generated
- **Test Execution**: See Playwright docs for running tests
- **Cleanup**: See `scripts/cleanup-artifacts.js` for automation

---

*Last updated: 2026-02-02*
