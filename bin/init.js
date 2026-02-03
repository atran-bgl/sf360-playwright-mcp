#!/usr/bin/env node

/**
 * SF360 Playwright MCP Initialization Tool
 * Sets up a new project with SF360 test infrastructure
 *
 * Usage: npx sf360-mcp-init
 */

const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const SF360_DIR = path.join(CWD, 'sf360-playwright');

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SF360 Playwright MCP - Project Initialization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Get templates directory from the installed package
let packageDir;
try {
  // When installed as a package
  packageDir = path.dirname(require.resolve('@bgl/sf360-playwright-mcp'));
} catch (e) {
  // When running from the package directory during development
  packageDir = path.join(__dirname, '..');
}
const templatesDir = path.join(packageDir, 'templates');

// Helper function to copy directory recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Step 1: Create sf360-playwright directory structure
if (!fs.existsSync(SF360_DIR)) {
  console.log('✓ Creating sf360-playwright/ directory structure...');

  // Copy all templates
  copyDir(templatesDir, SF360_DIR);

  // Create tests directory
  const testsDir = path.join(SF360_DIR, 'tests');
  fs.mkdirSync(testsDir, { recursive: true });

  console.log(`  Created: ${SF360_DIR}/`);
  console.log(`  Created: ${SF360_DIR}/prompts/`);
  console.log(`  Created: ${SF360_DIR}/helpers/`);
  console.log(`  Created: ${SF360_DIR}/config/`);
  console.log(`  Created: ${SF360_DIR}/tests/\n`);
} else {
  console.log('✓ sf360-playwright/ directory already exists\n');
}

// Step 2: Create .env file (in project root, not in sf360-playwright/)
const envPath = path.join(CWD, '.env');
const envTemplatePath = path.join(SF360_DIR, '.env.template');

if (!fs.existsSync(envPath)) {
  console.log('✓ Creating .env file in project root...');

  if (fs.existsSync(envTemplatePath)) {
    fs.copyFileSync(envTemplatePath, envPath);
  } else {
    fs.writeFileSync(envPath, `# SF360 Credentials
USERNAME=your.email@bglcorp.com.au
USER_PW=your_password
FIRM=sf360test
360_UAT_URL=https://sso.uat.bgl360.com.au/login/?app=sf360

# Optional: TOTP secret for automatic 2FA
# Get this from your authenticator app during initial setup
TOTP_SECRET=
`);
  }

  console.log(`  Created: ${envPath}`);
  console.log('  ⚠️  ACTION REQUIRED: Edit .env with your real credentials\n');
} else {
  console.log('✓ .env already exists\n');
}

// Step 3: Create playwright.config.js
const configPath = path.join(CWD, 'playwright.config.js');
if (!fs.existsSync(configPath)) {
  console.log('✓ Creating playwright.config.js...');
  fs.writeFileSync(configPath, `const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './sf360-playwright/tests',
  timeout: 60000,
  retries: 0,
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
`);
  console.log(`  Created: ${configPath}\n`);
} else {
  console.log('✓ playwright.config.js already exists\n');
}

// Step 4: Create example test
const exampleTest = path.join(SF360_DIR, 'tests', 'example.test.js');
if (!fs.existsSync(exampleTest)) {
  console.log('✓ Creating example test...');
  fs.writeFileSync(exampleTest, `/**
 * Example SF360 Test
 * Demonstrates basic usage of SF360 Playwright test infrastructure
 */

const { test, expect } = require('@playwright/test');
const { login, navigateToPage } = require('../helpers/auth');

test.describe('SF360 Example Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login automatically before each test
    // Credentials loaded from .env in project root
    await login(page);
  });

  test('should navigate to Badge settings page', async ({ page }) => {
    // Navigate to page using menu mapping
    await navigateToPage(page, 'settings.badges');

    // Verify URL
    expect(page.url()).toContain('/s/badge-settings/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Basic assertion
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });
});
`);
  console.log(`  Created: ${exampleTest}\n`);
} else {
  console.log('✓ Example test already exists\n');
}

// Step 5: Get MCP server path
const mcpServerPath = path.join(packageDir, 'mcp-server', 'dist', 'index.js');

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your SF360 test infrastructure is ready:

  ${SF360_DIR}/
  ├── prompts/           # Edit to customize Claude test generation
  ├── helpers/           # Login helper (customize as needed)
  ├── config/            # Menu mappings (add your pages)
  └── tests/             # Your tests go here

Next Steps:

1. Edit .env with your SF360 credentials:
   ${envPath}

   Required:
   - USERNAME (your SF360 email)
   - USER_PW (your password)
   - FIRM (e.g., sf360test)
   - 360_UAT_URL (SF360 login URL)
   - TOTP_SECRET (optional, for automatic 2FA)

2. Install otplib for automatic 2FA (optional but recommended):
   npm install otplib

3. Configure Claude MCP server:
   cd ${CWD}
   claude mcp add sf360-playwright-mcp -- node "${mcpServerPath}"

4. Restart Claude and verify setup:
   In Claude: "Verify my SF360 test setup"

5. Generate your first test:
   In Claude: "Generate a test for the Badge settings page"

6. Run tests:
   npx playwright test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Documentation: https://github.com/bgl/sf360-playwright-mcp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
