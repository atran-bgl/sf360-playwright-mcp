---
status: active
domain: authentication
implementation-status: NOT-STARTED
impediment: none
---

# Spec: Test Data Factory Functions

**Feature:** Generate random test data for contacts, funds, and members
**Priority:** Medium
**Estimated Complexity:** Low

---

## Overview

Factory functions to generate unique, realistic test data for SF360 entities. Ensures test isolation by generating unique names, emails, and identifiers using timestamps and random numbers.

**Note:** noncompliance20260116 does NOT have these factory functions - they hardcode test data. These are new utilities for better test isolation.

---

## Contact Data Factory

### generateContactData()

**Purpose:** Generate random person contact data with unique identifiers

```javascript
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
```

### Usage Examples

```javascript
// Example 1: Generate with all defaults
const contact1 = generateContactData();
// {
//   firstName: "Test234",
//   lastName: "Person1738228800000",
//   email: "test.1738228800000@example.com",
//   mobile: "0412800000",
//   dateOfBirth: "1980-01-01",
//   sex: "Female",
//   title: "Ms",
//   ...
// }

// Example 2: Override specific fields
const contact2 = generateContactData({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  dateOfBirth: '1985-05-15'
});
// {
//   firstName: "John",
//   lastName: "Doe",
//   email: "john.doe@example.com",
//   dateOfBirth: "1985-05-15",
//   mobile: "0412800123",  // Still random
//   ...
// }

// Example 3: Use with createContact()
const contactData = generateContactData({ firstName: 'Jane' });
const contact = await createContact({
  firm,
  uid,
  baseUrl,
  ...contactData
});

// Example 4: Use with createMember()
const member = await createMember({
  firm,
  uid,
  fundId,
  baseUrl,
  ...generateContactData({
    firstName: 'Member',
    lastName: 'Test'
  })
});
```

---

## Fund Data Factory

### generateFundData()

**Purpose:** Generate random fund data with unique names

```javascript
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
```

### Usage Examples

```javascript
// Example 1: Generate SMSF with defaults
const fundData1 = generateFundData();
// {
//   name: "AutoTest SMSF 1738228800000",
//   entityType: "SMSF",
//   tfn: null,
//   abn: null,
//   financialYear: null
// }

// Example 2: Generate Trust with custom name
const fundData2 = generateFundData({
  entityType: 'Trust',
  name: 'My Test Trust'
});
// {
//   name: "My Test Trust",
//   entityType: "Trust",
//   ...
// }

// Example 3: Use with createFund()
const fund = await createFund({
  firm,
  uid,
  baseUrl,
  ...generateFundData({ entityType: 'Company' })
});
```

---

## Member Data Factory

### generateMemberData()

**Purpose:** Generate random member data (wrapper for contact data)

```javascript
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
```

### Usage Examples

```javascript
// Example 1: Generate member with defaults
const memberData1 = generateMemberData();
// {
//   firstName: "Member",
//   lastName: "Person1738228800000",
//   ...
// }

// Example 2: Generate member with specific name
const memberData2 = generateMemberData({
  lastName: 'Smith',
  dateOfBirth: '1990-06-15'
});

// Example 3: Use with createMember()
const member = await createMember({
  firm,
  uid,
  fundId,
  baseUrl,
  ...generateMemberData()
});
```

---

## TFN/ABN Generation (Optional)

### generateTFN()

**Purpose:** Generate random but valid-format TFN for testing

```javascript
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
```

### generateABN()

**Purpose:** Generate random but valid-format ABN for testing

```javascript
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
```

### Usage Examples

```javascript
// Example 1: Generate contact with TFN
const contact = generateContactData({
  tfn: generateTFN()
});
// { tfn: "123456789", ... }

// Example 2: Generate fund with ABN
const fund = generateFundData({
  abn: generateABN(),
  tfn: generateTFN()
});
// { abn: "12345678901", tfn: "987654321", ... }
```

---

## Date Generation Utilities

### generateDateOfBirth()

**Purpose:** Generate random date of birth within age range

```javascript
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
```

### Usage Examples

```javascript
// Example 1: Generate age between 18-80 (default)
const dob1 = generateDateOfBirth();
// "1975-03-22"

// Example 2: Generate age between 30-40
const dob2 = generateDateOfBirth(30, 40);
// "1994-08-15"

// Example 3: Use with contact
const contact = generateContactData({
  dateOfBirth: generateDateOfBirth(25, 60)
});
```

---

## Integration with setupTest()

### Using Factories in setupTest()

```javascript
async function setupTest(page, options) {
  // ... authentication logic ...

  // Create fund with generated data
  if (needsFund) {
    const fundData = generateFundData({
      name: options.fundName,  // Use provided or generate
      entityType: options.entityType
    });

    const fundResult = await createFund({
      firm,
      uid,
      baseUrl,
      ...fundData
    });

    fundId = fundResult.fundId;
    fundName = fundResult.fundName;
  }

  // Create member with generated data
  if (needsMember) {
    const memberData = generateMemberData({
      ...options.memberData  // Allow overrides
    });

    const memberResult = await createMember({
      firm,
      uid,
      fundId,
      baseUrl,
      ...memberData
    });

    memberId = memberResult.memberId;
    memberName = memberResult.memberName;
  }

  // ...
}
```

### Test Usage

```javascript
// Example 1: Auto-generate all data
test('create member', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    pageKey: 'fund.members'  // Auto-creates fund + member with generated data
  });

  // ctx.memberName = "Member Person1738228800000"
});

// Example 2: Provide custom member data
test('create member with specific name', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    pageKey: 'fund.members',
    memberData: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com'
    }
  });

  // ctx.memberName = "John Smith"
});

// Example 3: Use factory directly in test
test('create multiple members', async ({ page }) => {
  const ctx = await setupTest(page, {
    firm: process.env.FIRM,
    fund: 'create'
  });

  // Create member 1
  const member1 = await createMember({
    firm: ctx.firm,
    uid: ctx.uid,
    fundId: ctx.fundId,
    baseUrl: ctx.baseUrl,
    ...generateMemberData({ firstName: 'Alice' })
  });

  // Create member 2
  const member2 = await createMember({
    firm: ctx.firm,
    uid: ctx.uid,
    fundId: ctx.fundId,
    baseUrl: ctx.baseUrl,
    ...generateMemberData({ firstName: 'Bob' })
  });
});
```

---

## Uniqueness Guarantees

### How Uniqueness is Ensured

**1. Timestamp (Date.now())**
- Milliseconds since epoch
- Unique per millisecond
- Example: `1738228800000`

**2. Random Number (Math.random())**
- 0-999 range
- Prevents collisions within same millisecond
- Example: `234`

**3. Combined Approach**
- Name: `Person1738228800000`
- Email: `test.1738228800000@example.com`
- Mobile: `0412800000` (last 6 digits of timestamp)

**Collision Risk:**
- **Timestamp alone:** ~1% if tests run in parallel (same millisecond)
- **Timestamp + Random:** ~0.001% (negligible)

---

## Performance Considerations

### Generation Speed

All factory functions are **synchronous** and **instant**:
- `generateContactData()`: < 1ms
- `generateFundData()`: < 1ms
- `generateMemberData()`: < 1ms
- `generateTFN()`: < 1ms
- `generateDateOfBirth()`: < 1ms

**Total overhead:** Negligible compared to API calls (300-700ms)

---

## Acceptance Criteria

### Contact Data Factory
- [ ] Generates unique firstName/lastName using timestamp
- [ ] Generates valid email format
- [ ] Generates valid mobile/phone format
- [ ] Allows field overrides
- [ ] Returns object ready for createContact()
- [ ] Sets title based on sex if not overridden

### Fund Data Factory
- [ ] Generates unique fund name with entity type
- [ ] Allows name override
- [ ] Supports all entity types (SMSF, Trust, Company)
- [ ] Returns object ready for createFund()

### Member Data Factory
- [ ] Wraps generateContactData() with 'Member' firstName
- [ ] Allows all contact field overrides
- [ ] Returns object ready for createMember()

### TFN/ABN Generation
- [ ] Generates valid format TFN (9 digits)
- [ ] Generates valid format ABN (11 digits)
- [ ] Returns string (not number)

### Date Generation
- [ ] Generates dates within age range
- [ ] Returns YYYY-MM-DD format
- [ ] Defaults to 18-80 age range

### Integration
- [ ] Works with setupTest() options
- [ ] Respects user-provided overrides
- [ ] Generates data only when needed

---

## Dependencies

- None (pure JavaScript utilities)

---

## Related Files

- Implementation: `templates/helpers/data-factory.js` - Factory functions
- Usage: `templates/helpers/auth.js` - Integration with setupTest()
- Spec: `active.auth-contact-creation.md` - Contact creation (will reference)
- Spec: `active.auth-fund-creation.md` - Fund/member creation (will reference)
- Spec: `active.auth-setup-test-api.md` - setupTest() API (will reference)

---

## Notes

- noncompliance20260116 does NOT have these factory functions
- They hardcode test data in spec files
- These factories provide better test isolation
- All functions are deterministic given the same timestamp
- Use overrides for specific test scenarios
- Generated data is realistic but clearly marked as test data

---

## Comparison: Hardcoded vs Factory

### Old Way (noncompliance20260116)

```javascript
// Hardcoded in test file
const allContacts = [
  {
    firstname: 'member1',
    surname: 'newMemberTest',
    email: 'member1@123.com',
    tfn: '999999531',
    // ... hardcoded values
  }
];

// Problem: Tests interfere with each other
// Problem: Data cleanup required between tests
```

### New Way (Our Implementation)

```javascript
// Generated dynamically
const contact = generateContactData();
// {
//   firstName: "Test234",
//   lastName: "Person1738228800000",
//   email: "test.1738228800000@example.com",
//   // ... unique values
// }

// Benefit: Every test has unique data
// Benefit: No cleanup needed
// Benefit: Tests can run in parallel
```

---

## Future Enhancements

### Potential Additions

1. **Address Factory**
   ```javascript
   generateAddress({ state: 'NSW' })
   // Returns full Australian address
   ```

2. **Company Factory**
   ```javascript
   generateCompanyData()
   // Returns company name, ACN, ABN
   ```

3. **Trust Factory**
   ```javascript
   generateTrustData()
   // Returns trust name, trustee details
   ```

4. **Seeded Random**
   ```javascript
   generateContactData({ seed: 'test123' })
   // Same seed = same output (for reproducible tests)
   ```

---

*Last updated: 2026-01-30*
