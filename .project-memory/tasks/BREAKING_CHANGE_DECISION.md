# BREAKING CHANGE DECISION

**Date**: 2026-02-02
**Decision**: Remove old `login()` function entirely - NO deprecation period

---

## ✅ Decision Made

**Remove the old UI-based `login()` function completely**

This is a **BREAKING CHANGE** requiring:
- **Version**: 1.0.0 (major version bump)
- **No backward compatibility** with UI-based authentication
- **Clean break** to API-based `setupTest()` function

---

## 📋 What This Means

### Functions Being REMOVED

```javascript
// ❌ REMOVED in v1.0.0 - NO LONGER AVAILABLE
async function login(page, options)

// Old usage (v0.2.x):
const { login } = require('../helpers/auth');
await login(page, { envPath: '../.env' });
```

### Functions Being ADDED

```javascript
// ✅ NEW in v1.0.0 - REQUIRED for all tests
async function setupTest(page, options)

// New usage (v1.0.0):
const { setupTest } = require('../helpers/auth');
const ctx = await setupTest(page, {
  firm: process.env.FIRM,
  pageKey: 'fund.members'
});
```

---

## 🎯 Rationale

### Why Remove Instead of Deprecate?

1. **Clean Architecture**
   - No UI-based code to maintain
   - No confusion between two auth methods
   - Cleaner codebase

2. **Different Paradigms**
   - Old: UI-based (page.goto, page.fill, page.click)
   - New: API-based (Cognito JWT, SSO cookies)
   - Cannot coexist without duplication

3. **Major Performance Difference**
   - Old: 10-15 seconds
   - New: 2-3 seconds (5x faster)
   - Deprecation would encourage slow approach

4. **Incompatible .env Requirements**
   - Old: USERNAME, USER_PW, FIRM, 360_UAT_URL
   - New: COGNITO_URL, COGNITO_CLIENT_ID, SSO_URL, TOTP_SECRET
   - Different configuration models

5. **New Capabilities**
   - Old: Only authentication
   - New: Auth + auto fund/member creation + token caching
   - setupTest() is fundamentally different function

---

## 📦 Version Strategy

### Version 0.2.x (Current)
- UI-based `login()` function
- No API authentication
- No test fixture creation
- **DEPRECATED** - users should not start new projects with this

### Version 1.0.0 (This Release)
- **BREAKING CHANGE**: `login()` removed
- API-based `setupTest()` function
- Cognito JWT + SSO authentication
- Automatic fund/member creation
- Token caching (file + memory)
- Test data factories

---

## 📢 Communication Plan

### Release Announcement

**Subject**: 🚨 SF360 Playwright MCP v1.0.0 - BREAKING CHANGE

**Message**:
```
🚨 BREAKING CHANGE: Version 1.0.0

The UI-based login() function has been REMOVED.

What's Changed:
❌ REMOVED: login() function (UI-based, 10-15s)
✅ NEW: setupTest() function (API-based, 2-3s)
✅ NEW: Automatic fund/member creation
✅ NEW: Token caching
✅ NEW: Test data factories

Migration Required:
All tests must be updated to use setupTest() instead of login().

See migration guide: MIGRATION.md
Benefits: 5x faster auth, auto fixtures, better reliability

Rollback: If you need the old version, use @bgl/sf360-playwright-mcp@0.2.0
```

### CHANGELOG.md

```markdown
# Changelog

## [1.0.0] - 2026-XX-XX

### 🚨 BREAKING CHANGES

- **REMOVED: `login()` function** - The UI-based login function has been completely removed
- **NEW: `setupTest()` function** - Required for all tests, provides API-based auth
- **New .env format** - Requires COGNITO_URL, COGNITO_CLIENT_ID, SSO_URL, TOTP_SECRET
- **Minimum changes required** - All tests must be updated, see MIGRATION.md

### Added
- API-based authentication via AWS Cognito + TOTP
- SSO login with cookie extraction
- Automatic fund creation via API
- Automatic member creation via 3-step API process
- Token caching (file-based for JWT, memory for SSO sessions)
- Test data factory functions for unique test data
- 4 new MCP tools: test-plan, test-generate, test-evaluate, test-report

### Changed
- Authentication is now 5x faster (2-3s vs 10-15s)
- Tests automatically create isolated fixtures
- Template directory structure updated

### Removed
- UI-based `login()` function
- Manual TOTP entry option (now requires otplib)
- Old .playwright-test-mcp/ directory structure

### Migration Guide
See MIGRATION.md for detailed migration instructions.
```

### README.md Warning

Add to top of README:
```markdown
# SF360 Playwright MCP

> **⚠️ Version 1.0.0 Breaking Change Notice**
>
> If upgrading from 0.2.x, the `login()` function has been **REMOVED**.
> All tests must use the new `setupTest()` function.
>
> See [MIGRATION.md](./MIGRATION.md) for upgrade instructions.
>
> To use the old version: `npm install @bgl/sf360-playwright-mcp@0.2.0`
```

---

## 🛠️ Migration Support

### Migration Guide (MIGRATION.md)

Will include:
1. **Breaking changes overview**
2. **Before/after code examples**
3. **New .env requirements**
4. **Step-by-step migration**
5. **Troubleshooting**
6. **Rollback instructions**

### Migration Script (Optional)

`scripts/migrate-to-api-auth.js`:
- Scans test files for `login()` usage
- Reports all files that need updates
- Suggests `setupTest()` conversions
- Provides .env migration checklist

---

## 📊 Impact Assessment

### Who Is Affected?

**Existing users** (if any on v0.2.x):
- Must update all test files
- Must update .env configuration
- Must add new dependencies (axios, tough-cookie, etc.)
- Benefit: Tests will be 5x faster

**New users** (starting with v1.0.0):
- Not affected
- Get best experience from start
- Use only API-based approach

### Rollback Plan

Users who cannot migrate immediately:
```bash
# Pin to old version
npm install @bgl/sf360-playwright-mcp@0.2.0

# Or in package.json
"@bgl/sf360-playwright-mcp": "0.2.0"
```

---

## ✅ Implementation Checklist

### Phase 4 Updates (Done)
- [x] P4-005: Updated to "REMOVE old login() completely"
- [x] P4-006: Updated with "BREAKING CHANGE" emphasis
- [x] P4-003: Updated version to 1.0.0

### Phase 6 Updates (Done)
- [x] P6-001: Updated for breaking change release prep
- [x] P6-002: Updated for breaking change announcement

### Required Documentation
- [ ] MIGRATION.md with breaking change section
- [ ] CHANGELOG.md with BREAKING CHANGES section
- [ ] README.md with prominent warning
- [ ] Release notes emphasizing breaking changes

### Required Actions
- [ ] Remove all UI-based auth code from auth.js
- [ ] Remove old login() function completely
- [ ] Update all examples to use setupTest()
- [ ] Test migration path with sample project

---

## 🎉 Benefits of This Approach

1. **Clean codebase** - No legacy code to maintain
2. **Clear direction** - One auth method, API-based
3. **Better performance** - Force users to faster approach
4. **Modern architecture** - JWT tokens, API-first
5. **Test isolation** - Auto-fixture creation
6. **Future-proof** - Built on APIs, not UI

---

**Decision Confirmed**: Remove old `login()` entirely, version 1.0.0

*Last updated: 2026-02-02*
