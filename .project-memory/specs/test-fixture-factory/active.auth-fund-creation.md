---
status: active
domain: authentication
implementation-status: NOT-STARTED
impediment: none
---

# Spec: Fund & Member Creation via API

**Feature:** Create funds and members via SF360 API for test isolation
**Priority:** High
**Estimated Complexity:** Medium

---

## Overview

Create fresh funds (SMSF/Trust/Company) and members via SF360 API for each test, ensuring complete test isolation with predictable starting state.

---

## Fund Creation

### createFund() API

```javascript
/**
 * Create a new fund via SF360 API
 * @param {Object} options - Fund creation options
 * @returns {Promise<Object>} { fundId, fundName }
 */
async function createFund(options)
```

### Options Parameter

```typescript
interface CreateFundOptions {
  firm: string;                    // Firm short name
  uid: number;                     // User ID
  baseUrl: string;                 // SF360 server URL
  name?: string;                   // Fund name (default: auto-generated)
  entityType?: 'SMSF' | 'Trust' | 'Company';  // Default: 'SMSF'
  tfn?: string;                    // Tax File Number (optional)
  abn?: string;                    // Australian Business Number (optional)
  financialYear?: number;          // Financial year (default: current)
}
```

### Implementation Flow

**Note:** For generating unique test data, see `active.auth-data-factory.md` for `generateFundData()` factory function.

```javascript
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

  // Step 1: Generate unique fund name if not provided
  const fundName = name || `AutoTest ${entityType} ${Date.now()}`;

  // Step 2: Get badge ID (required for fund creation)
  const badgeId = await getDefaultBadgeId(firm, uid, baseUrl);

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
  const response = await axios.post(
    `${baseUrl}/d/Entities/addEntity?firm=${firm}&uid=${uid}`,
    payload
  );

  const fundId = response.data;

  console.log(`✓ Fund created: ${fundName} (${fundId})`);

  return { fundId, fundName };
}
```

---

## Fund Payload Structure

### SMSF Payload

```javascript
function buildFundPayload(options) {
  const {
    firm,
    entityType,
    fundName,
    badgeId,
    tfn,
    abn,
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
      entityType: entityType,
      fundType: entityType,
      yearFrom: yearFrom,
      yearTo: yearTo,
      hideTfn: false,
      hideAbn: false,
      systemtStartDate: null,
      code: null,
      portalCode: null,
      name: fundName,
      firstName: '',
      surname: '',
      id: null,
      docUUID: null,
      badgeId: badgeId,
      childEntities: null,
      remarkStatus: 'FROM_QUICK_SETUP'
    },
    entityList: []
  };

  return payload;
}
```

### Trust Payload (Additional Fields)

```javascript
if (entityType === 'Trust') {
  payload.master.billableTrustType = options.trustType || 'Discretionary';
}
```

### Company Payload (Additional Fields)

```javascript
if (entityType === 'Company') {
  payload.master.acn = options.acn || '';
  payload.master.billableCompanyType = options.companyType || 'Private';
}
```

---

## Badge Retrieval

### getDefaultBadgeId() API

```javascript
/**
 * Get default badge ID for fund creation
 * @param {string} firm - Firm short name
 * @param {number} uid - User ID
 * @param {string} baseUrl - SF360 server URL
 * @returns {Promise<string>} Badge ID
 */
async function getDefaultBadgeId(firm, uid, baseUrl) {
  const response = await axios.post(
    `${baseUrl}/d/Badges/getBadgeNames?firm=${firm}&uid=${uid}`,
    firm,
    { headers: { 'Content-Type': 'text/plain' } }
  );

  const badges = response.data;

  if (!badges || badges.length === 0) {
    throw new Error('No badges found for firm. Create a badge first.');
  }

  // Return first badge ID
  return badges[0].id;
}
```

---

## Financial Year Calculation

### getCurrentFinancialYear()

```javascript
/**
 * Get current Australian financial year
 * Financial year runs from July 1 to June 30
 * @returns {number} Financial year (e.g., 2025 for FY 2024-2025)
 */
function getCurrentFinancialYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // If current month is July (6) or later, we're in next FY
  if (month >= 6) {
    return year + 1;
  } else {
    return year;
  }
}
```

Example:
- Date: 2025-01-28 → FY 2025 (2024-07-01 to 2025-06-30)
- Date: 2025-08-15 → FY 2026 (2025-07-01 to 2026-06-30)

---

## Member Creation

**⚠️ WARNING: This section is INCOMPLETE and requires significant updates.**

**From noncompliance20260116 source code analysis:**
- Member creation requires **3 separate steps**:
  1. Create Contact (person) via `/entity/mvc/base/addPeople`
  2. Get Member Data by peopleId via `/entity/mvc/base/getContacts` + `/entity/mvc/base/getPersonDetails`
  3. Create Accumulation Account via `/chart/chartmvc/MemberController/save`

**Source Reference:**
- `noncompliance20260116/tests/lib/member-util.js:360` - `addMember()` function
- `noncompliance20260116/tests/lib/contact-util.js:12` - `addPerson()` function
- `noncompliance20260116/tests/lib/member-util.js:52` - `addAccumulationAccount()` function

**TODO:** Create separate spec `active.auth-contact-creation.md` with complete implementation.

### createMember() API (Simplified - See Warning Above)

```javascript
/**
 * Create a new member via SF360 API
 * @param {Object} options - Member creation options
 * @returns {Promise<Object>} { memberId, memberCode, memberName, peopleId }
 */
async function createMember(options)
```

### Options Parameter

```typescript
interface CreateMemberOptions {
  firm: string;                    // Firm short name
  uid: number;                     // User ID
  fundId: string;                  // Fund ID (required)
  baseUrl: string;                 // SF360 server URL
  firstName?: string;              // Default: "Test"
  lastName?: string;               // Default: "Member{timestamp}"
  dateOfBirth?: string;            // Format: YYYY-MM-DD (default: 1980-01-01)
  email?: string;                  // Email address (optional)
  mobile?: string;                 // Mobile number (optional)
}
```

### Implementation Flow

**Note:** For generating unique test data, see `active.auth-data-factory.md` for `generateMemberData()` and `generateContactData()` factory functions.

```javascript
async function createMember(options) {
  const {
    firm,
    uid,
    fundId,
    baseUrl,
    firstName = 'Test',
    lastName,
    dateOfBirth = '1980-01-01',
    email,
    mobile
  } = options;

  if (!fundId) {
    throw new Error('fundId is required to create member');
  }

  // Generate unique last name if not provided
  const memberLastName = lastName || `Member${Date.now()}`;
  const fullName = `${firstName} ${memberLastName}`;

  // Build member payload
  const payload = {
    firstName: firstName,
    lastName: memberLastName,
    dateOfBirth: dateOfBirth,
    email: email || null,
    mobile: mobile || null
  };

  // Create member via API (INCORRECT - See Note Below)
  const response = await axios.post(
    `${baseUrl}/d/Members/addMember?firm=${firm}&uid=${uid}&fundId=${fundId}`,
    payload
  );

  const memberId = response.data.memberId;

  console.log(`✓ Member created: ${fullName} (${memberId})`);

  return {
    memberId,
    memberName: fullName,
    firstName,
    lastName: memberLastName
  };
}
```

**⚠️ IMPORTANT:** The above `createMember()` implementation is **INCOMPLETE** and will NOT work. Members require a 3-step process:

1. **Create Contact** (person) → Returns `peopleId`
2. **Get Member Data** by `peopleId` → Returns `memberCode`
3. **Create Accumulation Account** using `memberCode` → Returns member account

The correct implementation is documented in `active.auth-contact-creation.md` (if exists) or should be created as a separate spec.

**Correct API Endpoint (from noncompliance20260116):**
```
POST ${baseUrl}/chart/chartmvc/MemberController/save?firm={firm}&uid={uid}&fundId={fundId}
```

---

## Integration with setupTest()

### Fund Creation Logic

```javascript
async function setupTest(page, options) {
  // ... authentication logic ...

  // Determine if fund is needed
  const needsFund = determineFundRequirement(options);

  if (needsFund) {
    const fundResult = await createFund({
      firm,
      uid,
      baseUrl,
      name: options.fundName,
      entityType: options.entityType
    });

    fundId = fundResult.fundId;
    fundName = fundResult.fundName;
  }

  // Determine if member is needed
  const needsMember = determineMemberRequirement(options);

  if (needsMember) {
    if (!fundId) {
      throw new Error('Cannot create member without fund');
    }

    const memberResult = await createMember({
      firm,
      uid,
      fundId,
      baseUrl,
      ...options.memberData
    });

    memberId = memberResult.memberId;
    memberName = memberResult.memberName;
  }

  // ... navigation logic ...
}
```

---

## Error Handling

### API Errors

```javascript
try {
  const response = await axios.post(url, payload);
  return response.data;
} catch (error) {
  if (error.response) {
    throw new Error(
      `Failed to create fund: ${error.response.status} - ${error.response.data}`
    );
  } else if (error.request) {
    throw new Error('Failed to create fund: No response from server');
  } else {
    throw new Error(`Failed to create fund: ${error.message}`);
  }
}
```

### Badge Not Found

```javascript
if (!badges || badges.length === 0) {
  throw new Error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NO BADGES FOUND

  Firm: ${firm}
  Error: Cannot create fund without a badge.

  Fix:
  1. Log into SF360
  2. Go to Settings > Badges
  3. Create at least one badge
  4. Try again
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}
```

---

## Performance Considerations

### Fund Creation Time

- API call: ~500ms
- Badge lookup: ~200ms
- **Total**: ~700ms per fund

### Optimization: Badge Caching

```javascript
// Cache badge ID to avoid repeated lookups
let cachedBadgeId = null;

async function getDefaultBadgeId(firm, uid, baseUrl) {
  if (cachedBadgeId) {
    return cachedBadgeId;
  }

  const response = await axios.post(/* ... */);
  cachedBadgeId = response.data[0].id;

  return cachedBadgeId;
}
```

---

## Acceptance Criteria

### Fund Creation
- [ ] Creates SMSF with unique name
- [ ] Supports Trust and Company types
- [ ] Retrieves badge ID automatically
- [ ] Calculates financial year correctly
- [ ] Returns fundId and fundName
- [ ] Handles API errors gracefully
- [ ] Generates unique names using timestamp

### Member Creation
- [ ] Creates member with unique name
- [ ] Requires fundId parameter
- [ ] Returns memberId and memberName
- [ ] Supports custom firstName/lastName
- [ ] Handles API errors gracefully
- [ ] Works with all entity types

### Integration
- [ ] setupTest() creates fund when needed
- [ ] setupTest() creates member when needed
- [ ] setupTest() skips creation when not needed
- [ ] Error if member requested without fund

---

## Dependencies

- Package: `axios` - HTTP requests
- Spec: `active.auth-setup-test-api.md` - Integration with setupTest()
- Spec: `active.auth-data-factory.md` - Data generation utilities
- Spec: `active.auth-cognito.md` - Authentication (provides cookies)

---

## Related Files

- Implementation: `templates/helpers/fund-api.js` - Fund/member creation
- Implementation: `templates/helpers/data-factory.js` - Test data generation
- Implementation: `templates/helpers/auth.js` - Integration with setupTest()
- Reference: `noncompliance20260116/tests/lib/firm-util.js` - Source code

---

## Notes

- Fund names include timestamp for uniqueness and traceability
- Financial year calculation follows Australian FY (July to June)
- Badge lookup is required - cannot create fund without badge
- Member creation is separate from fund creation (two API calls)
- All API calls use authenticated axios instance (with cookies)
