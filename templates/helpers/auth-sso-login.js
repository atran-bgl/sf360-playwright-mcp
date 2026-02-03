/**
 * SSO Login & Cookie Extraction
 * Handles SF360 SSO authentication and Playwright cookie formatting
 */

const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');
const authContext = require('./auth-context');

// Memory cache for SSO sessions (30 min expiry)
const ssoSessionCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Login to SF360 SSO and get Playwright-formatted cookies
 * @param {string} jwtToken - Cognito JWT IdToken
 * @param {string} firm - Firm short name
 * @param {string} ssoURL - SSO server URL
 * @returns {Promise<Array<Cookie>>} Playwright-formatted cookies
 */
async function loginToSSO(jwtToken, firm, ssoURL) {
  // Check memory cache first
  const cacheKey = firm;
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

    // Step 2: Select firm (this should redirect to SF360 and set cookies there)
    const selectFirmResponse = await axiosWithCookies.get(
      `${ssoURL}/selectfirm?app=sf360&firm=${firm}`,
      {
        maxRedirects: 5,  // Follow redirects
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept redirects
        }
      }
    );

    console.log(`DEBUG: selectfirm response URL: ${selectFirmResponse.request.res.responseUrl || 'unknown'}`);

    // Step 3: Extract cookies from jar (should now include SF360 domain cookies)
    const ssoURLCookies = cookieJar.getCookiesSync(ssoURL);

    // Also get cookies for SF360 domain
    const sf360Domain = ssoURL.replace('sso.uat.bgl360.com.au', 'uat.sf360.com.au');
    const sf360Cookies = cookieJar.getCookiesSync(sf360Domain);

    console.log(`DEBUG: SSO cookies (${ssoURLCookies.length}):`, ssoURLCookies.map(c => `${c.key} domain=${c.domain}`));
    console.log(`DEBUG: SF360 cookies (${sf360Cookies.length}):`, sf360Cookies.map(c => `${c.key} domain=${c.domain}`));

    const cookies = [...ssoURLCookies, ...sf360Cookies];

    // Step 3.5: Store cookies in auth context for API calls
    authContext.setCookies(cookies);
    console.log(`✓ Stored ${cookies.length} cookies in auth context`);

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
      } else if (typeof cookie.expires === 'number' && isFinite(cookie.expires)) {
        formatted.expires = cookie.expires;
      }

      // Handle sameSite
      if (cookie.sameSite) {
        const normalizedSameSite =
          cookie.sameSite.charAt(0).toUpperCase() +
          cookie.sameSite.slice(1).toLowerCase();
        if (['Strict', 'Lax', 'None'].includes(normalizedSameSite)) {
          formatted.sameSite = normalizedSameSite;
        }
      }

      return formatted;
    });

    // Cache the session
    ssoSessionCache.set(cacheKey, {
      cookies: playwrightCookies,
      expiresAt: Date.now() + CACHE_DURATION
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

/**
 * Clear SSO session cache
 */
function clearSSOCache() {
  ssoSessionCache.clear();
  console.log('✓ SSO session cache cleared');
}

module.exports = {
  loginToSSO,
  clearSSOCache
};
