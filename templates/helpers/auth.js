/**
 * SF360 Test Setup - Main Entry Point
 * Handles authentication, fund/member creation, and page navigation
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { fetchAWSParameters } = require('./aws-ssm-config');
const { getCognitoToken, warmupCache, clearCache } = require('./auth-token-cache');
const { loginToSSO, clearSSOCache } = require('./auth-sso-login');
const { createFund } = require('./fund-api');
const { createMember } = require('./member-api');
const { loginUI } = require('./auth-ui-fallback');
const { clearCookies: clearAxiosCookies } = require('./axios-with-cookies');

/**
 * Load user credentials from environment variables
 * @returns {Object} User credentials
 */
function loadUserCredentials() {
  const requiredFields = ['USERNAME', 'USER_PASSWORD', 'TOTP_SECRET', 'UID'];
  const missing = requiredFields.filter(field => !process.env[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required .env fields: ${missing.join(', ')}`);
  }

  return {
    username: process.env.USERNAME,
    password: process.env.USER_PASSWORD,
    totpSecret: process.env.TOTP_SECRET,
    uid: parseInt(process.env.UID, 10),
    environment: process.env.ENVIRONMENT || 'uat'
  };
}

/**
 * Load menu mapping configuration
 * @returns {Object} Menu mapping object
 */
function loadMenuMapping() {
  const menuMappingPath = path.join(__dirname, '../config/menu-mapping.json');

  if (!fs.existsSync(menuMappingPath)) {
    throw new Error(`Menu mapping file not found: ${menuMappingPath}`);
  }

  return JSON.parse(fs.readFileSync(menuMappingPath, 'utf8'));
}

/**
 * Determine if fund and member are required based on pageKey
 * @param {string} pageKey - Page key (e.g., "fund.members")
 * @param {Object} menuMapping - Menu mapping object
 * @returns {Object} { requiresFund, requiresMember }
 */
function determineRequirements(pageKey, menuMapping) {
  if (!pageKey) {
    return { requiresFund: false, requiresMember: false };
  }

  const parts = pageKey.split('.');
  const section = parts[0];
  const page = parts[1];

  if (!menuMapping[section] || !menuMapping[section][page]) {
    throw new Error(`Invalid pageKey: ${pageKey} not found in menu mapping`);
  }

  const pageConfig = menuMapping[section][page];

  return {
    requiresFund: pageConfig.requiresFund || false,
    requiresMember: pageConfig.requiresMember || false
  };
}

/**
 * Complete SF360 test setup with intelligent fund/member handling
 * @param {Object} page - Playwright page object
 * @param {Object} options - Setup options
 * @param {string} options.firm - Firm short name (required)
 * @param {string} [options.pageKey] - Page key for auto-detection
 * @param {string} [options.fund] - 'create' | 'skip' | undefined (auto-detect)
 * @param {string} [options.member] - 'create' | 'skip' | undefined (auto-detect)
 * @param {string} [options.fundName] - Custom fund name
 * @param {string} [options.entityType='SMSF'] - Entity type
 * @param {Object} [options.memberData] - Custom member data
 * @param {boolean} [options.verbose=false] - Enable verbose logging
 * @param {boolean} [options.skipCache=false] - Skip token cache
 * @returns {Promise<Object>} Setup context
 */
async function setupTest(page, options) {
  const {
    firm,
    pageKey,
    fund,
    member,
    fundName,
    entityType = 'SMSF',
    memberData = {},
    verbose = false,
    skipCache = false
  } = options;

  if (!firm) {
    throw new Error('firm is required');
  }

  if (verbose) {
    console.log(`\n=== SF360 Test Setup ===`);
    console.log(`Firm: ${firm}`);
    if (pageKey) console.log(`Page: ${pageKey}`);
  }

  try {
    // Step 0: Load user credentials
    const userCredentials = loadUserCredentials();
    const menuMapping = loadMenuMapping();

    let context;
    let config;

    // Try AWS-based authentication first
    try {
      // Step 0.5: Fetch AWS configuration
      if (verbose) console.log('\nStep 0: Fetching AWS configuration...');
      const awsConfig = await fetchAWSParameters(userCredentials.environment);

      // Merge configs
      config = {
        cognito: {
          url: awsConfig.cognitoURL,
          clientId: awsConfig.cognitoClientId
        },
        ssoURL: awsConfig.ssoURL,
        baseUrl: awsConfig.serverURL,
        ...userCredentials
      };

      // Clear caches if requested
      if (skipCache) {
        console.log('⚠ Skipping cache (fresh authentication)');
        setupTest.clearCache();
      }

      // Step 1: Authenticate with Cognito
      if (verbose) console.log('\nStep 1: Cognito authentication...');
      const jwtToken = await getCognitoToken(
        config.username,
        config.password,
        config.totpSecret,
        config.cognito
      );

      // Step 2: Login to SSO
      if (verbose) console.log('Step 2: SSO login...');
      const cookies = await loginToSSO(jwtToken, firm, config.ssoURL);

      // Step 3: Inject cookies into Playwright
      if (verbose) console.log('Step 3: Injecting cookies...');
      await page.context().addCookies(cookies);

      // Initialize context
      context = {
        baseUrl: config.baseUrl,
        firm,
        uid: config.uid
      };

    } catch (awsError) {
      // Fallback to UI-based login if AWS authentication fails
      if (verbose) {
        console.log('\n⚠️  AWS authentication failed, falling back to UI-based login...');
        console.log(`   Error: ${awsError.message}`);
      }

      const uiUrl = process.env['360_UAT_URL'];
      if (!uiUrl) {
        throw new Error(
          'AWS authentication failed and no 360_UAT_URL fallback found in .env.\n' +
          'Either:\n' +
          '  1. Configure AWS credentials (run: aws configure)\n' +
          '  2. Add 360_UAT_URL to .env for UI-based login fallback'
        );
      }

      if (verbose) console.log('Using UI-based login fallback...');

      context = await loginUI(page, {
        username: userCredentials.username,
        password: userCredentials.password,
        totpSecret: userCredentials.totpSecret,
        firm,
        url: uiUrl,
        uid: userCredentials.uid,
        verbose
      });

      // For UI-based login, config needs baseUrl from context
      config = {
        baseUrl: context.baseUrl,
        ...userCredentials
      };
    }

    // Determine fund/member requirements
    let needsFund = fund === 'create';
    let needsMember = member === 'create';

    if (fund !== 'create' && fund !== 'skip' && pageKey) {
      const requirements = determineRequirements(pageKey, menuMapping);
      needsFund = requirements.requiresFund;
      needsMember = requirements.requiresMember;
    }

    // Override with explicit skip
    if (fund === 'skip') needsFund = false;
    if (member === 'skip') needsMember = false;

    // Step 4: Create fund if needed
    if (needsFund) {
      if (verbose) console.log('Step 4: Creating fund...');
      const fundResult = await createFund({
        firm,
        uid: config.uid,
        baseUrl: config.baseUrl,
        name: fundName,
        entityType
      });

      context.fundId = fundResult.fundId;
      context.fundName = fundResult.fundName;
    }

    // Step 5: Create member if needed
    if (needsMember) {
      if (!context.fundId) {
        throw new Error('Cannot create member without fund. Fund must be created first.');
      }

      if (verbose) console.log('Step 5: Creating member...');
      const memberResult = await createMember({
        firm,
        uid: config.uid,
        fundId: context.fundId,
        baseUrl: config.baseUrl,
        ...memberData
      });

      context.memberId = memberResult.memberId;
      context.memberCode = memberResult.memberCode;
      context.memberName = memberResult.memberName;
      context.peopleId = memberResult.peopleId;
    }

    // Step 6: Navigate to page
    if (pageKey) {
      const parts = pageKey.split('.');
      const section = parts[0];
      const pageName = parts[1];
      const pageConfig = menuMapping[section][pageName];

      let url = `${config.baseUrl}${pageConfig.url}`;

      // Add query parameters
      if (!pageConfig.external) {
        url += `?firm=${firm}&uid=${config.uid}`;

        if (context.fundId) {
          url += `&mid=${context.fundId}`;
        }
      }

      if (verbose) console.log(`Step 6: Navigating to ${pageConfig.name}...`);
      await page.goto(url);
      await page.waitForLoadState('networkidle');
    }

    if (verbose) {
      console.log('\n✓ Setup complete');
      console.log('Context:', context);
      console.log('======================\n');
    }

    return context;

  } catch (error) {
    console.error('Setup failed:', error.message);
    throw error;
  }
}

/**
 * Pre-warm token cache (call in test.beforeAll)
 * @returns {Promise<void>}
 */
setupTest.warmupCache = async function() {
  const userCredentials = loadUserCredentials();
  const awsConfig = await fetchAWSParameters(userCredentials.environment);

  const cognitoConfig = {
    url: awsConfig.cognitoURL,
    clientId: awsConfig.cognitoClientId
  };

  await warmupCache(
    userCredentials.username,
    userCredentials.password,
    userCredentials.totpSecret,
    cognitoConfig
  );
};

/**
 * Clear all caches (call in test.afterAll)
 */
setupTest.clearCache = function() {
  clearCache();
  clearSSOCache();
  clearAxiosCookies();
};

module.exports = setupTest;
