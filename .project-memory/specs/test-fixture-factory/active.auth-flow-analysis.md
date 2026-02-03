---
status: active
domain: authentication
implementation-status: NOT-STARTED
---

# Complete SF360 Authentication & Fund Creation Flow

**Source:** noncompliance20260116 test suite analysis

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ TEST START                                                   │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Initialize Test Configuration                       │
│ ─────────────────────────────────────────────────────────   │
│ testUtil.initTest()                                          │
│   → prepareAWSParamsMaps()                                  │
│   → getTestParametersFromAWSPromise(awsParamsMap)           │
│                                                              │
│ Loads from AWS SSM Parameter Store:                         │
│   - server (SF360 server URL)                               │
│   - cognitoAddress (Cognito endpoint)                       │
│   - cognitoClientId (Cognito app client ID)                 │
│   - ssoServer (SSO endpoint)                                │
│   - username, userPassword, userSecret, uid                 │
│                                                              │
│ OR from test-config-local.json:                             │
│   {                                                          │
│     "environment": "uat",                                    │
│     "uat": {                                                 │
│       "username": "user@example.com",                        │
│       "userPassword": "password",                            │
│       "userSecret": "TOTP_SECRET",                           │
│       "uid": 1234                                            │
│     }                                                        │
│   }                                                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Generate Cognito ID Token (with TOTP 2FA)           │
│ ─────────────────────────────────────────────────────────   │
│ testUtil.generateIdToken()                                   │
│   → Checks if idToken.txt exists and is valid               │
│   → If expired or missing, calls getUserIdToken()           │
│   → Saves token to idToken.txt                              │
│                                                              │
│ getUserIdToken() flow:                                       │
│   1. POST to Cognito: InitiateAuth                          │
│      URL: cognitoURL                                         │
│      Headers: {                                              │
│        'content-type': 'application/x-amz-json-1.1',        │
│        'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth' │
│      }                                                       │
│      Body: {                                                 │
│        AuthFlow: 'USER_PASSWORD_AUTH',                       │
│        ClientId: cognitoClientId,                            │
│        AuthParameters: {                                     │
│          USERNAME: username,                                 │
│          PASSWORD: userPassword                              │
│        }                                                     │
│      }                                                       │
│      Response: { Session: "..." }                           │
│                                                              │
│   2. Generate TOTP code:                                     │
│      otplib.authenticator.generate(userSecret)               │
│      → Returns 6-digit code (e.g., "123456")                │
│                                                              │
│   3. POST to Cognito: RespondToAuthChallenge                │
│      Headers: {                                              │
│        'content-type': 'application/x-amz-json-1.1',        │
│        'x-amz-target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge' │
│      }                                                       │
│      Body: {                                                 │
│        ChallengeName: 'SOFTWARE_TOKEN_MFA',                  │
│        ChallengeResponses: {                                 │
│          USERNAME: username,                                 │
│          SOFTWARE_TOKEN_MFA_CODE: totpCode                   │
│        },                                                    │
│        ClientId: cognitoClientId,                            │
│        Session: sessionFromStep1                             │
│      }                                                       │
│      Response: {                                             │
│        AuthenticationResult: {                               │
│          IdToken: "eyJraWQiOiJ...",  ← JWT token            │
│          AccessToken: "...",                                 │
│          RefreshToken: "...",                                │
│          ExpiresIn: 3600                                     │
│        }                                                     │
│      }                                                       │
│                                                              │
│   4. Store IdToken:                                          │
│      testConfig.userIdToken = IdToken                        │
│      fs.writeFileSync('idToken.txt', IdToken)                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Read Test Config                                    │
│ ─────────────────────────────────────────────────────────   │
│ testUtil.readTestConfig()                                    │
│   → Reads idToken.txt                                        │
│   → Sets testConfig.userIdToken                             │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Login to SSO & Select Firm (Get Cookies)            │
│ ─────────────────────────────────────────────────────────   │
│ loginPage.login_api(firm)                                    │
│   → sfFirmUtil.login(firm)                                   │
│   → loginToSSOPromise(firm, 'sf360')                         │
│                                                              │
│ loginToSSOPromise() flow:                                    │
│   1. POST to SSO: Token login check                         │
│      URL: ssoURL/login_token_check?ajax=true&app=sf360&firm={firm} │
│      Headers: {                                              │
│        Authorization: `Bearer ${userIdToken}`  ← JWT from Cognito │
│      }                                                       │
│      → Validates token with SSO                              │
│      → SSO creates session                                   │
│                                                              │
│   2. GET to SSO: Select firm                                │
│      URL: ssoURL/selectfirm?app=sf360&firm={firm}           │
│      → Uses cookies from Step 1 (axios cookieJar)           │
│      → Sets firm context in session                          │
│      → SSO returns cookies with firm selection               │
│                                                              │
│   3. Extract cookies from cookieJar:                         │
│      cookieJar.getCookies(ssoURL)                            │
│      → Returns array of cookies:                             │
│        [                                                     │
│          { key: 'session', value: '...', domain: '...' },   │
│          { key: 'firm', value: 'firmName', ... },           │
│          { key: 'uid', value: '1234', ... }                 │
│        ]                                                     │
│                                                              │
│ loginPage.login_api() continues:                             │
│   4. Format cookies for Playwright:                          │
│      - Rename 'key' → 'name'                                 │
│      - Normalize 'expires' (handle Infinity)                 │
│      - Normalize 'sameSite' (capitalize)                     │
│                                                              │
│   5. Inject cookies into Playwright:                         │
│      page.context().addCookies(formattedCookies)             │
│                                                              │
│   6. Navigate to SF360:                                      │
│      page.goto(                                              │
│        `${serverURL}/s/entity_setup/?firm=${firm}&uid=${uid}` │
│      )                                                       │
│      → Now authenticated in browser context                  │
│      → Can access SF360 pages                                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Navigate to Entity Setup                            │
│ ─────────────────────────────────────────────────────────   │
│ loginPage.button_ENTITYSETUP.click()                         │
│   → Clicks "ENTITY SETUP" link in top menu                  │
│   → URL: /s/entity_setup/                                    │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Create Fund (SMSF)                                  │
│ ─────────────────────────────────────────────────────────   │
│ entitySetupPage.createSMSF(entityName)                       │
│                                                              │
│ createSMSF() flow:                                           │
│   1. waitForPageLoad()                                       │
│      → Verify "Entity Setup" heading visible                 │
│      → Wait for network idle                                 │
│                                                              │
│   2. selectSMSFType()                                        │
│      → Click "SMSF" option                                   │
│                                                              │
│   3. fillEntityDetails(name, dateFormed)                     │
│      → Fill name: "AutoTest SMSF 1738053600000"             │
│      → Fill date: getTodayFormatted() (DD/MM/YYYY)          │
│                                                              │
│   4. selectFinancialYear(targetYear)                         │
│      → Calculate target FY (current or next year)            │
│      → Click "Select period" button                          │
│      → Select year from dropdown                             │
│                                                              │
│   5. clickCreateAndWait(entityName)                          │
│      → Find "Create SMSF" or "Create Entity" button         │
│      → Wait for button to be enabled                         │
│      → Click button                                          │
│      → Wait for navigation                                   │
│      → Verify success (look for "Created!" or entity name)   │
│                                                              │
│ Behind the scenes (if using API):                            │
│   → POST /d/Entities/addEntity?firm={firm}&uid={uid}        │
│      Body: {                                                 │
│        userId: null,                                         │
│        firmShortName: firm,                                  │
│        product: 'SFUND',                                     │
│        master: {                                             │
│          type: 'fund',                                       │
│          entityType: 'SMSF',                                 │
│          fundType: 'SMSF',                                   │
│          name: entityName,                                   │
│          establishmentDate: '...',                           │
│          yearFrom: '...',                                    │
│          yearTo: '...',                                      │
│          badgeId: defaultBadgeId,                            │
│          remarkStatus: 'FROM_QUICK_SETUP'                    │
│        }                                                     │
│      }                                                       │
│   → Response: entityId (fund ID)                            │
│   → context.TestConfig.entityId = entityId                   │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ TEST READY                                                   │
│ - Authenticated via Cognito + SSO                            │
│ - Firm selected                                              │
│ - Fresh fund created                                         │
│ - Ready to test fund-level features                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencies Required

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "otplib": "^12.0.1",
    "tough-cookie": "^4.1.3",
    "http-cookie-agent": "^5.0.4",
    "@aws-sdk/client-ssm": "^3.0.0"
  }
}
```

---

## 🔑 Configuration Files

### test-config-local.json
```json
{
  "environment": "uat",
  "uat": {
    "username": "user@example.com",
    "userPassword": "password",
    "userSecret": "TOTP_SECRET_BASE32",
    "uid": 1234,
    "firmShortName": "testfirm"
  }
}
```

### Environment Variables (Alternative)
```bash
SF360_ENVIRONMENT=uat
SF360_USERNAME=user@example.com
SF360_PASSWORD=password
SF360_TOTP_SECRET=TOTP_SECRET_BASE32
SF360_UID=1234
SF360_FIRM=testfirm
```

---

## 🛠️ Key Utility Functions

### 1. testUtil.initTest()
```javascript
// Loads configuration from AWS SSM or local config
// Sets up: server URLs, Cognito config, credentials
```

### 2. testUtil.generateIdToken()
```javascript
// Authenticates with Cognito using username + password + TOTP
// Returns JWT token
// Caches token in idToken.txt (expires in 1 hour)
```

### 3. sfFirmUtil.login(firm)
```javascript
// Authenticates with SSO using JWT token
// Selects firm
// Returns cookies for Playwright
```

### 4. loginPage.login_api(firm)
```javascript
// Gets cookies from sfFirmUtil.login()
// Formats cookies for Playwright
// Injects cookies into browser context
// Navigates to SF360
```

### 5. entitySetupPage.createSMSF(name)
```javascript
// Creates new SMSF fund via UI
// Fills form: name, date, financial year
// Clicks "Create SMSF" button
// Returns when fund is created
```

---

## 🔐 Security Notes

1. **JWT Token Storage**: Token stored in `idToken.txt`, expires in 1 hour
2. **Cookie Management**: Uses `tough-cookie` jar with axios
3. **AWS SSM**: Credentials can be stored in AWS Parameter Store
4. **TOTP Secret**: Base32-encoded secret for 2FA generation
5. **Cognito**: AWS Cognito handles authentication, not direct SF360 login

---

## 🎯 For MCP Implementation

**What we need to replicate:**

1. **Authentication Module** (`templates/helpers/auth-api.js`):
   - Cognito authentication with TOTP
   - SSO login with JWT token
   - Cookie extraction and formatting
   - Playwright cookie injection

2. **Fund Creation Module** (`templates/helpers/fund-api.js`):
   - API endpoint: `/d/Entities/addEntity`
   - Payload structure for SMSF creation
   - Badge ID retrieval
   - Entity ID extraction

3. **Configuration** (`.env`):
   - Cognito URL and Client ID
   - SSO URL
   - SF360 Server URL
   - Username, Password, TOTP Secret
   - UID

4. **setupTest() Function**:
   ```javascript
   async function setupTest(page, options) {
     // 1. Get Cognito JWT token (with TOTP)
     const jwtToken = await getCognitoToken(username, password, totpSecret);

     // 2. Login to SSO and get cookies
     const cookies = await ssoLogin(jwtToken, firm);

     // 3. Inject cookies into Playwright
     await page.context().addCookies(cookies);

     // 4. Create fund if needed (based on pageKey)
     if (needsFund) {
       const fundId = await createFund(firm, uid, fundName);
       return { firm, uid, fundId };
     }

     return { firm, uid };
   }
   ```

---

## ⚡ Key Differences from Current auth.js

| Feature | Current auth.js | noncompliance20260116 |
|---------|----------------|----------------------|
| **Authentication** | UI-based (fill forms) | API-based (Cognito JWT) |
| **2FA** | UI input field | TOTP generation |
| **Firm Selection** | UI dropdown | API endpoint |
| **Speed** | ~10-15 seconds | ~2-3 seconds |
| **Fund Creation** | Not supported | Via API or UI |
| **Cookies** | Browser session | Injected from API |

---

## 📝 Implementation Priority

1. ✅ **High**: Cognito authentication with TOTP
2. ✅ **High**: SSO login with JWT
3. ✅ **High**: Cookie extraction and Playwright injection
4. ✅ **High**: Fund creation via API
5. ✅ **Medium**: Badge retrieval
6. ✅ **Medium**: Token caching (idToken.txt)
7. ✅ **Low**: AWS SSM integration (use .env instead)

---

## 📂 Source Files Reference

**noncompliance20260116/**
- `tests/lib/test-util.js` - Authentication, token generation, config
- `tests/lib/firm-util.js` - SSO login, firm selection, entity creation
- `tests/lib/util.js` - Axios setup with cookie jar
- `tests/pages/LoginPage.js` - Cookie injection, navigation
- `tests/pages/agent/EntitySetupPage.js` - UI-based fund creation
- `test-config-local.json` - Configuration template

---

Done! 🎉
