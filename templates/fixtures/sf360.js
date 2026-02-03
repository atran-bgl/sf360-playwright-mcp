/**
 * SF360 Playwright Test Fixtures
 * Provides pre-authenticated page with automatic fund/member creation
 */

const base = require('@playwright/test');
const setupTest = require('../helpers/auth');

/**
 * SF360 Test Fixtures
 *
 * Usage:
 *
 * // Basic usage (no fund/member)
 * test('my test', async ({ page, sf360 }) => {
 *   // sf360 = { baseUrl, firm, uid }
 *   // Already authenticated and ready to use
 * });
 *
 * // With pageKey (auto-creates fund/member if needed)
 * test.use({ sf360PageKey: 'fund.members' });
 * test('member test', async ({ page, sf360 }) => {
 *   // sf360 = { baseUrl, firm, uid, fundId, fundName, memberId, memberCode, memberName }
 *   // Fund and member already created!
 * });
 *
 * // Custom fund/member control
 * test.use({
 *   sf360PageKey: 'fund.dashboard',
 *   sf360Fund: 'create',           // Force fund creation
 *   sf360Member: 'skip'             // Skip member creation
 * });
 *
 * // Custom fund name
 * test.use({
 *   sf360Fund: 'create',
 *   sf360FundName: 'My Custom Fund'
 * });
 */

const test = base.test.extend({
  /**
   * Page key for auto-navigation and fund/member detection
   * @example 'fund.members', 'home.entity_selection', 'settings.badges'
   */
  sf360PageKey: [undefined, { option: true }],

  /**
   * Fund creation: 'create' | 'skip' | undefined (auto-detect from pageKey)
   */
  sf360Fund: [undefined, { option: true }],

  /**
   * Member creation: 'create' | 'skip' | undefined (auto-detect from pageKey)
   */
  sf360Member: [undefined, { option: true }],

  /**
   * Custom fund name (optional)
   */
  sf360FundName: [undefined, { option: true }],

  /**
   * Entity type: 'SMSF' | 'Trust' | 'Company'
   */
  sf360EntityType: ['SMSF', { option: true }],

  /**
   * Custom member data (optional)
   */
  sf360MemberData: [undefined, { option: true }],

  /**
   * Enable verbose logging
   */
  sf360Verbose: [false, { option: true }],

  /**
   * Skip token cache (force fresh authentication)
   */
  sf360SkipCache: [false, { option: true }],

  /**
   * SF360 context fixture - automatically authenticates and sets up test environment
   */
  sf360: async ({
    page,
    sf360PageKey,
    sf360Fund,
    sf360Member,
    sf360FundName,
    sf360EntityType,
    sf360MemberData,
    sf360Verbose,
    sf360SkipCache
  }, use) => {
    // Get firm from environment
    const firm = process.env.FIRM;
    if (!firm) {
      throw new Error('FIRM is required in .env file');
    }

    // Build setupTest options
    const options = {
      firm,
      verbose: sf360Verbose,
      skipCache: sf360SkipCache
    };

    // Add optional parameters
    if (sf360PageKey) options.pageKey = sf360PageKey;
    if (sf360Fund) options.fund = sf360Fund;
    if (sf360Member) options.member = sf360Member;
    if (sf360FundName) options.fundName = sf360FundName;
    if (sf360EntityType) options.entityType = sf360EntityType;
    if (sf360MemberData) options.memberData = sf360MemberData;

    // Setup test environment
    const context = await setupTest(page, options);

    // Provide context to test
    await use(context);

    // Cleanup (if needed in the future)
    // Note: Fund/member cleanup could be added here
  }
});

const expect = base.expect;

module.exports = { test, expect };
