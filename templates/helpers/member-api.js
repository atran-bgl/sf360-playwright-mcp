/**
 * Member Creation via SF360 API (3-Step Process)
 * 1. Create Contact → peopleId
 * 2. Retrieve Member Data → memberCode
 * 3. Create Accumulation Account → memberId
 */

const axios = require('axios');
const authContext = require('./auth-context');

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Step 1: Create contact/person entity
 * @param {Object} options - Contact creation options
 * @returns {Promise<string>} peopleId (companyId)
 */
async function createContact(options) {
  const {
    firm,
    uid,
    fundId,
    baseUrl,
    firstName = 'Test',
    lastName = `Member${Date.now()}`,
    dateOfBirth = '1980-01-01',
    sex = 'Male',
    email = '',
    mobile = '',
    tfn = ''
  } = options;

  // Build request body with only required fields initially
  const requestBody = {
    people: {
      firstname: firstName,
      surname: lastName,
      birthday: dateOfBirth.split('-').reverse().join('/'), // Convert YYYY-MM-DD to DD/MM/YYYY
      deathDay: null,
      addressDto: {}
    }
  };

  // Only add optional fields if they have values (not empty strings)
  // Empty strings cause enum deserialization errors for fields like birthState
  const optionalFields = {
    title: sex === 'Male' ? 'Mr' : 'Ms',
    sex: sex.toUpperCase(), // API expects "MALE" or "FEMALE" (uppercase)
    email: email,
    mobileNumber: mobile,
    tfn: tfn
  };

  for (const [field, value] of Object.entries(optionalFields)) {
    if (value !== null && value !== undefined && value !== '') {
      requestBody.people[field] = value;
    }
  }

  // Build URL with fundId if provided (required after fund creation)
  const fundParam = fundId ? `&mid=${fundId}` : '';
  const url = `${baseUrl}/entity/mvc/base/addPeople?firm=${firm}&uid=${uid}&personProxyId=1${fundParam}`;

  try {
    console.log(`DEBUG createContact: Posting to ${url}`);
    console.log(`DEBUG createContact: Request body:`, JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      url,
      requestBody,
      {
        headers: {
          'Cookie': authContext.getCookieHeader()
        }
      }
    );

    console.log(`DEBUG createContact: Response status ${response.status}, data:`, response.data);
    return response.data; // Returns companyId when personProxyId=1
  } catch (error) {
    console.log(`DEBUG createContact ERROR:`, error.response?.status, error.response?.statusText);
    console.log(`DEBUG createContact ERROR response data:`, JSON.stringify(error.response?.data, null, 2));
    if (error.response) {
      throw new Error(`Contact creation failed: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Contact creation failed: No response from server');
    } else {
      throw new Error(`Contact creation failed: ${error.message}`);
    }
  }
}

/**
 * Step 2a: Get peopleId from companyId
 * @param {string} companyId - Company ID from Step 1
 * @param {Object} options - Request options
 * @returns {Promise<string>} peopleId
 */
async function getPeopleIdFromCompanyId(companyId, options) {
  const { firm, uid, fundId, baseUrl } = options;

  const payload = {
    filter: {
      example: {
        company: {
          type: "company",
          id: companyId
        },
        hideMobile: false,
        hideBirthday: false,
        hideTfn: false,
        notProvidedNumber: false
      }
    }
  };

  try {
    const response = await axios.post(
      `${baseUrl}/entity/mvc/base/queryPeople?firm=${firm}&uid=${uid}&mid=${fundId}`,
      payload,
      {
        headers: {
          'Cookie': authContext.getCookieHeader()
        }
      }
    );

    return response.data.records[0].id; // Returns peopleId
  } catch (error) {
    if (error.response) {
      throw new Error(`Get peopleId failed: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Get peopleId failed: No response from server');
    } else {
      throw new Error(`Get peopleId failed: ${error.message}`);
    }
  }
}

/**
 * Step 2b: Get member data by peopleId
 * @param {string} peopleId - People ID from Step 2a
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Member data including code, name, etc.
 */
async function getMemberDataByPeopleId(peopleId, options) {
  const { firm, uid, fundId, baseUrl } = options;

  try {
    const response = await axios.post(
      `${baseUrl}/chart/chartmvc/MemberController/contact/${peopleId}?firm=${firm}&uid=${uid}&mid=${fundId}`,
      {},
      {
        headers: {
          'Cookie': authContext.getCookieHeader()
        }
      }
    );

    return response.data; // Contains id, code, companyId, firstName, surname, name
  } catch (error) {
    if (error.response) {
      throw new Error(`Get member data failed: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Get member data failed: No response from server');
    } else {
      throw new Error(`Get member data failed: ${error.message}`);
    }
  }
}

/**
 * Step 3: Create member accumulation account
 * @param {Object} options - Accumulation account options
 * @returns {Promise<string>} memberId
 */
async function createAccumulationAccount(options) {
  const {
    firm,
    uid,
    fundId,
    baseUrl,
    memberCode,
    peopleId,
    firstName,
    lastName,
    startDate = new Date().toISOString().split('T')[0] // Default to today YYYY-MM-DD
  } = options;

  // Format date as YYYY-MM-DDT10:00:00.000+1000 (Australian timezone)
  const formattedStartDate = `${startDate}T10:00:00.000+1000`;

  const requestBody = {
    id: null,
    code: memberCode,  // 'code' not 'memberCode'
    accDes: "Accumulation",
    accType: "Accumulation",
    startDate: formattedStartDate,
    endDate: null,
    serviceDate: formattedStartDate,
    taxFree: null,
    balance: null,
    proportion: null,
    toPrepare: false,
    reversionary: false,
    originalTerm: null,
    selectedAmount: null,
    needRefreshTransferCap: false,
    selectedDate: null,
    entireTakenOut: false,
    dob: null,
    conversionDate: null,
    conversionDateFromTRISRetire: null,
    changeContact: false,
    formType: null,
    timeframe: null,
    nominationEndDate: null,
    capAt1thJuly: false,
    reversionDate: null,
    original: false,
    atFirstYear: false,
    reversionProportion: null,
    peopleId: null,
    originalId: null,
    allowedFunds: false,
    allowedTrusts: false,
    allowedCompanies: false,
    externalMemberCode: null,
    accmulationTotal: null,
    retirementPhaseTotal: null,
    noJournalCreate: false,
    reversionAccountId: null,
    checkJournalFromDate: formattedStartDate,
    memberId: null,
    fundId: fundId,  // 'fundId' not 'entityId'
    accountId: null,
    contact: {  // Required contact object
      id: peopleId,
      name: `${lastName}, ${firstName}`
    },
    beneficiaries: [],
    financials: [  // 'financials' not 'fields'
      {
        id: null,
        memberAccountId: null,
        fieldName: "Current Salary",
        isShow: true,
        fieldValue: "",
        withCheckbox: true
      },
      {
        id: null,
        memberAccountId: null,
        fieldName: "Previous Salary",
        isShow: true,
        fieldValue: "",
        withCheckbox: true
      },
      {
        id: null,
        memberAccountId: null,
        fieldName: "Death Benefit",
        isShow: true,
        fieldValue: "",
        withCheckbox: true
      },
      {
        id: null,
        memberAccountId: null,
        fieldName: "Disability Benefit",
        isShow: true,
        fieldValue: "",
        withCheckbox: true
      },
      {
        id: null,
        memberAccountId: null,
        fieldName: "Centrelink Product Reference",
        isShow: false,
        fieldValue: "",
        withCheckbox: true
      },
      {
        id: null,
        memberAccountId: null,
        fieldName: "Centrelink Original Purchase Price",
        isShow: false,
        fieldValue: "",
        withCheckbox: false
      },
      {
        id: null,
        memberAccountId: null,
        fieldName: "Employer's ABN",
        isShow: false,
        fieldValue: "",
        withCheckbox: true
      }
    ],
    cease: false,
    amount: null,
    maintain: false,
    preserved: null,
    restricted: null,
    unrestricted: null,
    taxed: null,
    untaxed: null
  };

  try {
    console.log(`DEBUG createAccumulationAccount: Posting to ${baseUrl}/chart/chartmvc/MemberController/save?firm=${firm}&uid=${uid}&mid=${fundId}`);
    console.log(`DEBUG createAccumulationAccount: Request body:`, JSON.stringify(requestBody, null, 2).substring(0, 500));

    const response = await axios.post(
      `${baseUrl}/chart/chartmvc/MemberController/save?firm=${firm}&uid=${uid}&mid=${fundId}`,
      requestBody,
      {
        headers: {
          'Cookie': authContext.getCookieHeader()
        }
      }
    );

    console.log(`DEBUG createAccumulationAccount: Response status ${response.status}, data:`, response.data);
    return response.data; // Returns memberId
  } catch (error) {
    console.log(`DEBUG createAccumulationAccount ERROR:`, error.response?.status, error.response?.statusText);
    console.log(`DEBUG createAccumulationAccount ERROR response data:`, JSON.stringify(error.response?.data, null, 2));
    if (error.response) {
      throw new Error(`Accumulation account creation failed: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Accumulation account creation failed: No response from server');
    } else {
      throw new Error(`Accumulation account creation failed: ${error.message}`);
    }
  }
}

/**
 * Create a new member via 3-step SF360 API process
 * @param {Object} options - Member creation options
 * @param {string} options.firm - Firm short name
 * @param {number} options.uid - User ID
 * @param {string} options.fundId - Fund ID (required)
 * @param {string} options.baseUrl - SF360 server URL
 * @param {string} [options.firstName='Test'] - First name
 * @param {string} [options.lastName] - Last name (default: Member{timestamp})
 * @param {string} [options.dateOfBirth='1980-01-01'] - Date of birth (YYYY-MM-DD)
 * @param {string} [options.sex='Male'] - Sex (Male/Female)
 * @param {string} [options.email=''] - Email address
 * @param {string} [options.mobile=''] - Mobile number
 * @param {string} [options.tfn=''] - Tax File Number
 * @returns {Promise<Object>} { memberId, memberCode, memberName, peopleId }
 */
async function createMember(options) {
  const {
    firm,
    uid,
    fundId,
    baseUrl,
    firstName = 'Test',
    lastName = `Member${Date.now()}`,
    dateOfBirth = '1980-01-01',
    sex = 'Male',
    email = '',
    mobile = '',
    tfn = ''
  } = options;

  if (!fundId) {
    throw new Error('fundId is required for member creation');
  }

  const memberName = `${firstName} ${lastName}`;

  try {
    console.log(`Creating member: ${memberName}...`);

    // Step 1: Create contact (returns companyId when personProxyId=1)
    console.log('  Step 1/3: Creating contact...');
    const companyId = await createContact({
      firm,
      uid,
      fundId,
      baseUrl,
      firstName,
      lastName,
      dateOfBirth,
      sex,
      email,
      mobile,
      tfn
    });

    // Wait 500ms for SF360 processing
    await sleep(500);

    // Step 2: Retrieve member data
    console.log('  Step 2/3: Retrieving member data...');
    const peopleId = await getPeopleIdFromCompanyId(companyId, {
      firm,
      uid,
      fundId,
      baseUrl
    });

    const memberData = await getMemberDataByPeopleId(peopleId, {
      firm,
      uid,
      fundId,
      baseUrl
    });

    console.log(`DEBUG: memberData:`, JSON.stringify(memberData, null, 2));
    const memberCode = memberData.code;
    console.log(`DEBUG: memberCode from memberData.code:`, memberCode);

    // Step 3: Create accumulation account
    console.log('  Step 3/3: Creating accumulation account...');
    const memberId = await createAccumulationAccount({
      firm,
      uid,
      fundId,
      baseUrl,
      memberCode,
      peopleId,
      firstName,
      lastName
    });

    console.log(`✓ Member created: ${memberName} (ID: ${memberId}, Code: ${memberCode})`);

    return {
      memberId,
      memberCode,
      memberName,
      peopleId
    };

  } catch (error) {
    // Re-throw with context
    throw new Error(`Member creation failed for ${memberName}: ${error.message}`);
  }
}

module.exports = {
  createMember,
  createContact,
  getPeopleIdFromCompanyId,
  getMemberDataByPeopleId,
  createAccumulationAccount
};
