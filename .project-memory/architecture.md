# SF360 Playwright MCP - Architecture

**Project Type:** CLI/Library Package (npm package + MCP server)

---

## Overview

SF360 Playwright MCP is an npm package that provides:
1. **MCP Server** - Claude integration for SF360 test generation
2. **Template Files** - Copied to user projects during initialization
3. **Helper Functions** - Authentication and navigation utilities for Playwright tests

---

## Tech Stack

- **Runtime:** Node.js >= 18.0.0
- **Languages:** TypeScript (ES modules) + JavaScript (CommonJS)
- **MCP SDK:** @modelcontextprotocol/sdk ^1.0.4
- **Build:** TypeScript compiler (tsc)
- **Testing:** Playwright (peer dependency)
- **Auth:** AWS Cognito JWT + TOTP 2FA (otplib ^12.0.1)
- **HTTP:** axios ^1.6.0 with tough-cookie ^4.1.3 (cookie jar)
- **Tokens:** jsonwebtoken ^9.0.2 (JWT decode for caching)

---

## Project Structure

```
sf360-playwright-mcp/
├── mcp-server/                    # MCP server (TypeScript ES modules)
│   ├── src/
│   │   └── index.ts              # MCP server entry point
│   ├── dist/                      # Built JavaScript (generated)
│   ├── package.json              # MCP server dependencies
│   └── tsconfig.json             # TypeScript config
│
├── templates/                     # Template files (copied to user projects)
│   ├── helpers/
│   │   ├── auth.js               # API-based auth & setupTest() (CommonJS)
│   │   ├── auth-cognito.js       # Cognito JWT authentication
│   │   ├── auth-sso-login.js     # SSO login & cookie extraction
│   │   ├── auth-token-cache.js   # Token caching (file + memory)
│   │   ├── fund-api.js           # Fund creation via API
│   │   ├── member-api.js         # Member creation (3-step)
│   │   ├── data-factory.js       # Test data generation
│   │   └── verify-setup.js       # Setup verification script
│   ├── prompts/                  # MCP tool prompt templates
│   │   ├── init-prompt.md
│   │   ├── test-plan-prompt.md
│   │   ├── test-generate-prompt.md
│   │   ├── test-evaluate-prompt.md
│   │   ├── test-report-prompt.md
│   │   ├── discover-page-prompt.md
│   │   ├── update-login-helper-prompt.md
│   │   ├── add-page-mapping-prompt.md
│   │   └── verify-setup-prompt.md
│   ├── tests/
│   │   └── discover-page.test.js # Page discovery template
│   ├── config/
│   │   └── menu-mapping.json     # SF360 page navigation mapping (with requiresFund/requiresMember)
│   └── .env.template             # Environment variables (with Cognito/SSO config)
│
├── bin/                          # CLI scripts
│   ├── init.js                   # Interactive setup script
│   └── postinstall.js            # Post-install hook
│
├── package.json                  # Root package metadata
├── index.js                      # Package entry point (exports)
├── index.d.ts                    # TypeScript type definitions
└── README.md                     # Package documentation
```

---

## Key Components

### 1. MCP Server (`mcp-server/src/index.ts`)

**Purpose:** Provides MCP tools for Claude to generate SF360 Playwright tests

**Tools Defined:**
- `init` - Initialize SF360 test infrastructure in user project
- `generate-test` - Generate Playwright test from natural language
- `discover-page` - Explore SF360 page and document elements
- `update-login-helper` - Improve auth.js with new features
- `add-page-mapping` - Add new SF360 pages to menu mapping
- `verify-setup` - Verify dependencies and configuration

**How It Works:**
1. Claude calls MCP tool with arguments
2. Server loads corresponding prompt template from `sf360-playwright/prompts/`
3. Server injects variables into prompt (e.g., {{SPEC}}, {{PAGE_NAME}})
4. Server returns prompt to Claude as tool result
5. Claude follows prompt instructions to complete task

---

### 2. Auth Helper (`templates/helpers/auth.js`)

**Purpose:** API-based SF360 authentication and test fixture management

**Exports:**
- `setupTest(page, options)` - Complete test setup with auto fund/member creation
- `getCognitoToken(username, password, totpSecret, config)` - JWT auth with caching
- `loginToSSO(jwtToken, firm, ssoURL)` - SSO login with cookie extraction
- `createFund(options)` - Create fund via API
- `createMember(options)` - Create member via 3-step API process
- `navigateToPage(page, pageKey, options)` - Navigate using menu mapping

**Key Features:**
- **API-Based Auth:** Cognito JWT + TOTP → SSO → Playwright cookies (~2-3s vs 10-15s UI)
- **Token Caching:** File cache for JWT (1 hour), memory cache for SSO (30 min)
- **Auto Test Fixtures:** Creates fund/member based on pageKey requirements
- **3-Step Member Creation:** Contact → Member Data → Accumulation Account
- **Test Data Factories:** Unique names/emails via timestamp + random
- **Smart Setup:** Auto-detects requirements from menu-mapping.json

---

### 3. Menu Mapping (`templates/config/menu-mapping.json`)

**Purpose:** Pre-configured SF360 page URLs for navigation

**Structure:**
```json
{
  "section_name": {
    "page_key": {
      "name": "Display Name",
      "url": "/s/page-path/",
      "section": "SECTION",
      "external": false
    }
  }
}
```

**37+ pages organized by:**
- HOME - Dashboard, Entity Selection
- WORKFLOW - Jobs, Entities, Overview
- CONNECT - SuperStream, Bank Feeds, Lodgement
- COMPLIANCE - Audit Management
- REPORTS - Reports, Consolidated Reporting
- SETTINGS - Badges, Users, Contacts, Email Templates
- S.ADMIN - Common Query Data, Testing Tools
- SYSTEMDATA - Corporate Actions, Distribution Tax

---

### 4. Prompt Templates (`templates/prompts/*.md`)

**Purpose:** Instructions for Claude when MCP tools are called

**Design Pattern:**
- User calls MCP tool in Claude
- MCP server loads prompt from `sf360-playwright/prompts/` (user's project)
- Server injects variables (e.g., {{SPEC}}, {{PAGE_NAME}})
- Claude follows prompt instructions

**Why in User Projects:**
- Users can customize prompts for their workflow
- Changes persist across package updates
- Each project can have custom Claude behavior

---

## Architectural Patterns

### Package Distribution Model

**Installation Flow:**
1. User installs: `npm install git+https://github.com/bgl/sf360-playwright-mcp.git`
2. Package installed to `node_modules/@bgl/sf360-playwright-mcp/`
3. Postinstall hook runs: `node bin/postinstall.js` (displays setup instructions)

**Initialization Flow:**
1. User calls `init` MCP tool OR runs `npx sf360-mcp-init`
2. Template files copied from `node_modules/@bgl/sf360-playwright-mcp/templates/` → `sf360-playwright/`
3. User project now owns `sf360-playwright/` (can customize)
4. User edits `.env` with SF360 credentials
5. Dependencies installed: `@playwright/test`, `otplib`

**Template Copy Pattern:**
- Source: `node_modules/@bgl/sf360-playwright-mcp/templates/`
- Destination: `sf360-playwright/` (user project root)
- User owns destination, can modify freely
- Updates don't overwrite user changes

---

### MCP Server Architecture

**Server Type:** Stdio transport (runs as subprocess)

**Lifecycle:**
1. Claude spawns: `node path/to/mcp-server/dist/index.js`
2. Server starts stdio transport
3. Server registers tools via ListToolsRequestSchema
4. Claude sends CallToolRequestSchema with tool name + args
5. Server loads prompt, injects variables, returns text
6. Claude interprets prompt and executes instructions

**Prompt Loading:**
- Prompts read from `sf360-playwright/prompts/` (user's project)
- If not found, returns error: "Run npx sf360-mcp-init first"
- Allows per-project prompt customization

---

### Authentication Pattern

**Two-Factor Authentication Flow:**
1. Navigate to SF360 login page
2. Fill username + password
3. Submit and wait for 2FA page
4. Generate TOTP code (if otplib + TOTP_SECRET available)
5. Fill TOTP code or pause for manual entry
6. Submit and wait for firm selection (if multi-firm user)
7. Select firm and navigate to dashboard

**Fallback Strategy:**
- If TOTP_SECRET not provided → pause for manual entry
- If otplib not installed → pause for manual entry
- Tests work with or without automation

---

## Dependencies

### Production Dependencies

**None** - Package has zero runtime dependencies (intentional)

### Peer Dependencies

- `@playwright/test` >= 1.40.0 (required by user projects)

### MCP Server Dependencies

- `@modelcontextprotocol/sdk` ^1.0.4 (MCP protocol)

### Dev Dependencies (MCP Server)

- `@types/node` ^20.0.0 (TypeScript types)
- `typescript` ^5.3.0 (TypeScript compiler)

### Optional Dependencies (User Projects)

- `otplib` - For automatic TOTP 2FA
  - Latest version for Node 22+
  - Version 12.0.1 for Node 18/20 (stable fallback)
  - Not required - tests work with manual TOTP entry

---

## Build Process

**MCP Server Build:**
1. `cd mcp-server && npm install` - Install MCP SDK
2. `tsc` - Compile TypeScript to JavaScript
3. `chmod +x dist/index.js` - Make executable
4. Output: `mcp-server/dist/index.js`

**Package Build:**
- `npm run build` - Builds MCP server
- `npm run prepublishOnly` - Runs before publish (builds MCP server)

**Template Files:**
- No build step required (copied as-is)
- JavaScript files are CommonJS (no compilation)

---

## Integration Points

### Claude Integration

**MCP Server Path:**
```bash
claude mcp add sf360-playwright-mcp -- \
  node "$(pwd)/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"
```

**Tool Calls:**
- User says: "Initialize SF360 Playwright"
- Claude calls: `init` tool (no args)
- Server returns: init-prompt.md with instructions
- Claude follows prompt to create project structure, ask for credentials, etc.

### User Project Integration

**Import Pattern:**
```javascript
const { login, navigateToPage } = require('./sf360-playwright/helpers/auth');

test('should load Badge settings', async ({ page }) => {
  await login(page);
  await navigateToPage(page, 'settings.badges');
  expect(page.url()).toContain('/s/badge-settings/');
});
```

---

## Version Strategy

**Semantic Versioning:**
- **Patch (0.2.0 → 0.2.1):** Bug fixes, no API changes
- **Minor (0.2.0 → 0.3.0):** New features, backward compatible
- **Major (0.2.0 → 1.0.0):** Breaking changes

**Breaking Changes:**
- Changes to exported functions (login, navigateToPage signatures)
- Changes to menu-mapping.json structure
- Changes to MCP tool definitions (parameter changes)
- Changes to template file locations

**Non-Breaking Changes:**
- New MCP tools
- New helper functions
- New pages in menu-mapping.json
- Bug fixes in auth.js
- Prompt template improvements
