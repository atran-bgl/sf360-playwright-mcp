#!/usr/bin/env node

/**
 * Post-install script for @bgl/sf360-playwright-mcp
 * Displays helpful setup information after installation
 */

const path = require('path');
const fs = require('fs');

// Check if we're being installed as a dependency (not in the package itself)
const isLocalInstall = __dirname.includes('node_modules');

if (isLocalInstall) {
  const packageJson = require('../package.json');
  const mcpServerPath = path.join(__dirname, '..', 'mcp-server', 'dist', 'index.js');
  const absolutePath = path.resolve(mcpServerPath);
  const projectRoot = process.cwd();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${packageJson.name} v${packageJson.version} installed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick Setup (3 steps):

1. Configure Claude MCP server:

   cd ${projectRoot}
   claude mcp add sf360-playwright-mcp -- node "${absolutePath}"

2. Restart Claude Desktop (or CLI session)

3. In Claude, run the interactive setup wizard:

   "Initialize SF360 Playwright"

   The wizard will:
   ✓ Create project structure
   ✓ Ask for your SF360 credentials
   ✓ Install dependencies
   ✓ Add Playwright MCP for browser automation
   ✓ Verify everything works

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  That's it! Claude handles the rest interactively.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Optional: Manual setup (if you prefer):
  npx sf360-mcp-init

Documentation: https://github.com/bgl/sf360-playwright-mcp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}
