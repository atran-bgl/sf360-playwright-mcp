/**
 * Test Data Factory Functions
 * Generate unique, realistic test data for SF360 entities
 */

/**
 * Generate random contact data for testing
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Contact data ready for createContact()
 */
function generateContactData(overrides = {}) {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);

  const defaults = {
    // Core fields
    firstName: `Test${randomNum}`,
    lastName: `Person${timestamp}`,

    // Contact details
    email: `test.${timestamp}@example.com`,
    mobile: `0412${timestamp.toString().slice(-6)}`,
    phone: `0${timestamp.toString().slice(-8)}`,

    // Personal details
    dateOfBirth: '1980-01-01',  // Safe default age (45 years old)
    sex: Math.random() > 0.5 ? 'Male' : 'Female',
    title: null,  // Will be set based on sex

    // Tax details (optional)
    tfn: null,
    abn: null,

    // Address (optional)
    streetLine1: null,
    suburb: null,
    state: null,
    postCode: null,
    country: 'Australia'
  };

  // Set title based on sex if not overridden
  if (!overrides.title) {
    defaults.title = defaults.sex === 'Male' ? 'Mr' : 'Ms';
  }

  return { ...defaults, ...overrides };
}

/**
 * Generate random fund data for testing
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Fund data ready for createFund()
 */
function generateFundData(overrides = {}) {
  const timestamp = Date.now();
  const entityType = overrides.entityType || 'SMSF';

  const defaults = {
    name: `AutoTest ${entityType} ${timestamp}`,
    entityType: entityType,
    tfn: null,  // Optional
    abn: null,  // Optional
    financialYear: null  // Will use current FY if not provided
  };

  return { ...defaults, ...overrides };
}

/**
 * Generate random member data for testing
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Member data ready for createMember()
 */
function generateMemberData(overrides = {}) {
  // Members are just contacts with additional context
  return generateContactData({
    firstName: 'Member',
    ...overrides
  });
}

/**
 * Generate random TFN (Tax File Number) for testing
 * @returns {string} 9-digit TFN
 */
function generateTFN() {
  // Generate 9 random digits
  const digits = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10)
  );

  return digits.join('');
}

/**
 * Generate random ABN (Australian Business Number) for testing
 * @returns {string} 11-digit ABN
 */
function generateABN() {
  // Generate 11 random digits
  const digits = Array.from({ length: 11 }, () =>
    Math.floor(Math.random() * 10)
  );

  return digits.join('');
}

/**
 * Generate random date of birth for testing
 * @param {number} minAge - Minimum age (default: 18)
 * @param {number} maxAge - Maximum age (default: 80)
 * @returns {string} Date in YYYY-MM-DD format
 */
function generateDateOfBirth(minAge = 18, maxAge = 80) {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - maxAge);

  const maxDate = new Date(today);
  maxDate.setFullYear(today.getFullYear() - minAge);

  const randomTime = minDate.getTime() +
    Math.random() * (maxDate.getTime() - minDate.getTime());

  const randomDate = new Date(randomTime);

  const year = randomDate.getFullYear();
  const month = (randomDate.getMonth() + 1).toString().padStart(2, '0');
  const day = randomDate.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

module.exports = {
  generateContactData,
  generateFundData,
  generateMemberData,
  generateTFN,
  generateABN,
  generateDateOfBirth
};
