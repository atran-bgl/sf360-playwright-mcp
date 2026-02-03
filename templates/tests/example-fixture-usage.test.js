/**
 * SF360 Fixture Usage Examples
 *
 * This file demonstrates different ways to use the sf360 fixture
 */

const { test, expect } = require('../fixtures/sf360');

// Example 1: Basic test (no fund/member needed)
test('homepage loads correctly', async ({ page, sf360 }) => {
  // sf360 = { baseUrl, firm, uid }
  // Already authenticated!

  await page.goto(`${sf360.baseUrl}/s/entity/fundlist/?firm=${sf360.firm}&uid=${sf360.uid}`);
  await expect(page).toHaveURL(/fundlist/);
});

// Example 2: Test with auto-detected fund creation
test.describe('Fund tests', () => {
  // Configure pageKey - fund will be auto-created because 'fund.dashboard' requires it
  test.use({ sf360PageKey: 'fund.dashboard' });

  test('fund dashboard shows fund details', async ({ page, sf360 }) => {
    // sf360 = { baseUrl, firm, uid, fundId, fundName }
    // Fund already created and page navigated!

    expect(sf360.fundId).toBeDefined();
    expect(sf360.fundName).toBeDefined();

    // Page is already on fund dashboard
    await expect(page).toHaveURL(/fund.*dashboard/);
  });
});

// Example 3: Test with fund AND member
test.describe('Member tests', () => {
  // Configure pageKey - both fund and member will be auto-created
  test.use({ sf360PageKey: 'fund.members' });

  test('member page displays member details', async ({ page, sf360 }) => {
    // sf360 = { baseUrl, firm, uid, fundId, fundName, memberId, memberCode, memberName, peopleId }
    // Fund and member already created!

    expect(sf360.fundId).toBeDefined();
    expect(sf360.memberId).toBeDefined();
    expect(sf360.memberCode).toBeDefined();

    // Page is already on fund members page
    await expect(page).toHaveURL(/members/);
  });
});

// Example 4: Custom fund name
test.describe('Custom fund tests', () => {
  test.use({
    sf360PageKey: 'fund.dashboard',
    sf360FundName: 'My Test Fund'
  });

  test('creates fund with custom name', async ({ page, sf360 }) => {
    expect(sf360.fundName).toContain('My Test Fund');
  });
});

// Example 5: Manual control (force create or skip)
test.describe('Manual control tests', () => {
  test.use({
    sf360PageKey: 'fund.dashboard',
    sf360Fund: 'create',    // Force fund creation
    sf360Member: 'skip'      // Skip member (even if page needs it)
  });

  test('has fund but no member', async ({ page, sf360 }) => {
    expect(sf360.fundId).toBeDefined();
    expect(sf360.memberId).toBeUndefined();
  });
});

// Example 6: Verbose logging for debugging
test.describe('Debug test', () => {
  test.use({
    sf360PageKey: 'fund.members',
    sf360Verbose: true  // Enable detailed logging
  });

  test('runs with verbose output', async ({ page, sf360 }) => {
    // Check console for detailed setup logs
    expect(sf360.fundId).toBeDefined();
  });
});

// Example 7: Skip cache (force fresh auth)
test.describe('Fresh auth test', () => {
  test.use({
    sf360SkipCache: true  // Force fresh authentication
  });

  test('authenticates without cache', async ({ page, sf360 }) => {
    // Will fetch new JWT token instead of using cached one
    expect(sf360.uid).toBeDefined();
  });
});

// Example 8: Different entity types
test.describe('Trust entity test', () => {
  test.use({
    sf360Fund: 'create',
    sf360EntityType: 'Trust'  // Create a Trust instead of SMSF
  });

  test('creates trust entity', async ({ page, sf360 }) => {
    expect(sf360.fundId).toBeDefined();
    // Trust entity created
  });
});
