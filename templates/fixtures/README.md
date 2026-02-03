# SF360 Test Fixtures

Playwright test fixtures for SF360 that provide automatic authentication and test data setup.

## Which Approach to Use?

### ✅ Recommended: Use Test Fixtures (sf360.js)

**For Claude Code generation and most tests**, use the fixtures:

```javascript
const { test, expect } = require('../fixtures/sf360');

test('my test', async ({ page, sf360 }) => {
  // Already authenticated and ready!
  // sf360 = { baseUrl, firm, uid, fundId, memberId, ... }
});
```

**Benefits:**
- ✅ Cleanest syntax
- ✅ Automatic authentication
- ✅ Automatic fund/member creation based on pageKey
- ✅ No manual setup code needed
- ✅ Follows Playwright best practices

**Claude should generate tests using this fixture approach.**

---

### Alternative: Use setupTest() Directly

**For advanced use cases**, you can call `setupTest()` directly:

```javascript
const setupTest = require('../helpers/auth');

test('advanced test', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: 'myFirm',
    pageKey: 'fund.members',
    verbose: true
  });

  // ctx = { baseUrl, firm, uid, fundId, memberId, ... }
});
```

**Use this when:**
- You need multiple authentications in one test
- You need custom authentication logic
- You're building custom fixtures

---

## Quick Examples

### Example 1: Simple Page Test
```javascript
const { test, expect } = require('../fixtures/sf360');

test('homepage loads', async ({ page, sf360 }) => {
  await page.goto(`${sf360.baseUrl}/home`);
  await expect(page).toHaveTitle(/SF360/);
});
```

### Example 2: Test with Fund
```javascript
const { test, expect } = require('../fixtures/sf360');

test.use({ sf360PageKey: 'fund.dashboard' });

test('fund dashboard displays', async ({ page, sf360 }) => {
  // Fund already created: sf360.fundId, sf360.fundName
  await expect(page).toHaveURL(/fund.*dashboard/);
});
```

### Example 3: Test with Fund + Member
```javascript
const { test, expect } = require('../fixtures/sf360');

test.use({ sf360PageKey: 'fund.members' });

test('member page works', async ({ page, sf360 }) => {
  // Fund + Member created: sf360.fundId, sf360.memberId, sf360.memberCode
  await expect(page.locator('text=' + sf360.memberCode)).toBeVisible();
});
```

---

## Fixture Options

Configure fixtures using `test.use()`:

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `sf360PageKey` | string | Page key for navigation + auto fund/member detection | `'fund.members'` |
| `sf360Fund` | string | `'create'` \| `'skip'` \| `undefined` (auto) | `'create'` |
| `sf360Member` | string | `'create'` \| `'skip'` \| `undefined` (auto) | `'skip'` |
| `sf360FundName` | string | Custom fund name | `'Test Fund'` |
| `sf360EntityType` | string | `'SMSF'` \| `'Trust'` \| `'Company'` | `'Trust'` |
| `sf360MemberData` | object | Custom member data | `{ firstName: 'John' }` |
| `sf360Verbose` | boolean | Enable verbose logging | `true` |
| `sf360SkipCache` | boolean | Force fresh authentication | `true` |

---

## Authentication

The fixture automatically handles authentication using one of two methods:

### Method 1: API-based (Primary - Fast ⚡)
- Uses AWS Parameter Store + Cognito + SSO
- **Speed**: 2-3 seconds
- **Requires**: AWS credentials configured (`aws configure`)

### Method 2: UI-based (Fallback - Slower 🐌)
- Uses Playwright to fill login form
- **Speed**: 10-15 seconds
- **Requires**: `360_UAT_URL` in `.env` file

The fixture **automatically falls back** to UI-based login if AWS authentication fails.

---

## See Also

- `example-fixture-usage.test.js` - Comprehensive examples
- `../helpers/auth.js` - Low-level setupTest() function
- `../../.env.template` - Environment variables

---

## For Claude Code Generation

**When generating Playwright tests, always use the fixture approach:**

```javascript
const { test, expect } = require('../fixtures/sf360');

// Configure page key if the test needs a specific page
test.use({ sf360PageKey: 'fund.members' });

test('my generated test', async ({ page, sf360 }) => {
  // Test code here - already authenticated!
});
```

This is the simplest and most maintainable approach for generated tests.
