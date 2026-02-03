---
status: active
domain: authentication
implementation-status: NOT-STARTED
impediment: none
---

# Spec: Token Caching Strategy

**Feature:** JWT token and SSO session caching for performance optimization
**Priority:** High
**Estimated Complexity:** Medium

---

## Overview

Implement two-level caching to avoid repeated authentication:
1. **File cache** for Cognito JWT tokens (1 hour expiry)
2. **Memory cache** for SSO session cookies (30 minute expiry)

This reduces authentication overhead from ~3.5s to ~0.01s for subsequent tests.

---

## Level 1: JWT Token File Cache

### Cache File Location

```javascript
const TOKEN_CACHE_FILE = '.sf360-token-cache';
// Located in consuming project root
// Added to .gitignore automatically
```

### Cache Entry Structure

```
<JWT_TOKEN_STRING>
```

Example:
```
eyJraWQiOiJXVjNRd0tFUXNWQ1JcL3pXN1wvNmNqY3lRZUFZZUNvbzRVT3pSSzFhNVRsTT0iLCJhbGciOiJSUzI1NiJ9...
```

### Token Validation

```javascript
function isTokenValid(token, username) {
  try {
    const decoded = jwt.decode(token);

    // Check expiry (with 1 minute buffer)
    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    if (now + 60000 >= expiresAt) {
      return false; // Expired or expiring soon
    }

    // Check username matches
    if (decoded.email !== username) {
      return false; // Different user
    }

    // Check Cognito client ID matches (optional but recommended)
    const cognitoClientId = process.env.COGNITO_CLIENT_ID;
    if (cognitoClientId && decoded.aud !== cognitoClientId) {
      return false; // Different Cognito app
    }

    return true; // Valid token
  } catch (err) {
    return false; // Invalid JWT format
  }
}
```

### getCognitoToken() Implementation

```javascript
/**
 * Get Cognito JWT token with file caching
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {string} totpSecret - TOTP secret (base32)
 * @param {Object} cognitoConfig - Cognito configuration
 * @returns {Promise<string>} JWT token
 */
async function getCognitoToken(username, password, totpSecret, cognitoConfig) {
  const TOKEN_CACHE_FILE = '.sf360-token-cache';

  // Try to read cached token
  if (fs.existsSync(TOKEN_CACHE_FILE)) {
    try {
      const cachedToken = fs.readFileSync(TOKEN_CACHE_FILE, 'utf8').trim();

      if (isTokenValid(cachedToken, username)) {
        const decoded = jwt.decode(cachedToken);
        const expiresAt = decoded.exp * 1000;
        const timeLeftMin = Math.floor((expiresAt - Date.now()) / 60000);

        console.log(`✓ Reusing cached token (expires in ${timeLeftMin} minutes)`);
        return cachedToken;
      } else {
        console.log('⚠ Cached token expired or invalid, getting new token...');
      }
    } catch (err) {
      console.log('⚠ Error reading token cache, getting new token...');
    }
  }

  // Get new token from Cognito
  console.log('Authenticating with Cognito...');
  const token = await authenticateWithCognito(username, password, totpSecret, cognitoConfig);

  // Cache the token
  try {
    fs.writeFileSync(TOKEN_CACHE_FILE, token, 'utf8');
  } catch (err) {
    console.warn('Warning: Failed to cache token:', err.message);
  }

  return token;
}
```

---

## Level 2: SSO Session Memory Cache

### Cache Structure

```javascript
// In-memory cache (shared across tests in same process)
const ssoSessionCache = new Map();

// Cache entry structure:
// Key: firm name (string)
// Value: {
//   cookies: Array<Cookie>,
//   expiresAt: number (timestamp)
// }
```

### getSSOCookies() Implementation

```javascript
/**
 * Get SSO cookies with memory caching
 * @param {string} jwtToken - Cognito JWT token
 * @param {string} firm - Firm short name
 * @param {string} ssoURL - SSO server URL
 * @returns {Promise<Array<Cookie>>} SSO cookies
 */
async function getSSOCookies(jwtToken, firm, ssoURL) {
  const cacheKey = firm;
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Check memory cache
  if (ssoSessionCache.has(cacheKey)) {
    const cached = ssoSessionCache.get(cacheKey);

    if (Date.now() < cached.expiresAt) {
      const timeLeftMin = Math.floor((cached.expiresAt - Date.now()) / 60000);
      console.log(`✓ Reusing SSO session for firm: ${firm} (expires in ${timeLeftMin} minutes)`);
      return cached.cookies;
    } else {
      console.log(`⚠ SSO session expired for firm: ${firm}, getting new session...`);
      ssoSessionCache.delete(cacheKey);
    }
  }

  // Get new SSO session
  console.log(`Logging into SSO for firm: ${firm}...`);
  const cookies = await loginToSSO(jwtToken, firm, ssoURL);

  // Cache the session
  ssoSessionCache.set(cacheKey, {
    cookies,
    expiresAt: Date.now() + CACHE_DURATION
  });

  return cookies;
}
```

---

## Cache Management

### warmupCache()

Pre-warm the cache before running tests:

```javascript
/**
 * Pre-warm token cache (call in test.beforeAll)
 */
setupTest.warmupCache = async function() {
  const config = loadConfig();

  console.log('Warming up authentication cache...');

  // Get token (caches automatically)
  await getCognitoToken(
    config.username,
    config.password,
    config.totpSecret,
    config.cognito
  );

  console.log('✓ Cache warmed up');
};
```

Usage:
```javascript
test.beforeAll(async () => {
  await setupTest.warmupCache();
});
```

### clearCache()

Clear all caches:

```javascript
/**
 * Clear all caches
 */
setupTest.clearCache = function() {
  // Clear file cache
  const TOKEN_CACHE_FILE = '.sf360-token-cache';
  if (fs.existsSync(TOKEN_CACHE_FILE)) {
    try {
      fs.unlinkSync(TOKEN_CACHE_FILE);
      console.log('✓ Token cache cleared');
    } catch (err) {
      console.warn('Warning: Failed to clear token cache:', err.message);
    }
  }

  // Clear memory cache
  ssoSessionCache.clear();
  console.log('✓ SSO session cache cleared');
};
```

Usage:
```javascript
test.afterAll(async () => {
  setupTest.clearCache();
});
```

---

## Cache Bypass

### Skip Cache Option

```javascript
const ctx = await setupTest(page, {
  firm: process.env.FIRM,
  skipCache: true  // Force fresh authentication
});
```

Implementation:
```javascript
async function setupTest(page, options) {
  const { skipCache = false } = options;

  if (skipCache) {
    console.log('⚠ Skipping cache (fresh authentication)');
    setupTest.clearCache(); // Clear before getting new tokens
  }

  // ... rest of setup
}
```

---

## Performance Metrics

### Without Caching

```
Test 1: 3.5s (Cognito 2s + TOTP 0.5s + SSO 1s)
Test 2: 3.5s (full auth again)
Test 3: 3.5s (full auth again)
---
Total: 10.5s
```

### With Caching

```
Test 1: 3.5s (Cognito 2s + TOTP 0.5s + SSO 1s) ← Cache miss
Test 2: 0.01s (read cache) + 1s (SSO with cached token) = 1.01s
Test 3: 0.01s (read cache) + 0.01s (memory cache) = 0.02s
---
Total: 4.53s (57% faster!)
```

---

## Error Handling

### File System Errors

```javascript
// Graceful degradation - continue without cache if file operations fail
try {
  const token = fs.readFileSync(TOKEN_CACHE_FILE, 'utf8');
  // ...
} catch (err) {
  console.warn('Warning: Token cache unavailable:', err.message);
  // Continue without cache
}
```

### Token Decode Errors

```javascript
try {
  const decoded = jwt.decode(token);
  // ...
} catch (err) {
  console.warn('Warning: Invalid cached token, getting new one');
  // Get fresh token
}
```

---

## Security Considerations

### Token Cache File

1. **Not committed to git**: Added to `.gitignore`
2. **File permissions**: Created with user-only read/write (600)
3. **No encryption**: Tokens expire in 1 hour, acceptable risk
4. **Cleanup**: Removed by `clearCache()` or on test suite completion

### Memory Cache

1. **Process-local**: Not shared across test processes
2. **No persistence**: Cleared when process exits
3. **Shorter duration**: 30 minutes (half of token expiry)

---

## .gitignore Entry

```gitignore
# SF360 Playwright MCP
.sf360-token-cache
```

This should be added during `init` tool execution.

---

## Acceptance Criteria

- [ ] Token cached to `.sf360-token-cache` file
- [ ] Token reused if valid (not expired, correct user)
- [ ] Token refreshed automatically when expired
- [ ] SSO session cached in memory per firm
- [ ] SSO session reused within 30 minutes
- [ ] `warmupCache()` pre-warms token before tests
- [ ] `clearCache()` removes all cached data
- [ ] `skipCache: true` forces fresh authentication
- [ ] Graceful degradation if file operations fail
- [ ] Token cache file added to .gitignore
- [ ] Console output shows cache hits/misses
- [ ] Performance improvement measured and verified

---

## Dependencies

- Package: `jsonwebtoken` - For decoding JWT tokens
- Spec: `active.auth-cognito.md` - Cognito authentication
- Spec: `active.auth-sso-login.md` - SSO login

---

## Related Files

- Implementation: `templates/helpers/auth.js` - Cache logic
- Config: `templates/.gitignore.template` - Ignore cache files

---

## Notes

- Token cache is user-specific (keyed by username in validation)
- SSO session cache is firm-specific (keyed by firm name)
- Both caches have conservative expiry buffers (1 minute for token, immediate for SSO)
- Cache files should never be committed to version control
