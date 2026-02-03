# SF360 Playwright MCP - Useful Commands

**Common commands for development, testing, and building.**

---

## Development Commands

### Install Dependencies

```bash
# Install root package dependencies (none currently)
npm install

# Install MCP server dependencies
cd mcp-server && npm install
```

---

### Build Commands

```bash
# Build MCP server (TypeScript → JavaScript)
npm run build

# Or build from mcp-server directory
cd mcp-server && npm run build

# Watch mode (auto-rebuild on changes)
cd mcp-server && npm run watch
```

**Output:** `mcp-server/dist/index.js` (executable MCP server)

---

### Test Commands

```bash
# Run tests (currently no tests defined)
npm test

# Note: No tests currently defined
# Output: "No tests defined yet"
```

---

## MCP Server Commands

### Add MCP Server to Claude

```bash
# From project root, add to Claude config
claude mcp add sf360-playwright-mcp -- \
  node "$(pwd)/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"
```

### Test MCP Server Locally

```bash
# Run MCP server directly (for debugging)
node mcp-server/dist/index.js

# Server runs on stdio, expects MCP protocol messages
```

---

## Package Commands

### Install Package Locally

```bash
# Install from GitHub
npm install git+https://github.com/bgl/sf360-playwright-mcp.git

# Install specific version
npm install git+https://github.com/bgl/sf360-playwright-mcp.git#v0.2.0
```

### Initialize User Project

```bash
# Run init script (alternative to MCP tool)
npx sf360-mcp-init

# Or use Claude with MCP tool
# Say: "Initialize SF360 Playwright"
```

---

## Template Testing Commands

### Test Auth Helper

```bash
# Verify setup (Node version, otplib, .env)
node sf360-playwright/helpers/verify-setup.js

# Or import and call in Node
node -e "const {verifySetup} = require('./sf360-playwright/helpers/auth'); verifySetup();"
```

### Test Login Flow

```bash
# Run a test that uses login helper
npx playwright test sf360-playwright/tests/discover-page.test.js --headed

# Run specific test with debugging
npx playwright test --debug
```

---

## Publishing Commands

**For maintainers only:**

```bash
# Build before publishing (runs automatically via prepublishOnly)
npm run prepublishOnly

# Publish to npm (when ready)
npm publish

# Create git tag for release
git tag v0.2.0
git push origin v0.2.0
```

---

## Troubleshooting Commands

### Check Package Version

```bash
# Check installed version
npm list @bgl/sf360-playwright-mcp

# Check package.json version
cat package.json | grep version
```

### Verify MCP Server Build

```bash
# Check if MCP server is built
ls -la mcp-server/dist/index.js

# Check if executable
file mcp-server/dist/index.js

# Should output: "mcp-server/dist/index.js: Node.js script text executable"
```

### Check Node Version

```bash
# Check Node version (must be >= 18.0.0)
node --version

# Verify otplib compatibility
node -e "const {authenticator} = require('otplib'); console.log(authenticator.generate('JBSWY3DPEHPK3PXP'));"
```

### Debug MCP Tools

```bash
# Check Claude MCP config
cat ~/.config/claude-code/config.json

# Or on macOS
cat ~/Library/Application\ Support/claude-code/config.json

# Check MCP server logs (stderr)
# MCP servers log to stderr, not stdout
```

---

## Git Commands

### View Recent Changes

```bash
# View last 20 commits
git log --oneline -20

# View uncommitted changes
git diff

# View staged changes
git diff --cached
```

### Commit Changes

```bash
# Stage files
git add [files]

# Commit with message
git commit -m "feat: add new feature"

# Push to remote
git push origin main
```

---

## Directory Navigation

```bash
# Project root
cd /path/to/sf360-playwright-mcp

# MCP server source
cd mcp-server/src

# Templates
cd templates

# After init, user project structure:
cd sf360-playwright/helpers
cd sf360-playwright/prompts
cd sf360-playwright/config
```

---

## File Search Commands

```bash
# Find TypeScript files
find . -name "*.ts" -not -path "*/node_modules/*"

# Find JavaScript files
find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/dist/*"

# Search for specific code
grep -r "login" --include="*.js" --exclude-dir=node_modules

# Count lines of code
find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs wc -l
```

---

## Cleanup Commands

```bash
# Remove node_modules
rm -rf node_modules mcp-server/node_modules

# Remove build output
rm -rf mcp-server/dist

# Reinstall everything
npm install && cd mcp-server && npm install && npm run build
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Install package | `npm install git+https://github.com/bgl/sf360-playwright-mcp.git` |
| Build MCP server | `npm run build` |
| Add to Claude | `claude mcp add sf360-playwright-mcp -- node "$(pwd)/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"` |
| Init user project | `npx sf360-mcp-init` or use Claude MCP tool |
| Verify setup | `node sf360-playwright/helpers/verify-setup.js` |
| Test login | `npx playwright test --headed` |
| Check version | `npm list @bgl/sf360-playwright-mcp` |
