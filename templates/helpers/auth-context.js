/**
 * Authentication Context
 * Stores cookies and authentication state for API calls
 */

class AuthContext {
  constructor() {
    this.cookies = [];
    this.baseUrl = null;
    this.firm = null;
    this.uid = null;
  }

  /**
   * Set cookies from SSO login
   * @param {Array} cookies - Array of cookie objects from tough-cookie
   */
  setCookies(cookies) {
    this.cookies = cookies;
  }

  /**
   * Get cookie header string for axios requests
   * @returns {string} Cookie header value
   */
  getCookieHeader() {
    return this.cookies
      .map(cookie => `${cookie.key}=${cookie.value}`)
      .join('; ');
  }

  /**
   * Set base configuration
   */
  setConfig(config) {
    this.baseUrl = config.baseUrl;
    this.firm = config.firm;
    this.uid = config.uid;
  }

  /**
   * Clear all auth data
   */
  clear() {
    this.cookies = [];
    this.baseUrl = null;
    this.firm = null;
    this.uid = null;
  }
}

// Singleton instance
const authContext = new AuthContext();

module.exports = authContext;
