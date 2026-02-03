/**
 * @bgl/sf360-playwright-mcp
 *
 * This package provides MCP server and templates for SF360 Playwright testing.
 *
 * Installation creates sf360-playwright/ folder in your project with:
 * - prompts/           (edit to customize Claude test generation)
 * - helpers/auth.js    (login helper - customize as needed)
 * - config/            (menu mappings - add your pages)
 * - tests/             (generated tests go here)
 *
 * Usage:
 * 1. npm install @bgl/sf360-playwright-mcp
 * 2. npx sf360-mcp-init
 * 3. Edit .env with credentials
 * 4. claude mcp add sf360-playwright-mcp -- node path/to/mcp-server/dist/index.js
 * 5. Restart Claude
 * 6. "Verify my SF360 test setup"
 *
 * In your tests, import from local files:
 * const { login, navigateToPage } = require('./sf360-playwright/helpers/auth');
 */

const path = require('path');

/**
 * Get the path to the MCP server executable
 * Use this in your Claude config
 *
 * @returns {string} Absolute path to MCP server
 * @example
 * const { getMCPServerPath } = require('@bgl/sf360-playwright-mcp');
 * console.log(getMCPServerPath());
 */
function getMCPServerPath() {
  return path.join(__dirname, 'mcp-server', 'dist', 'index.js');
}

module.exports = {
  // Helper to get MCP server path for Claude configuration
  getMCPServerPath,

  // Package metadata
  VERSION: require('./package.json').version,
  PACKAGE_NAME: '@bgl/sf360-playwright-mcp',
};
