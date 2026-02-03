# Phase 4 Cleanup Analysis

**Date**: 2026-02-02
**Status**: Analysis Complete

---

## 🔍 Existing Code Scan Results

### Current Structure

#### 1. **`.playwright-test-mcp/` Directory (LEGACY)**
**Status**: ⚠️ **REMOVE COMPLETELY**
**Size**: ~4MB (includes node_modules)
**Location**: `/Users/atran/SFsourceCode/sf360-playwright-mcp/.playwright-test-mcp/`

**Contents**:
```
.playwright-test-mcp/
├── log-in-helper/
│   └── auth.js (308 lines, 10,400 bytes) - OLD UI-based auth
├── config/
│   └── menu-mapping.json (OLD version)
├── prompts/ (7 files)
│   ├── generate-test-prompt.md (OLD)
│   ├── discover-page-prompt.md (OLD)
│   └── ... (4 more OLD prompts)
├── mcp-server/
│   ├── src/index.ts (OLD MCP server)
│   ├── dist/index.js (OLD compiled)
│   └── node_modules/ (dependencies)
└── README.md (OLD documentation)
```

**Why Remove**:
- Completely replaced by `templates/` structure
- Old UI-based authentication (10-15s vs 2-3s API-based)
- Outdated MCP server implementation
- Different file structure (log-in-helper vs helpers)
- Causes confusion for developers

**Action**: Delete entire directory in P4-002

---

#### 2. **`templates/helpers/auth.js` (CURRENT)**
**Status**: ⚠️ **REPLACE WITH API-BASED VERSION**
**Size**: 569 lines, 18,680 bytes
**Type**: UI-based authentication (Playwright page interactions)

**Current Exports**:
```javascript
module.exports = {
  login,              // UI-based login (page.goto, page.fill, page.click)
  navigateToPage,     // Navigate using menu-mapping.json
  generateTOTP,       // Generate TOTP code (otplib)
  verifySetup,        // Setup verification
  loadEnvFile,        // Load .env file
  validateEnvFile,    // Validate .env fields
  checkEnvExists      // Check .env file exists
};
```

**Authentication Flow** (Current - UI-based):
1. `page.goto()` to login page
2. `page.fill()` username/password fields
3. Generate TOTP code
4. `page.fill()` TOTP field (or manual entry if otplib missing)
5. `page.click()` submit button
6. Wait for navigation
7. Select firm from dropdown (if needed)

**Problems**:
- Slow (10-15 seconds per login)
- Fragile (depends on UI elements)
- No fund/member creation
- No token caching
- No API integration

**Migration Plan** (3 Options):

### **Option 1: Complete Replacement (Recommended)**
**Action**: Replace entire file with new API-based implementation
**Pros**: Clean break, no legacy code
**Cons**: Breaking change for existing users

```javascript
// NEW templates/helpers/auth.js (API-based)
module.exports = {
  // PRIMARY FUNCTION
  setupTest,               // NEW: Complete test setup with auto fund/member

  // AUTH FUNCTIONS (called by setupTest)
  getCognitoToken,         // NEW: JWT auth with caching
  loginToSSO,              // NEW: SSO login with cookies

  // FIXTURE FUNCTIONS (called by setupTest)
  createFund,              // NEW: Fund creation API
  createMember,            // NEW: Member creation API

  // UTILITY FUNCTIONS (kept/migrated)
  navigateToPage,          // KEEP: Still useful
  generateTOTP,            // KEEP: Still needed
  verifySetup,             // UPDATE: New checks

  // DEPRECATED (with warnings)
  login,                   // DEPRECATED: Old UI-based login (add warning)
};
```

**Implementation**:
- Create separate module files (auth-cognito.js, auth-sso-login.js, etc.)
- Main auth.js imports and re-exports them
- Add deprecation warning to old `login()` function
- Keep old `login()` for 1-2 versions, then remove

---

### **Option 2: Side-by-Side (Compatibility Mode)**
**Action**: Keep old auth.js, create new setupTest.js
**Pros**: No breaking changes
**Cons**: Confusing, maintains legacy code

```
templates/helpers/
├── auth.js (OLD - UI-based, deprecated)
├── setupTest.js (NEW - API-based, recommended)
├── auth-cognito.js
├── auth-sso-login.js
└── ... (other new modules)
```

**Not Recommended**: Adds complexity without benefit

---

### **Option 3: Gradual Migration (Hybrid)**
**Action**: Add API-based methods to existing auth.js
**Pros**: Single file, gradual adoption
**Cons**: Large file (1000+ lines), mixing UI and API approaches

**Not Recommended**: Creates maintenance burden

---

## 📋 Recommended Cleanup Plan

### Phase 4 Task Updates

#### **P4-001: Update - Analyze existing helpers**
**Add to existing task**:
- Scan `templates/helpers/auth.js` for functions to preserve
- Identify functions to deprecate vs remove
- Create migration guide for `login()` → `setupTest()`

#### **P4-002: Update - Remove legacy directory + backup old auth.js**
**Updated acceptance criteria**:
- Remove `.playwright-test-mcp/` directory completely
- Backup current `templates/helpers/auth.js` to `templates/helpers/auth.js.OLD`
- Verify no imports reference `.playwright-test-mcp/`
- Verify no code uses old `log-in-helper/` path

#### **P4-005: NEW TASK - Implement auth.js replacement strategy**
**New task needed**:
- Create new `templates/helpers/auth.js` with API-based exports
- Import and re-export from module files (auth-cognito.js, etc.)
- Add deprecation warning to old `login()` function if keeping it
- Update all examples in templates/tests/ to use `setupTest()`

#### **P4-006: NEW TASK - Create migration script**
**New task needed**:
- Create `scripts/migrate-to-api-auth.js` helper
- Script updates test files from `login()` → `setupTest()`
- Script updates .env files with new variables
- Script documented in migration guide

---

## 🔄 Migration Strategy for Users

### Breaking Changes (Version 1.0.0)

**Old Code** (UI-based):
```javascript
const { login, navigateToPage } = require('../helpers/auth');

test.beforeEach(async ({ page }) => {
  await login(page, { envPath: '../.env' });
});

test('my test', async ({ page }) => {
  await navigateToPage(page, 'fund.members');
  // test code
});
```

**New Code** (API-based):
```javascript
const { setupTest } = require('../helpers/auth');

test('my test', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    pageKey: 'fund.members'  // Auto-creates fund, navigates
  });

  // ctx = { baseUrl, firm, uid, fundId, fundName }
  // test code
});
```

**Benefits**:
- ✅ 5x faster (2-3s vs 10-15s)
- ✅ Auto-creates test fixtures (fund/member)
- ✅ Token caching (even faster subsequent tests)
- ✅ More reliable (API vs UI)
- ✅ Unique test data (no conflicts)

### Compatibility Period (Versions 0.3.x)

**Option**: Keep old `login()` with deprecation warning

```javascript
async function login(page, options = {}) {
  console.warn(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  DEPRECATION WARNING

The UI-based login() function is deprecated and will be
removed in version 1.0.0.

Please migrate to setupTest() for:
- 5x faster authentication (API-based)
- Automatic fund/member creation
- Token caching

Migration guide: https://github.com/bgl/sf360-playwright-mcp/MIGRATION.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Old UI-based implementation continues to work...
}
```

---

## 📁 New Helper Module Structure

After Phase 2 implementation, `templates/helpers/` will have:

```
templates/helpers/
├── auth.js                  # MAIN FILE (imports/exports all)
├── auth-cognito.js          # Cognito JWT authentication
├── auth-sso-login.js        # SSO login & cookie extraction
├── auth-token-cache.js      # Token caching (file + memory)
├── fund-api.js              # Fund creation via API
├── member-api.js            # Member creation (3-step)
├── data-factory.js          # Test data generators
└── verify-setup.js          # Setup verification (UPDATE)
```

**Main auth.js becomes orchestrator**:
```javascript
// Import from specialized modules
const { authenticateWithCognito } = require('./auth-cognito');
const { getCognitoToken } = require('./auth-token-cache');
const { loginToSSO } = require('./auth-sso-login');
const { createFund } = require('./fund-api');
const { createMember } = require('./member-api');
const { generateContactData, generateFundData } = require('./data-factory');

// Re-export for convenience
module.exports = {
  // PRIMARY
  setupTest,

  // AUTH
  getCognitoToken,
  loginToSSO,
  authenticateWithCognito,

  // FIXTURES
  createFund,
  createMember,

  // DATA
  generateContactData,
  generateFundData,
  generateMemberData,

  // UTILITIES
  navigateToPage,
  generateTOTP,
  verifySetup,

  // DEPRECATED (with warning)
  login: deprecatedLogin,
};
```

---

## ✅ Updated Phase 4 Task List

### Additional Tasks Needed:

**P4-005: Implement auth.js replacement strategy**
- Create new auth.js structure (orchestrator + imports)
- Add deprecation warning to old login() if keeping
- Update test examples
- Priority: High
- Dependencies: P2-006

**P4-006: Create migration script and guide**
- Write migration script (login → setupTest)
- Write MIGRATION.md guide
- Document breaking changes
- Priority: High
- Dependencies: P4-005

**P4-007: Update verify-setup.js for new requirements**
- Check for new dependencies (axios, tough-cookie, etc.)
- Check for new .env variables (COGNITO_URL, SSO_URL, etc.)
- Update error messages and fix suggestions
- Priority: Medium
- Dependencies: P1-006

---

## 🎯 Summary

### What to Keep:
- ✅ `navigateToPage()` - Still useful with new auth
- ✅ `generateTOTP()` - Used by Cognito auth
- ✅ `verifySetup()` - Update for new requirements
- ✅ `loadEnvFile()` - Used by setupTest
- ✅ `validateEnvFile()` - Update for new fields

### What to Replace:
- ⚠️ `login()` - Replace with `setupTest()` (or deprecate with warning)
- ⚠️ Current auth.js structure - Replace with modular API-based version

### What to Remove:
- ❌ Entire `.playwright-test-mcp/` directory
- ❌ All references to `log-in-helper/`
- ❌ Old UI-based authentication flow

### What to Add:
- ✅ 6 new helper modules (auth-cognito, auth-sso-login, etc.)
- ✅ New primary function: `setupTest()`
- ✅ Migration script and guide
- ✅ Updated verify-setup.js

---

## 🚀 Implementation Order

1. **Backup**: Save current auth.js as auth.js.OLD
2. **Remove**: Delete .playwright-test-mcp/ directory
3. **Implement**: Create new helper modules (Phase 2)
4. **Replace**: Create new auth.js orchestrator
5. **Deprecate**: Add warnings to old login() (optional)
6. **Migrate**: Update examples to use setupTest()
7. **Document**: Write migration guide

---

*Analysis complete: 2026-02-02*
