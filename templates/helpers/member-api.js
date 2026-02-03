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
    baseUrl,
    firstName = 'Test',
    lastName = `Member${Date.now()}`,
    dateOfBirth = '1980-01-01',
    sex = 'Male',
    email = '',
    mobile = '',
    tfn = ''
  } = options;

  const requestBody = {
    people: {
      firstname: firstName,
      surname: lastName,
      birthday: dateOfBirth.split('-').reverse().join('/'), // Convert YYYY-MM-DD to DD/MM/YYYY
      deathDay: null,
      title: sex === 'Male' ? 'Mr' : 'Ms',
      sex: sex,
      email: email,
      phone: '',
      mobileNumber: mobile,
      tfn: tfn,
      abn: '',
      otherNames: '',
      preferredName: '',
      birthPlace: '',
      birthState: '',
      birthCountry: '',
      addressDto: {}
    }
  };

  try {
    const response = await axios.post(
      `${baseUrl}/entity/mvc/base/addPeople?firm=${firm}&uid=${uid}`,
      requestBody,
      {
        headers: {
          'Cookie': authContext.getCookieHeader()
        }
      }
    );

    return response.data; // Returns companyId (peopleId)
  } catch (error) {
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
 * Step 2: Get person details including member code
 * @param {string} peopleId - People ID from Step 1
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Person details with memberCode
 */
async function getPersonDetails(peopleId, options) {
  const { firm, uid, baseUrl } = options;

  try {
    const response = await axios.get(
      `${baseUrl}/entity/mvc/base/getPersonDetails/${peopleId}?firm=${firm}&uid=${uid}`,
      {
        headers: {
          'Cookie': authContext.getCookieHeader()
        }
      }
    );

    return response.data; // Contains id (peopleId) and pcode (memberCode)
  } catch (error) {
    if (error.response) {
      throw new Error(`Get person details failed: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Get person details failed: No response from server');
    } else {
      throw new Error(`Get person details failed: ${error.message}`);
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
    memberName
  } = options;

  const requestBody = {
    id: null,
    peopleId: peopleId,
    entityId: fundId,
    memberName: memberName,
    memberCode: memberCode,
    accountType: 'Accumulation',
    startDate: null,
    endDate: null,
    defaultAccount: true,
    transferCapType: 'GeneralTransferBalance',
    generalTransferBalance: '1600000.00',
    generalTransferBalanceAsAtDate: null,
    fields: [
      {
        memberAccountId: null,
        fieldName: 'Employer',
        isShow: false,
        fieldValue: '',
        withCheckbox: true
      },
      {
        memberAccountId: null,
        fieldName: "Employer's ABN",
        isShow: false,
        fieldValue: '',
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
    const response = await axios.post(
      `${baseUrl}/chart/chartmvc/MemberController/save?firm=${firm}&uid=${uid}`,
      requestBody,
      {
        headers: {
          'Cookie': authContext.getCookieHeader()
        }
      }
    );

    return response.data; // Returns memberId
  } catch (error) {
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

    // Step 1: Create contact
    console.log('  Step 1/3: Creating contact...');
    const peopleId = await createContact({
      firm,
      uid,
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
    const personDetails = await getPersonDetails(peopleId, {
      firm,
      uid,
      baseUrl
    });

    const memberCode = personDetails.pcode;

    // Step 3: Create accumulation account
    console.log('  Step 3/3: Creating accumulation account...');
    const memberId = await createAccumulationAccount({
      firm,
      uid,
      fundId,
      baseUrl,
      memberCode,
      peopleId,
      memberName
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
  getPersonDetails,
  createAccumulationAccount
};
