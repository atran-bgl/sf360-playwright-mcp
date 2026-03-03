# SF360 Playwright MCP

AI-powered test generation for SF360 using Claude and Playwright.

[![npm version](https://badge.fury.io/js/%40bgl%2Fsf360-playwright-mcp.svg)](https://www.npmjs.com/package/@bgl/sf360-playwright-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is This?

**SF360 Playwright MCP** is an npm package that integrates with [Claude](https://claude.ai) to automatically generate, run, and debug Playwright tests for SF360.

**Key Features:**

- 🤖 **AI-Powered Test Generation** - Describe tests in plain English, Claude generates the code
- 🔐 **API-Based Authentication** - Fast Cognito JWT + SSO login (2-3s vs 10-15s UI)
- 🧪 **Automatic Debugging** - Claude runs tests, fixes failures, and retries automatically
- 📊 **Test Reports** - Comprehensive markdown reports with screenshots and evidence
- 🗺️ **166 Pre-Mapped Pages** - SF360 pages already configured and ready to test
- 🛠️ **Test Data Factories** - Automatic fund/member creation via API

---

## Prerequisites

Before installing, ensure you have:

- ✅ **Node.js >= 18.0.0** ([Download](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ **Claude Desktop** or **Claude CLI** ([Download](https://claude.ai/download))
- ✅ **SF360 Credentials** (username, password, TOTP secret)
- ✅ **AWS Credentials** (optional but recommended for faster API-based auth)

---

## Installation

### Step 1: Create Your Test Project

```bash
# Create a new directory for your tests
mkdir my-sf360-tests
cd my-sf360-tests

# Initialize npm project
npm init -y
```

### Step 2: Install the Package

Download the latest release from GitHub:

**Option 1: Install from release URL**

```bash
npm install https://github.com/bgl/sf360-playwright-mcp/releases/download/v1.0.0/bgl-sf360-playwright-mcp-1.0.0.tgz
```

**Option 2: Download tarball first**

1. Go to [Releases](https://github.com/bgl/sf360-playwright-mcp/releases)
2. Download `bgl-sf360-playwright-mcp-1.0.0.tgz`
3. Install:
    ```bash
    npm install ./bgl-sf360-playwright-mcp-1.0.0.tgz
    ```

This installs:

- MCP server for Claude integration
- Authentication helpers
- Test generation templates
- 166 pre-configured SF360 pages

### Step 3: Add MCP to Claude

Add the MCP server to Claude Desktop **before initializing**:

```bash
# macOS/Linux
claude mcp add sf360-playwright-mcp -- \
  node "$(pwd)/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"

# Windows (PowerShell)
claude mcp add sf360-playwright-mcp -- `
  node "$PWD/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"
```

**Restart Claude Desktop** after adding the MCP.

**Verify MCP is Added:**

1. Open Claude Desktop
2. Start a new chat
3. Type `/mcp` and press Enter
4. You should see `sf360-playwright-mcp` in the list
5. Select the `sf360-playwright-mcp`, then select **"View Tools"** to see the 8 available tools:
    - `init` - Initialize infrastructure
    - `discover-page` - Explore SF360 pages
    - `add-page-mapping` - Add new pages to mapping
    - `verify-setup` - Verify environment setup
    - `sf360-test-plan` - Create test plan from description
    - `sf360-test-generate` - Generate test code from plan
    - `sf360-test-evaluate` - Run and debug tests
    - `sf360-test-report` - Generate test reports

### Step 4: Initialize with Claude

Now in **Claude Desktop**, simply say:

```
Initialize SF360 testing in this project
```

Claude will:

1. ✅ Create `sf360-playwright/` folder structure
2. ✅ Ask for your SF360 credentials interactively
3. ✅ Create `.env` file with your credentials
4. ✅ Install required dependencies (@playwright/test, otplib, etc.)
5. ✅ Install Playwright browsers
6. ✅ Add official Playwright MCP for browser automation
7. ✅ Verify the complete setup

**What you'll need ready:**

- SF360 username (your BGL email)
- SF360 password
- TOTP secret from your authenticator app
- Your UID (numeric user ID)
- Firm name (e.g., "sf360test")

**How to get TOTP_SECRET:**

1. Open your authenticator app (Google Authenticator, Authy, etc.)
2. When setting up SF360 2FA, you'll see a QR code
3. Look for "Manual entry" or "Can't scan?" link
4. Copy the base32 secret key (e.g., `JBSWY3DPEHPK3PXP`)

After initialization, your project will have:

```
my-sf360-tests/
├── .env                        # Your SF360 credentials
├── playwright.config.js        # Playwright configuration
├── package.json               # npm dependencies
└── sf360-playwright/          # Test infrastructure
    ├── config/                # menu-mapping.json (166 pages)
    ├── helpers/               # Auth & API helpers
    ├── prompts/               # MCP tool prompts
    └── tests/                 # Your tests go here
```

---

## Verify Setup (Optional)

Setup verification happens automatically during initialization, but you can verify again anytime:

**Option 1: Via Claude (Recommended)**

```
Verify my SF360 test setup
```

Claude will run the verification and fix any issues automatically.

**Option 2: Via Command Line**

```bash
node sf360-playwright/helpers/verify-setup.js
```

**Expected output:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SF360 Playwright MCP - Setup Verification (v1.0.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Node.js: v18.17.0
✓ @aws-sdk/client-ssm: Installed
✓ axios: Installed
✓ tough-cookie: Installed
✓ http-cookie-agent/http: Installed
✓ otplib: Installed
✓ jsonwebtoken: Installed
✓ dotenv: Installed
✓ .env file: /path/to/project/.env
✓ AWS credentials: Configured (~/.aws/credentials)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All checks passed! Setup is complete.
```

**If you see errors**, the script will tell you exactly how to fix them.

---

## Quick Start Guide

### 1. Generate Your First Test

In **Claude Desktop**, describe the test you want:

```
Create a test that:
1. Logs into SF360
2. Creates a new SMSF fund called "Test Fund {timestamp}"
3. Navigates to the fund dashboard
4. Verifies the fund name appears correctly
```

Claude will:

1. 📋 Create a test plan (`sf360-test-plan` tool)
2. 💻 Generate Playwright code (`sf360-test-generate` tool)
3. 🧪 Run and debug the test (`sf360-test-evaluate` tool)
4. 📊 Generate a test report (`sf360-test-report` tool)

### 2. Run Tests Manually

```bash
# Run all tests
npx playwright test

# Run specific test
npx playwright test tests/fund-creation.spec.js

# Run with UI
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### 3. Explore Available Pages

Claude has access to **166 pre-mapped SF360 pages** across 13 sections:

- **HOME** - Dashboard, Entity Selection
- **WORKFLOW** - Jobs, Entities, Processing
- **CONNECT** - SuperStream, Lodgement, Banking
- **COMPLIANCE** - Rollover Caps, Transfer Balance
- **REPORTS** - Fund Reports, Member Reports
- **SETTINGS** - System Settings, User Management
- **And more...**

Ask Claude:

```
What SF360 pages are available for testing?
```

Or discover a specific page:

```
Discover elements on the Fund Dashboard page
```

---

## Workflow: 4-Tool Test Generation

The package uses a **4-tool workflow** for AI-powered test generation:

```
User Describes Test
      ↓
📋 sf360-test-plan
      ↓ (creates plan JSON)
💻 sf360-test-generate
      ↓ (creates test file)
🧪 sf360-test-evaluate
      ↓ (runs + debugs)
📊 sf360-test-report
      ↓ (generates report)
   ✅ Done!
```

### Example Conversation with Claude

**You:**

```
Create a test to add a new member to an existing fund
```

**Claude:**

```
I'll create a test plan for adding a member...
[Uses sf360-test-plan tool]

Test plan created at: tests/plans/member-create-plan.json

Now generating the test code...
[Uses sf360-test-generate tool]

Test created at: tests/member-create.spec.js

Running the test...
[Uses sf360-test-evaluate tool]

✅ Test passed! All steps completed successfully.

Generating report...
[Uses sf360-test-report tool]

Report saved at: tests/reports/member-create-report.md
```

---

## Authentication Methods

The package supports **two authentication methods**:

### Option 1: API-Based Auth (Recommended)

**Speed:** 2-3 seconds
**Requirements:** AWS credentials

1. Get AWS credentials from BGL IT
2. Run: `aws configure`
3. Enter Access Key ID and Secret Access Key

**Benefits:**

- ✅ Fast (2-3s login)
- ✅ Reliable
- ✅ No UI interactions
- ✅ Works in headless mode

### Option 2: UI-Based Fallback

**Speed:** 10-15 seconds
**Requirements:** `360_UAT_URL` in `.env`

Add to `.env`:

```bash
360_UAT_URL=https://sso.uat.bgl360.com.au/login/?app=sf360
```

**How it works:**

- Launches browser and logs in via UI
- Automatically enters username, password, and TOTP code
- Extracts session cookies for API use

---

## Available Tools in Claude

Once installed, you'll have these tools in Claude:

### 1. **init**

Initialize SF360 test infrastructure

```
Initialize SF360 testing in this project
```

### 2. **discover-page**

Explore a page and document all testable elements

```
Discover elements on the Member List page
```

### 3. **add-page-mapping**

Add a new SF360 page to the mapping

```
Add page "Workflow Settings" at URL /s/workflow-settings/ to WORKFLOW section
```

### 4. **verify-setup**

Verify dependencies and configuration

```
Verify my SF360 test setup
```

### 5. **sf360-test-plan**

Create structured test plan from description

```
Create test plan: Add new member with TFN validation
```

### 6. **sf360-test-generate**

Generate Playwright test from plan JSON

```
Generate test from tests/plans/member-create-plan.json
```

### 7. **sf360-test-evaluate**

Run test and automatically fix failures

```
Run and debug tests/member-create.spec.js
```

### 8. **sf360-test-report**

Generate comprehensive test execution report

```
Generate report for tests/member-create.spec.js
```

---

## Project Structure

After initialization, your project will have:

```
my-sf360-tests/
├── .env                           # SF360 credentials (gitignored)
├── .gitignore                     # Ignore sensitive files
├── package.json                   # npm dependencies
├── playwright.config.js           # Playwright config
│
├── sf360-playwright/              # Test infrastructure
│   ├── config/
│   │   └── menu-mapping.json      # 166 SF360 pages mapped
│   │
│   ├── helpers/
│   │   ├── auth.js                # Main auth helper with setupTest()
│   │   ├── auth-cognito.js        # Cognito JWT authentication
│   │   ├── auth-sso-login.js      # SSO login + cookie extraction
│   │   ├── auth-token-cache.js    # Token caching (1hr validity)
│   │   ├── fund-api.js            # Create funds via API
│   │   ├── member-api.js          # Create members via API
│   │   ├── data-factory.js        # Test data generation
│   │   └── verify-setup.js        # Setup verification script
│   │
│   ├── prompts/
│   │   ├── init-prompt.md              # Init tool instructions
│   │   ├── discover-page-prompt.md     # Page discovery
│   │   ├── verify-setup-prompt.md      # Setup verification
│   │   ├── test-plan-prompt.md         # Test planning
│   │   ├── test-generate-prompt.md     # Code generation
│   │   ├── test-evaluate-prompt.md     # Test execution/debug
│   │   └── test-report-prompt.md       # Report generation
│   │
│   └── tests/                     # Your test files go here
│       ├── plans/                 # Test plan JSONs
│       └── reports/               # Test execution reports
│
└── node_modules/
    └── @bgl/sf360-playwright-mcp/ # The MCP package
```

---

## Troubleshooting

### MCP Not Showing in Claude

1. Check MCP was added:

    ```bash
    claude mcp list
    ```

2. Restart Claude Desktop

3. Check MCP server path is correct:
    ```bash
    ls node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js
    ```

### Authentication Fails

1. Run verification:

    ```bash
    node sf360-playwright/helpers/verify-setup.js
    ```

2. Check `.env` has real values (not placeholders)

3. Verify TOTP secret is correct:
    ```bash
    node -e "
    const { authenticator } = require('otplib');
    const code = authenticator.generate(process.env.TOTP_SECRET);
    console.log('TOTP Code:', code);
    "
    ```

### Tests Fail to Run

1. Check Playwright browsers installed:

    ```bash
    npx playwright install chromium
    ```

2. Check @playwright/test installed:

    ```bash
    npm install --save-dev @playwright/test
    ```

3. Run in debug mode:
    ```bash
    npx playwright test --debug
    ```

### otplib Compatibility Issues

If TOTP generation fails, try stable version:

```bash
npm uninstall otplib
npm install otplib@12.0.1
```

Or run without otplib (manual TOTP entry):

```bash
npm uninstall otplib
npx playwright test --headed
# Enter TOTP manually when prompted
```

---

## Environment Variables

Complete `.env` reference:

```bash
# ===== Environment Selection =====
ENVIRONMENT=uat                    # uat, staging, or production

# ===== User Credentials =====
USERNAME=your.email@bglcorp.com.au # Your BGL email
USER_PASSWORD=your_password        # Your SF360 password
TOTP_SECRET=YOUR_BASE32_SECRET     # TOTP secret from authenticator

# ===== SF360 Configuration =====
UID=1234                           # Your numeric user ID
FIRM=sf360test                     # Default firm for tests

# ===== Optional: UI Fallback =====
# Only needed if you don't have AWS credentials
# 360_UAT_URL=https://sso.uat.bgl360.com.au/login/?app=sf360
```

---

## Support

- **GitHub Issues**: [Report bugs](https://github.com/bgl/sf360-playwright-mcp/issues)
- **Documentation**: [Full docs](https://github.com/bgl/sf360-playwright-mcp#readme)
- **BGL Confluence Ref**: https://bglcorp.atlassian.net/wiki/spaces/DEVOPS/pages/104857700/AWS+Login+via+Jumpcloud

---

## License

MIT License - See [LICENSE](LICENSE) file for details

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history

---

**Built by BGL QA Team** | Powered by [Claude](https://claude.ai) & [Playwright](https://playwright.dev)
