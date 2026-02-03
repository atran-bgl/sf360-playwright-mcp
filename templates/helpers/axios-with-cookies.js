/**
 * Shared Axios Instance with Cookie Support
 * Used by all API helpers (fund-api, member-api, etc.)
 */

const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');

// Global cookie jar shared across all API calls
const globalCookieJar = new CookieJar();

// Create axios instance with cookie support
const axiosWithCookies = axios.create({
  httpAgent: new HttpCookieAgent({
    cookies: { jar: globalCookieJar },
    keepAlive: true
  }),
  httpsAgent: new HttpsCookieAgent({
    cookies: { jar: globalCookieJar },
    keepAlive: true,
    rejectUnauthorized: false  // Accept self-signed certs in UAT
  })
});

/**
 * Set cookies in the global jar (called after SSO login)
 * @param {Array} cookies - Array of cookie objects from tough-cookie
 * @param {string} url - URL to set cookies for
 */
function setCookies(cookies, url) {
  cookies.forEach(cookie => {
    globalCookieJar.setCookieSync(cookie.toString(), url);
  });
}

/**
 * Clear all cookies
 */
function clearCookies() {
  globalCookieJar.removeAllCookiesSync();
}

module.exports = {
  axiosWithCookies,
  globalCookieJar,
  setCookies,
  clearCookies
};
