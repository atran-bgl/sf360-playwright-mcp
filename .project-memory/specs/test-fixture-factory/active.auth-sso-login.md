---
status: active
domain: authentication
implementation-status: NOT-STARTED
impediment: none
---

# Spec: SSO Login & Cookie Extraction

**Feature:** SF360 SSO login with JWT token and cookie extraction for Playwright
**Priority:** Critical
**Estimated Complexity:** High

---

## Overview

Authenticate with SF360 SSO using Cognito JWT token, select firm, and extract session cookies for Playwright browser context injection.

**Source:** `noncompliance20260116/tests/lib/firm-util.js` lines 117-160

---

## API Contract

### loginToSSO()

```javascript
/**
 * Login to SF360 SSO with JWT token and extract cookies
 * @param {string} jwtToken - Cognito JWT IdToken
 * @param {string} firm - Firm short name
 * @param {string} ssoURL - SSO server URL
 * @returns {Promise<Array<Cookie>>} Playwright-formatted cookies
 */
async function loginToSSO(jwtToken, firm, ssoURL)
```

---

## Implementation Flow

### Prerequisites

```javascript
const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');

// Create cookie jar for axios
const cookieJar = new CookieJar();

// Create axios instance with cookie jar
const axiosWithCookies = axios.create({
  httpAgent: new HttpCookieAgent({ cookies: { jar: cookieJar } }),
  httpsAgent: new HttpsCookieAgent({ cookies: { jar: cookieJar } })
});
```

---

### Step 1: Token Login Check

```javascript
const loginCheckResponse = await axiosWithCookies.post(
  `${ssoURL}/login_token_check?ajax=true&app=sf360&firm=${firm}`,
  {},
  {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    }
  }
);

// SSO validates JWT and creates session
// Cookies are automatically stored in cookieJar
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Token validated"
}
```

**Cookies Set:**
- `session` - SSO session cookie
- Other session-related cookies

---

### Step 2: Select Firm

```javascript
const selectFirmResponse = await axiosWithCookies.get(
  `${ssoURL}/selectfirm?app=sf360&firm=${firm}`,
  {
    // Cookies from Step 1 automatically sent
  }
);

// SSO sets firm context in session
// Additional cookies are stored in cookieJar
```

**Expected Response:**
- HTTP 302 redirect or 200 OK
- Sets firm-specific cookies

**Cookies Set:**
- `firm` - Selected firm name
- `uid` - User ID
- Updated session cookies

---

### Step 3: Extract Cookies from Jar

```javascript
/**
 * Extract cookies from tough-cookie jar
 * @param {CookieJar} cookieJar - Cookie jar instance
 * @param {string} url - URL to get cookies for
 * @returns {Array<Object>} Array of cookies
 */
function extractCookiesFromJar(cookieJar, url) {
  const cookies = cookieJar.getCookiesSync(url);

  return cookies.map(cookie => ({
    name: cookie.key,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    expires: cookie.expires === 'Infinity' ? -1 : cookie.expires,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite
  }));
}

const cookies = extractCookiesFromJar(cookieJar, ssoURL);
```

---

### Step 4: Format Cookies for Playwright

```javascript
/**
 * Format cookies for Playwright
 * @param {Array<Object>} cookies - Cookies from tough-cookie
 * @returns {Array<Object>} Playwright-formatted cookies
 */
function formatCookiesForPlaywright(cookies) {
  return cookies.map(cookie => {
    // Convert tough-cookie format to Playwright format
    const playwrightCookie = {
      name: cookie.name,  // tough-cookie uses 'key', we already converted
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure
    };

    // Handle expires
    if (cookie.expires === -1 || cookie.expires === 'Infinity') {
      playwrightCookie.expires = -1;  // Session cookie
    } else if (cookie.expires instanceof Date) {
      playwrightCookie.expires = Math.floor(cookie.expires.getTime() / 1000);
    } else if (typeof cookie.expires === 'number') {
      playwrightCookie.expires = cookie.expires;
    }

    // Handle sameSite (capitalize first letter)
    if (cookie.sameSite) {
      const sameSite = cookie.sameSite.toLowerCase();
      playwrightCookie.sameSite = sameSite.charAt(0).toUpperCase() + sameSite.slice(1);
    }

    return playwrightCookie;
  });
}

const playwrightCookies = formatCookiesForPlaywright(cookies);
```

---

### Step 5: Inject Cookies into Playwright

```javascript
/**
 * Inject cookies into Playwright browser context
 * @param {Page} page - Playwright page
 * @param {Array<Object>} cookies - Playwright-formatted cookies
 */
async function injectCookiesIntoPlaywright(page, cookies) {
  await page.context().addCookies(cookies);
}

await injectCookiesIntoPlaywright(page, playwrightCookies);

// Now browser context is authenticated
```

---

## Complete Implementation

```javascript
const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');

/**
 * Login to SF360 SSO and get Playwright-formatted cookies
 * @param {string} jwtToken - Cognito JWT IdToken
 * @param {string} firm - Firm short name
 * @param {string} ssoURL - SSO server URL
 * @returns {Promise<Array<Cookie>>} Playwright-formatted cookies
 */
async function loginToSSO(jwtToken, firm, ssoURL) {
  try {
    console.log(`Logging into SSO for firm: ${firm}...`);

    // Create cookie jar
    const cookieJar = new CookieJar();

    // Create axios with cookie support
    const axiosWithCookies = axios.create({
      httpAgent: new HttpCookieAgent({ cookies: { jar: cookieJar } }),
      httpsAgent: new HttpsCookieAgent({ cookies: { jar: cookieJar } })
    });

    // Step 1: Token login check
    await axiosWithCookies.post(
      `${ssoURL}/login_token_check?ajax=true&app=sf360&firm=${firm}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Step 2: Select firm
    await axiosWithCookies.get(
      `${ssoURL}/selectfirm?app=sf360&firm=${firm}`
    );

    // Step 3: Extract cookies
    const cookies = cookieJar.getCookiesSync(ssoURL);

    // Step 4: Format for Playwright
    const playwrightCookies = cookies.map(cookie => {
      const formatted = {
        name: cookie.key,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure
      };

      // Handle expires
      if (cookie.expires === 'Infinity') {
        formatted.expires = -1;
      } else if (cookie.expires instanceof Date) {
        formatted.expires = Math.floor(cookie.expires.getTime() / 1000);
      }

      // Handle sameSite
      if (cookie.sameSite) {
        formatted.sameSite =
          cookie.sameSite.charAt(0).toUpperCase() +
          cookie.sameSite.slice(1).toLowerCase();
      }

      return formatted;
    });

    console.log(`✓ SSO login successful (${playwrightCookies.length} cookies)`);
    return playwrightCookies;

  } catch (error) {
    if (error.response) {
      throw new Error(`SSO login failed: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('SSO login failed: No response from server');
    } else {
      throw new Error(`SSO login failed: ${error.message}`);
    }
  }
}

module.exports = { loginToSSO };
```

---

## Integration with setupTest()

```javascript
const { getCognitoToken } = require('./auth-token-cache');
const { loginToSSO } = require('./auth-sso-login');

async function setupTest(page, options) {
  const { firm } = options;
  const config = loadConfig();

  // Step 1: Get JWT token (with caching)
  const jwtToken = await getCognitoToken(
    config.username,
    config.password,
    config.totpSecret,
    config.cognito
  );

  // Step 2: Login to SSO and get cookies
  const cookies = await loginToSSO(jwtToken, firm, config.ssoURL);

  // Step 3: Inject cookies into Playwright
  await page.context().addCookies(cookies);

  // Step 4: Navigate to SF360
  await page.goto(`${config.baseUrl}/s/insights?firm=${firm}&uid=${config.uid}`);
  await page.waitForLoadState('networkidle');

  console.log('✓ Authentication complete');
}
```

---

## Cookie Details

### Expected Cookies

| Name | Purpose | Type | Expiry |
|------|---------|------|--------|
| `session` | SSO session identifier | HttpOnly | Session |
| `firm` | Selected firm name | Standard | Session |
| `uid` | User ID | Standard | Session |
| `_ga` | Google Analytics | Standard | 2 years |
| `_gid` | Google Analytics | Standard | 24 hours |

### Cookie Attributes

**domain**: `.bgl360.com.au` or specific subdomain
**path**: `/` (root path)
**secure**: `true` (HTTPS only)
**httpOnly**: `true` for session cookies
**sameSite**: `Lax` or `None`

---

## Error Handling

### Invalid JWT Token

```javascript
// SSO returns 401 Unauthorized
Error: SSO login failed: 401 - Unauthorized

Fix:
1. Verify JWT token is valid (not expired)
2. Check COGNITO_URL and COGNITO_CLIENT_ID in .env
3. Re-authenticate with Cognito
```

### Invalid Firm

```javascript
// SSO returns 403 Forbidden or redirects to firm selection
Error: SSO login failed: 403 - Forbidden

Fix:
1. Verify firm name is correct
2. Check user has access to the firm
3. Log into SF360 UI to verify firm access
```

### Network Errors

```javascript
// No response from SSO server
Error: SSO login failed: No response from server

Fix:
1. Check SSO_URL in .env
2. Verify network connectivity
3. Check firewall/proxy settings
```

---

## Cookie Jar Persistence (Optional)

For even faster subsequent logins, cookies can be persisted:

```javascript
const { CookieJar } = require('tough-cookie');
const { FileCookieStore } = require('tough-cookie-file-store');

// Persistent cookie jar
const cookieJar = new CookieJar(new FileCookieStore('.sf360-cookies.json'));
```

**Note:** Not recommended for security reasons. Use token caching instead.

---

## Testing

### Manual Test

```javascript
const { loginToSSO } = require('./auth-sso-login');

(async () => {
  try {
    const jwtToken = 'eyJraWQiOiJ...'; // From Cognito
    const firm = 'testfirm';
    const ssoURL = 'https://sso.uat.bgl360.com.au';

    const cookies = await loginToSSO(jwtToken, firm, ssoURL);

    console.log('Cookies obtained:');
    cookies.forEach(cookie => {
      console.log(`  ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
    });
  } catch (error) {
    console.error('SSO login failed:', error.message);
  }
})();
```

---

## Performance

- **Token login check**: ~600ms
- **Select firm**: ~400ms
- **Cookie extraction**: <1ms
- **Total**: ~1000ms (1 second)

**With caching:**
- Subsequent logins with same JWT: ~1000ms
- Subsequent logins with cached JWT: ~1000ms (no Cognito call)

---

## Security Considerations

1. **JWT Token**
   - Transmitted via HTTPS only
   - Bearer token authentication
   - Expires in 1 hour

2. **Cookies**
   - HttpOnly flag prevents JavaScript access
   - Secure flag requires HTTPS
   - SameSite prevents CSRF

3. **Session**
   - SSO session tied to JWT identity
   - Invalidated on logout
   - Expires after inactivity

---

## Acceptance Criteria

- [ ] Authenticates with valid JWT token
- [ ] Selects specified firm successfully
- [ ] Extracts all session cookies
- [ ] Formats cookies correctly for Playwright
- [ ] Injects cookies into browser context
- [ ] Handles invalid JWT gracefully
- [ ] Handles invalid firm gracefully
- [ ] Handles network errors gracefully
- [ ] Logs progress clearly
- [ ] Works with memory caching system

---

## Dependencies

- Package: `axios` - HTTP client
- Package: `tough-cookie` - Cookie jar
- Package: `http-cookie-agent` - Axios cookie integration
- Service: SF360 SSO - Session management

---

## Related Files

- Implementation: `templates/helpers/auth-sso-login.js`
- Caching: `templates/helpers/auth-token-cache.js` (memory cache for cookies)
- Integration: `templates/helpers/auth.js` (setupTest)
- Config: `templates/.env.template`
- Spec: `active.auth-cognito.md`
- Spec: `active.auth-token-caching.md`

---

## Source Reference

**noncompliance20260116:**
- `tests/lib/firm-util.js:117-160` - loginToSSOPromise() implementation
- `tests/lib/util.js:11-21` - axios with cookie jar setup
- `tests/pages/LoginPage.js:22-45` - Cookie injection into Playwright

---

*Last updated: 2026-02-02*
