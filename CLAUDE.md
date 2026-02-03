# CLAUDE.md - SF360 Playwright MCP

## Project Memory System - CRITICAL

Uses `.project-memory/` for AI-managed task/context tracking.

**REQUIRED AT SESSION START - Read in order:**
1. `.project-memory/tasks/tasks-active.json` - Active/pending tasks
2. `.project-memory/architecture.md` - System design
3. `.project-memory/conventions.md` - Code patterns
4. `.project-memory/useful-commands.md` - Dev/build/test commands
5. `.project-memory/prompts/base.md` - Workflow rules

**Tools:** `project-memory parse-tasks`, `review`, `sync`, `create-spec`, `implement-feature`

---

## Forbidden Actions

**Git:** ONLY `git log` and `git diff` allowed. All other git commands forbidden. Ask before any git operation.

**Documentation:**
- **FORBIDDEN: Creating .md files** - DO NOT create any .md files without explicit approval. Ask first.
- NO massive .md files. Specs ≤200 lines. Prefer code comments over markdown.
- Store information in CLAUDE.md or existing documentation files instead.

**Dependencies:** NO upgrade/downgrade/add without approval. Ask first.

**Configuration:** NO tsconfig.json, .eslintrc, package.json changes without approval. Ask first.

**Public API:** NO changes to exported functions, MCP tools, or template files without approval. This is a library - backward compatibility is critical.

**Implementation:** NO code cleanup/refactor outside requirements. Minimal changes only. Ask if unsure.

---

## Project Overview

**SF360 Playwright MCP** - npm package providing:
1. MCP server for Claude integration (TypeScript)
2. Template files for user projects (JavaScript)
3. Authentication helpers for SF360 Playwright tests

**Tech Stack:** Node.js >= 18, TypeScript (ES modules), JavaScript (CommonJS), MCP SDK, Playwright

**Architecture:** See `.project-memory/architecture.md`

---

## Development Workflow

### Before Making Changes

1. **Read context:**
   - `.project-memory/prompts/base.md` - Understand ALL forbidden actions
   - `.project-memory/conventions.md` - Code style and patterns
   - `.project-memory/architecture.md` - Project structure

2. **Study similar code:**
   - Find 2-3 similar files
   - Document their patterns (naming, structure, formatting)
   - Match their style exactly

3. **Ask for approval if:**
   - Modifying public APIs (exported functions, MCP tools)
   - Adding/changing dependencies
   - Changing configuration files
   - Large refactors or breaking changes

### Making Changes

1. **Plan with TodoWrite:**
   - Create detailed task list
   - Include study steps before implementation
   - Include quality checks (linter, build, tests)
   - Include review step

2. **Implement incrementally:**
   - Study patterns first
   - Implement one task at a time
   - Verify acceptance criteria before marking complete
   - Call `project-memory self-reflect` mid-way if complex

3. **Quality checks:**
   - Run linter: `npm run lint` (if available)
   - Run build: `npm run build`
   - Run tests: `npm test`

4. **Review:**
   - Call `project-memory review`
   - Fix all critical and important issues
   - Verify all acceptance criteria met

### After Changes

1. **Commit:** Create commit with descriptive message
2. **Sync:** Run `project-memory sync` to update project memory

---

## Common Tasks

### Build MCP Server

```bash
npm run build
# Outputs: mcp-server/dist/index.js
```

### Add MCP Server to Claude

```bash
claude mcp add sf360-playwright-mcp -- \
  node "$(pwd)/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"
```

### Test Auth Helper

```bash
node sf360-playwright/helpers/verify-setup.js
```

### View Project Structure

```bash
tree -I 'node_modules|dist' -L 3
```

---

## Page Discovery Workflow

### Purpose
Automate page exploration to generate element inventories and tests. Claude uses MCP Playwright to analyze pages and create tests - no human manual exploration.

### Quick Start

```bash
# Discover a single page (creates session, navigates, captures elements)
node templates/helpers/explore-single-page.js --page=member_dashboard

# Reuse existing session to discover multiple pages quickly (skips authentication)
node templates/helpers/explore-single-page.js --page=fund_dashboard --reuse-session
node templates/helpers/explore-single-page.js --page=fund_details --reuse-session

# List all available pages
node templates/helpers/explore-single-page.js --list

# Explore entire menu (for menu-mapping.json updates)
node explore-all-pages.js
```

### The Two-Stage Process

**Stage 1: Automated Discovery Script**
- Authenticates via Cognito + SSO (or reuses existing session with `--reuse-session` flag)
- Creates fund/member based on page requirements (from menu-mapping.json)
- Saves session to `tmp/exploration-context.json` (valid 1 hour)
- Navigates to target page
- Captures screenshot and accessibility snapshot
- Exits immediately

**Session Reuse Optimization:**
- Use `--reuse-session` flag to skip authentication when discovering multiple pages
- Validates existing session: checks expiration and required test data (fund/member)
- Only re-authenticates if session expired or lacks required data for target page
- Saves significant time when batch-discovering pages (session valid for 1 hour)

**Stage 2: MCP Playwright Analysis**
- Reads session from `tmp/exploration-context.json`
- Injects cookies into separate MCP browser
- Navigates to page
- Analyzes snapshot to extract elements
- Generates element inventory JSON
- Creates test file

### File Organization

```
tmp/
  exploration-context.json          # Session (gitignored, expires in 1hr)

.playwright-mcp/
  discoveries/
    {page_key}/
      screenshot.png                # Full page capture
      snapshot.json                 # Accessibility tree
      metadata.json                 # Page info + test data
      elements.json                 # Element inventory (Claude generates)

templates/config/
  menu-mapping.json                 # 93 pages with requiresFund/requiresMember flags
```

### Key Files for Discovery

**Exploration Scripts:**
- `templates/helpers/explore-single-page.js` - Single page discovery
- `explore-all-pages.js` - Full menu exploration (for updating menu-mapping.json)

**Page Requirements:**
- `templates/config/menu-mapping.json` - 93 mapped pages
  - 34 pages: No requirements (global)
  - 42 pages: Requires fund only
  - 17 pages: Requires fund + member (Member/Compliance sections)

**Authentication Helpers:**
- `templates/helpers/auth.js` - Main auth + setup
- `templates/helpers/auth-cognito.js` - AWS Cognito JWT
- `templates/helpers/auth-sso-login.js` - SSO session cookies
- `templates/helpers/auth-context.js` - Cookie storage singleton
- `templates/helpers/fund-api.js` - Create fund via API
- `templates/helpers/member-api.js` - Create member via API

### Cookie Authentication Flow

```javascript
// 1. Discovery script saves session
const session = {
  baseUrl: 'https://uat.sf360.com.au',
  firm: 'sf360test',
  uid: 518,
  fundId: '8a8be2559c1cd1e9019c1ce98b970015',
  memberId: '8a8be2559c1cd1e9019c1ce98b970016',
  cookies: [ /* 8 cookies: 5 SSO domain, 3 SF360 domain */ ],
  expiresAt: '2026-02-02T13:00:00.000Z'
};

// 2. MCP Playwright injects cookies (separate browser)
const session = JSON.parse(fs.readFileSync('tmp/exploration-context.json'));
await page.context().addCookies(session.cookies);

// 3. Navigate with query params
const url = `${session.baseUrl}/s/member_dashboard/?firm=${session.firm}&uid=${session.uid}&mid=${session.fundId}`;
await page.goto(url);
```

### Important Notes

- **Two separate browsers**: Discovery script and MCP Playwright cannot share browser sessions
- **Session expires in 1 hour**: Re-run discovery script if expired
- **Cookies are domain-specific**: 5 for sso.uat.bgl360.com.au, 3 for uat.sf360.com.au
- **No manual exploration**: Everything automated for Claude

---

## Key Files

### MCP Server
- `mcp-server/src/index.ts` - Tool definitions, prompt loading
- `mcp-server/dist/index.js` - Built server (executable)

### Templates (Copied to User Projects)
- `templates/helpers/auth.js` - Login & navigation
- `templates/prompts/*.md` - MCP tool instructions
- `templates/config/menu-mapping.json` - SF360 page URLs
- `templates/.env.template` - Environment variables

### Package
- `package.json` - Root package metadata
- `index.js` - Package entry point
- `index.d.ts` - TypeScript definitions

### Project Memory
- `.project-memory/architecture.md` - System architecture
- `.project-memory/conventions.md` - Code style rules
- `.project-memory/prompts/base.md` - Core workflow rules

---

## MCP Tools

When users call these tools in Claude, the MCP server returns instructions:

1. **init** - Initialize SF360 test infrastructure in user project
2. **generate-test** - Generate Playwright test from natural language
3. **discover-page** - Explore SF360 page and document elements
4. **update-login-helper** - Improve auth.js with new features
5. **add-page-mapping** - Add SF360 pages to menu mapping
6. **verify-setup** - Verify dependencies and configuration

**How it works:**
- User calls tool in Claude
- MCP server loads prompt from `sf360-playwright/prompts/`
- Server injects variables (e.g., {{SPEC}}, {{PAGE_NAME}})
- Claude follows prompt instructions

---

## Public API (Breaking Change Awareness)

**These affect all users - changes require major version bump:**

### Exported Functions (index.js)
- `getMCPServerPath()` - Get MCP server path
- `VERSION` - Package version
- `PACKAGE_NAME` - Package name

### Auth Helper (templates/helpers/auth.js)
- `login(page, options)` - Login with TOTP 2FA
- `navigateToPage(page, pageKey, options)` - Navigate using menu mapping
- `generateTOTP(secret)` - Generate TOTP code
- `verifySetup(options)` - Verify setup

### MCP Tools (mcp-server/src/index.ts)
- Tool names: `init`, `generate-test`, `discover-page`, etc.
- Tool parameters: `spec`, `testName`, `pageKey`, etc.

### Menu Mapping (templates/config/menu-mapping.json)
- Structure: `{ section: { page_key: { name, url, section } } }`
- 37+ pre-configured pages

**Before changing:** Ask if breaking change is acceptable, plan version bump.

---

## Security Rules

**NEVER:**
- Commit .env files
- Hardcode credentials or secrets
- Log secrets to console
- Write API keys in test files

**ALWAYS:**
- Use environment variables for secrets
- Keep .env in .gitignore
- Validate user inputs
- Sanitize error messages

---

## Testing Strategy

**Current State:** No automated tests defined yet

**Future Tests:**
- Unit tests for auth helper functions
- Integration tests for MCP server
- E2E tests for template initialization
- Verify TOTP generation works correctly

**Test Command:** `npm test` (currently outputs "No tests defined yet")

---

## Version Strategy

**Semantic Versioning:**
- **Patch (0.2.0 → 0.2.1):** Bug fixes, no API changes
- **Minor (0.2.0 → 0.3.0):** New features, backward compatible
- **Major (0.2.0 → 1.0.0):** Breaking changes

**Breaking Changes Include:**
- Changes to exported function signatures
- Changes to MCP tool definitions or parameters
- Changes to menu-mapping.json structure
- Changes to template file locations
- Removal of features

---

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
rm -rf mcp-server/dist
cd mcp-server && npm install && npm run build
```

### MCP Server Not Found in Claude

```bash
# Verify server exists
ls -la node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js

# Re-add to Claude with absolute path
claude mcp add sf360-playwright-mcp -- \
  node "$(pwd)/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"

# Restart Claude
```

### TOTP Not Working

```bash
# Verify setup
node sf360-playwright/helpers/verify-setup.js

# Try stable otplib version
npm uninstall otplib
npm install otplib@12.0.1
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Build | `npm run build` |
| Test | `npm test` |
| Add to Claude | `claude mcp add sf360-playwright-mcp -- node "$(pwd)/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"` |
| Verify setup | `node sf360-playwright/helpers/verify-setup.js` |
| Check version | `npm list @bgl/sf360-playwright-mcp` |
| View commits | `git log --oneline -20` |

---

## Resources

- **README.md** - User-facing documentation
- **INSTALLATION.md** - Detailed installation guide
- **CHANGELOG.md** - Version history
- **GitHub:** https://github.com/bgl/sf360-playwright-mcp
- **MCP Protocol:** https://modelcontextprotocol.io/
- **Playwright:** https://playwright.dev/
