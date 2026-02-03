/**
 * Fund Creation via SF360 API
 * Creates SMSF, Trust, or Company entities for test isolation
 */

const axios = require('axios');
const authContext = require('./auth-context');

/**
 * Get current Australian financial year
 * @returns {number} Current financial year (e.g., 2024 for FY 2023-24)
 */
function getCurrentFinancialYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed

  // Australian FY runs from July 1 to June 30
  // If current month is July or later, FY is next year
  // Otherwise, FY is current year
  return currentMonth >= 7 ? currentYear + 1 : currentYear;
}

/**
 * Get default badge ID for fund creation
 * @param {string} firm - Firm short name
 * @param {number} uid - User ID
 * @param {string} baseUrl - SF360 server URL
 * @returns {Promise<string>} Badge ID
 */
async function getDefaultBadgeId(firm, uid, baseUrl) {
  try {
    const cookieHeader = authContext.getCookieHeader();
    console.log(`DEBUG: Cookie header (first 200 chars): ${cookieHeader.substring(0, 200)}`);
    console.log(`DEBUG: Cookies array:`, authContext.cookies.map(c => `${c.key} domain=${c.domain}`));

    const response = await axios.post(
      `${baseUrl}/d/Badges/getBadgeNames?firm=${firm}&uid=${uid}`,
      firm,
      {
        headers: {
          'Content-Type': 'text/plain',
          'Cookie': cookieHeader
        }
      }
    );

    const badges = response.data;

    console.log(`DEBUG getBadgeNames response:`, JSON.stringify(badges).substring(0, 200));

    if (!badges || badges.length === 0) {
      throw new Error('No badges found for firm. Please create at least one badge in SF360.');
    }

    const badgeId = badges[0].id;
    console.log(`DEBUG: Selected badge ID: ${badgeId}`);
    return badgeId;
  } catch (error) {
    if (error.message.includes('No badges found')) {
      throw error;
    }
    throw new Error(`Failed to get badge ID: ${error.message}`);
  }
}

/**
 * Build fund payload for API request
 * @param {Object} options - Payload options
 * @returns {Object} Fund creation payload
 */
function buildFundPayload(options) {
  const {
    firm,
    entityType,
    fundName,
    badgeId,
    tfn = '',
    abn = '',
    establishmentDate,
    yearFrom,
    yearTo
  } = options;

  const payload = {
    userId: null,
    firmShortName: firm,
    product: 'SFUND',
    master: {
      type: 'fund',
      establishment: false,
      tfn: tfn,
      abn: abn,
      establishmentDate: establishmentDate,
      entityType: 'SMSF',  // Set to SMSF first (matches noncompliance line 148)
      fundType: 'SMSF',  // Always SMSF (matches noncompliance line 149)
      yearFrom: yearFrom,
      yearTo: yearTo,
      hideTfn: false,
      hideAbn: false,
      systemtStartDate: null,
      code: null,
      portalCode: null,  // Let SF360 auto-generate the code
      name: fundName,
      firstName: '',
      surname: '',
      id: null,
      docUUID: null,
      entityType: entityType === 'SMSF' ? 'SMSF' : entityType === 'Trust' ? 'BillableTrust' : 'BillableCompany',  // Overwrite with actual type (matches noncompliance line 162)
      badgeId: badgeId,
      childEntities: null,
      remarkStatus: 'FROM_QUICK_SETUP'
    },
    entityList: []
  };

  // Add entity-type-specific fields
  if (entityType === 'Trust') {
    payload.master.billableTrustType = 'Discretionary';
  } else if (entityType === 'Company') {
    payload.master.acn = '';
    payload.master.billableCompanyType = 'Private';
  }

  return payload;
}

/**
 * Create a new fund via SF360 API
 * @param {Object} options - Fund creation options
 * @param {string} options.firm - Firm short name
 * @param {number} options.uid - User ID
 * @param {string} options.baseUrl - SF360 server URL
 * @param {string} [options.name] - Fund name (default: auto-generated)
 * @param {string} [options.entityType='SMSF'] - Entity type (SMSF/Trust/Company)
 * @param {string} [options.tfn=''] - Tax File Number
 * @param {string} [options.abn=''] - Australian Business Number
 * @param {number} [options.financialYear] - Financial year (default: current)
 * @returns {Promise<Object>} { fundId, fundName }
 */
async function createFund(options) {
  const {
    firm,
    uid,
    baseUrl,
    name,
    entityType = 'SMSF',
    tfn = '',
    abn = '',
    financialYear
  } = options;

  // Step 1: Generate unique fund name if not provided (declare at function level for scope)
  const fundName = name || `AutoTest ${entityType} ${Date.now()}`;

  try {
    console.log(`Creating ${entityType}: ${fundName}...`);

    // Step 2: Get badge ID (required for fund creation)
    const badgeId = await getDefaultBadgeId(firm, uid, baseUrl);
    console.log(`DEBUG: Using badge ID for payload: ${badgeId}`);

    // Step 3: Calculate financial year dates
    const fyStart = financialYear || getCurrentFinancialYear();
    const establishmentDate = `${fyStart - 5}-07-01T00:00:00.000+0000`;
    const yearFrom = `${fyStart - 1}-07-01T00:00:00.000+0000`;
    const yearTo = `${fyStart}-06-30T00:00:00.000+0000`;

    // Step 4: Build payload
    const payload = buildFundPayload({
      firm,
      entityType,
      fundName,
      badgeId,
      tfn,
      abn,
      establishmentDate,
      yearFrom,
      yearTo
    });

    // Step 5: Create fund via API
    const url = `${baseUrl}/d/Entities/addEntity?firm=${firm}&uid=${uid}`;
    console.log(`DEBUG: Posting to ${url}`);
    console.log(`DEBUG: Payload badgeId: ${payload.master.badgeId}`);

    const response = await axios.post(url, payload, {
      headers: {
        'Cookie': authContext.getCookieHeader()
      }
    });

    console.log(`DEBUG: Response status: ${response.status}, data: ${JSON.stringify(response.data).substring(0, 100)}`);
    const fundId = response.data;

    console.log(`✓ Fund created: ${fundName} (${fundId})`);

    return {
      fundId,
      fundName
    };

  } catch (error) {
    if (error.message.includes('No badges found')) {
      throw error;
    }
    if (error.response) {
      // Check if response.data contains a fund ID despite 500 error
      const responseData = error.response.data;
      if (error.response.status === 500 && responseData && (typeof responseData === 'number' || typeof responseData === 'string')) {
        console.log(`⚠️  Server returned 500 but with fund ID: ${responseData} (treating as success)`);
        const fundId = String(responseData);
        return {
          fundId,
          fundName
        };
      }

      const details = responseData ? JSON.stringify(responseData).substring(0, 200) : '';
      throw new Error(`Fund creation failed: ${error.response.status} - ${error.response.statusText}. ${details}`);
    } else if (error.request) {
      throw new Error('Fund creation failed: No response from server');
    } else {
      throw new Error(`Fund creation failed: ${error.message}`);
    }
  }
}

module.exports = {
  createFund,
  getDefaultBadgeId,
  buildFundPayload,
  getCurrentFinancialYear
};
