/**
 * TypeScript definitions for @bgl/sf360-playwright-mcp
 *
 * Note: The actual SF360 helper functions (login, navigateToPage, etc.)
 * are in your project at sf360-playwright/helpers/auth.js after running
 * npx sf360-mcp-init. Import them from there:
 *
 * @example
 * const { login, navigateToPage } = require('./sf360-playwright/helpers/auth');
 */

/**
 * Get the absolute path to the MCP server for Claude configuration
 */
export function getMCPServerPath(): string;

/**
 * Package version
 */
export const VERSION: string;

/**
 * Package name
 */
export const PACKAGE_NAME: string;
