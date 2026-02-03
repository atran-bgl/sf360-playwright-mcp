---
status: active
domain: authentication
implementation-status: NOT-STARTED
impediment: none
---

# Spec: setupTest() API Contract

**Feature:** Unified test setup function for SF360 Playwright tests
**Priority:** High
**Estimated Complexity:** High

---

## Overview

`setupTest()` is a factory function that handles complete test setup including authentication, firm selection, and optional fund/member creation. It intelligently determines requirements based on pageKey from menu-mapping.json.

---

## API Contract

### Function Signature

```javascript
/**
 * Complete SF360 test setup with intelligent fund/member handling
 * @param {Object} page - Playwright page object
 * @param {Object} options - Setup options
 * @returns {Promise<Object>} Setup context
 */
async function setupTest(page, options)
```

### Options Parameter

```typescript
interface SetupOptions {
  // Required
  firm: string;                    // Firm short name (e.g., "tinabgl")

  // Optional - Fund handling
  fund?: 'create' | 'skip' | undefined;  // Force create/skip or auto-detect
  pageKey?: string;                      // Page key for auto-detection (e.g., "fund.members")
  fundName?: string;                     // Custom fund name (default: "AutoTest SMSF {timestamp}")
  entityType?: 'SMSF' | 'Trust' | 'Company';  // Default: 'SMSF'

  // Optional - Member handling
  member?: 'create' | 'skip' | undefined;  // Force create/skip or auto-detect
  memberData?: {
    firstName?: string;              // Default: "Test"
    lastName?: string;               // Default: "Member{timestamp}"
    dateOfBirth?: string;            // Format: YYYY-MM-DD
  };

  // Optional - Advanced
  verbose?: boolean;                 // Enable verbose logging (default: false)
  skipCache?: boolean;               // Skip token cache (default: false)
}
```

### Return Value

```typescript
interface SetupContext {
  // Always present
  baseUrl: string;        // SF360 server URL (e.g., "https://sf360.uat.bgl360.com.au")
  firm: string;           // Firm short name
  uid: number;            // User ID

  // Present if fund created
  fundId?: string;        // Fund/entity ID
  fundName?: string;      // Fund/entity name

  // Present if member created (requires 3-step process: Contact → Member Data → Accumulation Account)
  memberId?: string;      // Member ID (from accumulation account)
  memberCode?: string;    // Member code (from member data)
  memberName?: string;    // Member full name
  peopleId?: string;      // Contact/person ID (from contact creation)
}
```

---

## Usage Examples

**Note:** For generating unique test data, see `active.auth-data-factory.md` for factory functions like `generateMemberData()`, `generateFundData()`, and `generateContactData()`.

### Example 1: Firm-Level Test (No Fund)

```javascript
test('update firm settings', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    pageKey: 'settings.badges'  // requiresFund: false
  });

  // ctx = { baseUrl, firm, uid }
  // No fundId - firm-level only

  await page.getByRole('button', { name: 'Create Badge' }).click();
});
```

### Example 2: Fund-Level Test (Auto-Detect)

```javascript
test('add member', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    pageKey: 'fund.members'  // requiresFund: true
  });

  // ctx = { baseUrl, firm, uid, fundId, fundName }
  // Fund automatically created!

  await page.getByRole('button', { name: 'Add Member' }).click();
});
```

### Example 3: Member-Level Test (Auto-Detect)

```javascript
test('view member details', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    pageKey: 'fund.member_details'  // requiresFund: true, requiresMember: true
  });

  // ctx = { baseUrl, firm, uid, fundId, fundName, memberId, memberCode, memberName, peopleId }
  // Fund AND member automatically created via 3-step process!

  await expect(page.getByText(ctx.memberName)).toBeVisible();
  console.log(`Testing member: ${ctx.memberName} (ID: ${ctx.memberId}, Code: ${ctx.memberCode})`);
});
```

### Example 4: Force Fund Creation

```javascript
test('create entity', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    fund: 'create',  // Force create even if pageKey doesn't require it
    fundName: 'My Custom Fund Name'
  });

  // ctx = { baseUrl, firm, uid, fundId, fundName }
  // Fund created with custom name
});
```

### Example 5: Force Skip Fund Creation

```javascript
test('test something', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    fund: 'skip',  // Force skip even if pageKey requires it
    pageKey: 'fund.members'
  });

  // ctx = { baseUrl, firm, uid }
  // No fund created (override auto-detection)
});
```

---

## Behavior Rules

### Fund Creation Logic

```
if (fund === 'create') {
  → Always create fund
} else if (fund === 'skip') {
  → Never create fund
} else if (pageKey provided) {
  → Check menu-mapping.json
  → If requiresFund === true: create fund
  → If requiresFund === false: skip fund
} else {
  → Default: skip fund (conservative)
}
```

### Member Creation Logic

```
if (member === 'create') {
  → Always create member (requires fund)
} else if (member === 'skip') {
  → Never create member
} else if (pageKey provided) {
  → Check menu-mapping.json
  → If requiresMember === true: create member
  → If requiresMember === false: skip member
} else {
  → Default: skip member
}
```

### Error Conditions

```javascript
// Error if member requested without fund
if (needsMember && !needsFund) {
  throw new Error('Cannot create member without fund. Set fund: "create" or use pageKey with requiresFund: true');
}

// Error if .env missing required fields
if (!config.username || !config.password) {
  throw new Error('.env missing required fields: USERNAME, USER_PASSWORD');
}

// Error if pageKey not found in menu-mapping
if (pageKey && !pageConfig) {
  throw new Error(`Page key '${pageKey}' not found in menu-mapping.json`);
}
```

---

## Navigation Behavior

### After Setup Completion

```javascript
if (memberId) {
  // Navigate to member details page
  await page.goto(`${baseUrl}/s/member/details?firm=${firm}&uid=${uid}&fundId=${fundId}&memberId=${memberId}`);
} else if (fundId) {
  // Navigate to fund dashboard
  await page.goto(`${baseUrl}/s/dashboard?firm=${firm}&uid=${uid}&fundId=${fundId}`);
} else {
  // Navigate to firm insights dashboard
  await page.goto(`${baseUrl}/s/insights?firm=${firm}&uid=${uid}`);
}

await page.waitForLoadState('networkidle');
```

---

## Console Output

### Verbose Mode (verbose: true) - With Member Creation

```
━━━ SF360 Test Setup ━━━

✓ Loaded configuration from .env
✓ Reusing cached token (expires in 45 minutes)
✓ Logged into SSO for firm: tinabgl
✓ Cookies injected into Playwright
✓ Creating fresh fund for isolated testing...
  → Fund: AutoTest SMSF 1738053600000
  → Fund ID: 8a8bc49f889413c40188942462720056
✓ Creating fresh member for isolated testing...
  → Contact created: Test Person1738053600000 (peopleId: abc123)
  → Member data retrieved (memberCode: M001)
  → Accumulation account created (memberId: def456)
✓ Setup complete

Context:
  firm: tinabgl
  uid: 1234
  fundId: 8a8bc49f889413c40188942462720056
  fundName: AutoTest SMSF 1738053600000
  memberId: def456
  memberCode: M001
  memberName: Test Person1738053600000
  peopleId: abc123

━━━━━━━━━━━━━━━━━━━━━━
```

### Normal Mode (verbose: false, default)

```
Logging in as user@example.com...
✓ Authenticated
✓ Fund created: AutoTest SMSF 1738053600000
```

---

## Static Helper Methods

### setupTest.warmupCache()

```javascript
/**
 * Pre-warm token cache (call in test.beforeAll)
 */
await setupTest.warmupCache();
```

### setupTest.clearCache()

```javascript
/**
 * Clear token cache (call in test.afterAll)
 */
await setupTest.clearCache();
```

---

## Acceptance Criteria

- [ ] Function accepts all specified options
- [ ] Returns correct context object
- [ ] Auto-detects requirements from menu-mapping.json
- [ ] Respects explicit fund: 'create' / 'skip' overrides
- [ ] Respects explicit member: 'create' / 'skip' overrides
- [ ] Throws descriptive errors for invalid configurations
- [ ] Navigates to appropriate page after setup
- [ ] Supports verbose logging mode
- [ ] Works with both pageKey and explicit options
- [ ] Handles missing pageKey gracefully (defaults to no fund)

---

## Dependencies

- Spec: `active.auth-token-caching.md` - Token caching implementation
- Spec: `active.auth-fund-creation.md` - Fund creation implementation
- Spec: `active.auth-data-factory.md` - Test data generation utilities
- File: `config/menu-mapping.json` - Page requirements metadata

---

## Related Files

- Implementation: `templates/helpers/auth.js` - Main implementation
- Implementation: `templates/helpers/data-factory.js` - Test data generation
- Tests: `templates/tests/setup-test.test.js` - Unit tests
- Prompts: `templates/prompts/generate-test-prompt.md` - Usage examples

---

## Notes

- This is the primary entry point for all generated tests
- Must be simple and intuitive for Claude to generate correct code
- Performance critical - optimize for speed
- Error messages must be clear for end users debugging tests
