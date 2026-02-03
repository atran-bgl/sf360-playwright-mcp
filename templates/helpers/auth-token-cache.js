/**
 * JWT Token Caching Strategy
 * File-based caching for Cognito JWT tokens (1 hour expiry)
 */

const fs = require('fs');
const jwt = require('jsonwebtoken');
const { authenticateWithCognito } = require('./auth-cognito');

const TOKEN_CACHE_FILE = '.sf360-token-cache';

/**
 * Check if JWT token is valid
 * @param {string} token - JWT token to validate
 * @param {string} username - Expected username (email)
 * @param {string} cognitoClientId - Expected Cognito client ID
 * @returns {boolean} True if token is valid
 */
function isTokenValid(token, username, cognitoClientId) {
  try {
    const decoded = jwt.decode(token);

    if (!decoded) {
      return false;
    }

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

    // Check Cognito client ID matches
    if (cognitoClientId && decoded.aud !== cognitoClientId) {
      return false; // Different Cognito app
    }

    return true; // Valid token
  } catch (err) {
    return false; // Invalid JWT format
  }
}

/**
 * Get Cognito JWT token with file caching
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {string} totpSecret - TOTP secret (base32)
 * @param {Object} cognitoConfig - Cognito configuration
 * @param {string} cognitoConfig.url - Cognito URL
 * @param {string} cognitoConfig.clientId - Cognito client ID
 * @returns {Promise<string>} JWT token
 */
async function getCognitoToken(username, password, totpSecret, cognitoConfig) {
  // Try to read cached token
  if (fs.existsSync(TOKEN_CACHE_FILE)) {
    try {
      const cachedToken = fs.readFileSync(TOKEN_CACHE_FILE, 'utf8').trim();

      if (isTokenValid(cachedToken, username, cognitoConfig.clientId)) {
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

/**
 * Pre-warm token cache (call in test.beforeAll)
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {string} totpSecret - TOTP secret
 * @param {Object} cognitoConfig - Cognito configuration
 * @returns {Promise<void>}
 */
async function warmupCache(username, password, totpSecret, cognitoConfig) {
  console.log('Warming up authentication cache...');

  // Get token (caches automatically)
  await getCognitoToken(username, password, totpSecret, cognitoConfig);

  console.log('✓ Cache warmed up');
}

/**
 * Clear token cache
 */
function clearCache() {
  // Clear file cache
  if (fs.existsSync(TOKEN_CACHE_FILE)) {
    try {
      fs.unlinkSync(TOKEN_CACHE_FILE);
      console.log('✓ Token cache cleared');
    } catch (err) {
      console.warn('Warning: Failed to clear token cache:', err.message);
    }
  }
}

module.exports = {
  getCognitoToken,
  warmupCache,
  clearCache
};
