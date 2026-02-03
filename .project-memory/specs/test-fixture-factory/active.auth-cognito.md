---
status: active
domain: authentication
implementation-status: NOT-STARTED
impediment: none
---

# Spec: Cognito JWT Authentication with TOTP

**Feature:** AWS Cognito authentication with TOTP 2FA for SF360 access
**Priority:** Critical
**Estimated Complexity:** High

---

## Overview

Authenticate with AWS Cognito using username/password + TOTP (Time-based One-Time Password) to obtain a JWT token for SSO access.

**Source:** `noncompliance20260116/tests/lib/test-util.js` lines 46-103

---

## API Contract

### authenticateWithCognito()

```javascript
/**
 * Authenticate with AWS Cognito using TOTP 2FA
 * @param {string} username - User email
 * @param {string} password - User password
 * @param {string} totpSecret - TOTP secret (base32 encoded)
 * @param {Object} cognitoConfig - Cognito configuration
 * @returns {Promise<string>} JWT IdToken
 */
async function authenticateWithCognito(username, password, totpSecret, cognitoConfig)
```

### Cognito Config Parameter

```typescript
interface CognitoConfig {
  url: string;              // Cognito endpoint URL
  clientId: string;         // Cognito app client ID
}
```

---

## Implementation Flow

### Step 1: InitiateAuth - Username/Password

```javascript
const initiateAuthPayload = {
  AuthFlow: 'USER_PASSWORD_AUTH',
  ClientId: cognitoConfig.clientId,
  AuthParameters: {
    USERNAME: username,
    PASSWORD: password
  }
};

const initiateAuthResponse = await axios.post(
  cognitoConfig.url,
  initiateAuthPayload,
  {
    headers: {
      'content-type': 'application/x-amz-json-1.1',
      'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth'
    }
  }
);

const session = initiateAuthResponse.data.Session;
```

**Expected Response:**
```json
{
  "ChallengeName": "SOFTWARE_TOKEN_MFA",
  "Session": "AYABeG...longSessionString",
  "ChallengeParameters": {
    "USER_ID_FOR_SRP": "username@example.com",
    "FRIENDLY_DEVICE_NAME": "Unknown"
  }
}
```

---

### Step 2: Generate TOTP Code

```javascript
const { authenticator } = require('otplib');

/**
 * Generate 6-digit TOTP code
 * @param {string} secret - Base32-encoded TOTP secret
 * @returns {string} 6-digit code
 */
function generateTOTP(secret) {
  return authenticator.generate(secret);
}

const totpCode = generateTOTP(totpSecret);
// Example: "123456"
```

**Important:**
- TOTP code is time-based (30-second window)
- Use immediately after generation
- Code rotates every 30 seconds

---

### Step 3: RespondToAuthChallenge - TOTP

```javascript
const respondPayload = {
  ChallengeName: 'SOFTWARE_TOKEN_MFA',
  ChallengeResponses: {
    USERNAME: username,
    SOFTWARE_TOKEN_MFA_CODE: totpCode
  },
  ClientId: cognitoConfig.clientId,
  Session: session
};

const respondResponse = await axios.post(
  cognitoConfig.url,
  respondPayload,
  {
    headers: {
      'content-type': 'application/x-amz-json-1.1',
      'x-amz-target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
    }
  }
);

const idToken = respondResponse.data.AuthenticationResult.IdToken;
```

**Expected Response:**
```json
{
  "AuthenticationResult": {
    "IdToken": "eyJraWQiOiJ...longJWTString",
    "AccessToken": "eyJraWQiOiJ...longAccessToken",
    "RefreshToken": "eyJjdHkiOiJ...longRefreshToken",
    "ExpiresIn": 3600,
    "TokenType": "Bearer"
  },
  "ChallengeParameters": {}
}
```

---

## Complete Implementation

```javascript
const axios = require('axios');
const { authenticator } = require('otplib');

/**
 * Authenticate with AWS Cognito using TOTP 2FA
 * @param {string} username - User email
 * @param {string} password - User password
 * @param {string} totpSecret - TOTP secret (base32 encoded)
 * @param {Object} cognitoConfig - { url, clientId }
 * @returns {Promise<string>} JWT IdToken
 */
async function authenticateWithCognito(username, password, totpSecret, cognitoConfig) {
  try {
    // Step 1: InitiateAuth with username/password
    console.log('Authenticating with Cognito...');

    const initiateAuthResponse = await axios.post(
      cognitoConfig.url,
      {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: cognitoConfig.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password
        }
      },
      {
        headers: {
          'content-type': 'application/x-amz-json-1.1',
          'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth'
        }
      }
    );

    const session = initiateAuthResponse.data.Session;

    if (!session) {
      throw new Error('No session returned from InitiateAuth');
    }

    // Step 2: Generate TOTP code
    const totpCode = authenticator.generate(totpSecret);

    // Step 3: RespondToAuthChallenge with TOTP
    const respondResponse = await axios.post(
      cognitoConfig.url,
      {
        ChallengeName: 'SOFTWARE_TOKEN_MFA',
        ChallengeResponses: {
          USERNAME: username,
          SOFTWARE_TOKEN_MFA_CODE: totpCode
        },
        ClientId: cognitoConfig.clientId,
        Session: session
      },
      {
        headers: {
          'content-type': 'application/x-amz-json-1.1',
          'x-amz-target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
        }
      }
    );

    const idToken = respondResponse.data.AuthenticationResult.IdToken;

    if (!idToken) {
      throw new Error('No IdToken returned from RespondToAuthChallenge');
    }

    console.log('✓ Cognito authentication successful');
    return idToken;

  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      const errorData = error.response.data;

      if (errorData.__type === 'NotAuthorizedException') {
        throw new Error('Cognito authentication failed: Invalid username or password');
      } else if (errorData.__type === 'CodeMismatchException') {
        throw new Error('Cognito authentication failed: Invalid TOTP code');
      } else if (errorData.__type === 'ExpiredCodeException') {
        throw new Error('Cognito authentication failed: TOTP code expired (try again immediately)');
      } else {
        throw new Error(`Cognito authentication failed: ${errorData.__type || error.response.status}`);
      }
    } else if (error.request) {
      throw new Error('Cognito authentication failed: No response from server');
    } else {
      throw new Error(`Cognito authentication failed: ${error.message}`);
    }
  }
}

module.exports = { authenticateWithCognito };
```

---

## Configuration

### Environment Variables

```bash
# .env file
COGNITO_URL=https://cognito-idp.ap-southeast-2.amazonaws.com/
COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
USERNAME=user@example.com
USER_PASSWORD=YourSecurePassword123
TOTP_SECRET=JBSWY3DPEHPK3PXP  # Base32 encoded
```

### Loading Configuration

```javascript
require('dotenv').config();

const cognitoConfig = {
  url: process.env.COGNITO_URL,
  clientId: process.env.COGNITO_CLIENT_ID
};

const username = process.env.USERNAME;
const password = process.env.USER_PASSWORD;
const totpSecret = process.env.TOTP_SECRET;
```

---

## Error Handling

### Common Errors

**1. NotAuthorizedException**
```
Error: Incorrect username or password
Fix: Verify USERNAME and USER_PASSWORD in .env
```

**2. CodeMismatchException**
```
Error: Invalid TOTP code
Fix: Verify TOTP_SECRET in .env (must match authenticator app)
```

**3. ExpiredCodeException**
```
Error: TOTP code expired
Fix: Regenerate code immediately before use (30-second window)
```

**4. UserNotFoundException**
```
Error: User does not exist
Fix: Verify USERNAME is correct
```

**5. TooManyRequestsException**
```
Error: Rate limit exceeded
Fix: Wait 5 minutes before retrying
```

---

## TOTP Secret Format

### Base32 Encoding

TOTP secrets are Base32-encoded strings (no padding):
```
Valid: JBSWY3DPEHPK3PXP
Invalid: jbswy3dpehpk3pxp (lowercase not standard)
Invalid: JBSWY3DPEHPK3PXP= (padding not standard)
```

### Obtaining TOTP Secret

**Option 1: From QR Code Setup**
1. When setting up 2FA in SF360, a QR code is displayed
2. Use QR code reader to extract secret
3. Format: `otpauth://totp/SF360:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=SF360`
4. Extract the `secret` parameter

**Option 2: From Manual Entry**
1. During 2FA setup, click "Can't scan code?"
2. Copy the alphanumeric secret shown
3. Use this secret in .env

---

## Integration with Token Caching

```javascript
const { getCognitoToken } = require('./auth-token-cache');

// getCognitoToken wraps authenticateWithCognito with file caching
const token = await getCognitoToken(username, password, totpSecret, cognitoConfig);
```

See: `active.auth-token-caching.md` for caching implementation

---

## Testing

### Manual Test

```javascript
const { authenticateWithCognito } = require('./auth-cognito');

(async () => {
  try {
    const config = {
      url: 'https://cognito-idp.ap-southeast-2.amazonaws.com/',
      clientId: 'YOUR_CLIENT_ID'
    };

    const token = await authenticateWithCognito(
      'user@example.com',
      'password',
      'JBSWY3DPEHPK3PXP',
      config
    );

    console.log('Token obtained:', token.substring(0, 50) + '...');
    console.log('Token length:', token.length);

    // Decode to verify
    const decoded = require('jsonwebtoken').decode(token);
    console.log('Token expires:', new Date(decoded.exp * 1000).toISOString());
    console.log('Token username:', decoded.email);
  } catch (error) {
    console.error('Authentication failed:', error.message);
  }
})();
```

---

## Performance

- **InitiateAuth**: ~800ms
- **TOTP Generation**: <1ms
- **RespondToAuthChallenge**: ~1200ms
- **Total**: ~2000ms (2 seconds)

**Optimization**: Cache the IdToken (1 hour expiry) to avoid repeated auth

---

## Security Considerations

1. **TOTP Secret Storage**
   - Store in .env (never commit)
   - Use environment variables in production
   - Rotate secrets periodically

2. **JWT Token**
   - Expires in 1 hour
   - Contains user identity claims
   - Use HTTPS for all requests

3. **Session Token**
   - Temporary (single-use)
   - Only valid for MFA challenge
   - Expires after successful auth

---

## Acceptance Criteria

- [ ] Authenticates with valid username/password
- [ ] Generates valid TOTP code from secret
- [ ] Completes MFA challenge successfully
- [ ] Returns valid JWT IdToken
- [ ] Handles invalid credentials gracefully
- [ ] Handles invalid TOTP code gracefully
- [ ] Handles expired TOTP code gracefully
- [ ] Handles network errors gracefully
- [ ] Logs authentication progress
- [ ] Works with token caching system

---

## Dependencies

- Package: `axios` - HTTP client
- Package: `otplib` - TOTP generation
- Package: `dotenv` - Environment variables
- Service: AWS Cognito - Identity provider

---

## Related Files

- Implementation: `templates/helpers/auth-cognito.js`
- Caching: `templates/helpers/auth-token-cache.js`
- Integration: `templates/helpers/auth.js` (setupTest)
- Config: `templates/.env.template`
- Spec: `active.auth-token-caching.md`
- Spec: `active.auth-sso-login.md`

---

## Source Reference

**noncompliance20260116:**
- `tests/lib/test-util.js:46-103` - getUserIdToken() implementation
- `tests/lib/test-util.js:105-127` - generateIdToken() with caching

---

*Last updated: 2026-02-02*
