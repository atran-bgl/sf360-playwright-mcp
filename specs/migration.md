# Phase 1: File Migration and Restructuring

## Objective
Restructure project to `.playwright-test-mcp/` directory that can be consumed by other projects.

---

## Directory Structure to Create

```
.playwright-test-mcp/
├── log-in-helper/
│   └── auth.js
├── config/
│   └── menu-mapping.json
├── prompts/
│   ├── generate-test-prompt.md
│   ├── discover-page-prompt.md
│   ├── update-login-helper-prompt.md
│   └── add-page-mapping-prompt.md
├── mcp-server/
│   ├── src/
│   │   └── index.ts
│   ├── dist/
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
└── README.md
```

---

## Step 1: Create Directory Structure

Create all directories:
```bash
mkdir -p .playwright-test-mcp/log-in-helper
mkdir -p .playwright-test-mcp/config
mkdir -p .playwright-test-mcp/prompts
mkdir -p .playwright-test-mcp/mcp-server/src
mkdir -p .playwright-test-mcp/mcp-server/dist
```

---

## Step 2: Move Files

### Move auth.js
**From**: `helpers/auth.js`
**To**: `.playwright-test-mcp/log-in-helper/auth.js`

**Changes Required in auth.js**:
1. Update menu-mapping.json path:
   ```javascript
   // OLD (line 202):
   fs.readFileSync(path.join(__dirname, '..', 'config', 'menu-mapping.json'), 'utf8')

   // NEW:
   fs.readFileSync(path.join(__dirname, '..', 'config', 'menu-mapping.json'), 'utf8')
   ```
   *(Path stays same - both are one level up)*

2. Update .env search paths:
   ```javascript
   // OLD (lines 76-82):
   const possiblePaths = [
     path.join(currentDir, '.env'),
     path.join(currentDir, '..', '.env'),
     path.join(currentDir, '..', '..', '.env'),
     path.join(__dirname, '..', '.env'),
     path.join(__dirname, '..', '..', '..', 'superstream_dashboard', '.env'),
   ];

   // NEW (for consuming project):
   const possiblePaths = [
     path.join(currentDir, '.env'),                    // Project root
     path.join(currentDir, '..', '.env'),              // Parent
     path.join(currentDir, '../..', '.env'),           // Grandparent
   ];
   ```

### Move menu-mapping.json
**From**: `config/menu-mapping.json`
**To**: `.playwright-test-mcp/config/menu-mapping.json`

No changes needed - JSON data only.

---

## Step 3: Update Import Paths

### Update tests/badge.test.js
**Current imports (line 7)**:
```javascript
const { login, navigateToPage } = require('../helpers/auth');
```

**New imports**:
```javascript
const { login, navigateToPage } = require('../.playwright-test-mcp/log-in-helper/auth');
```

**Current envPath (line 17)**:
```javascript
envPath: path.join(__dirname, '../../../superstream_dashboard/.env')
```

**New envPath** (let it auto-detect from project root):
```javascript
// Remove envPath option - let auth.js auto-detect from consuming project
await login(page);
```

### Update helpers/quick-test.js
**Current imports (line 2)**:
```javascript
const { login, navigateToPage } = require('./auth');
```

**New imports**:
```javascript
const { login, navigateToPage } = require('../.playwright-test-mcp/log-in-helper/auth');
```

### Update playwright.config.js
**Current globalSetup (line 10)**:
```javascript
globalSetup: './helpers/global-setup.js',
```

**Decision**: Remove global-setup.js dependency
**Reason**: Directories (screenshots/, test-results/) are auto-created by Playwright

**Action**: Remove or comment out the globalSetup line.

---

## Step 4: Handle Old Files

### Keep at Root (For Now)
- `helpers/global-setup.js` - Keep for backward compatibility
- `helpers/quick-test.js` - Update imports but keep at root
- `tests/badge.test.js` - Update imports, keep as example
- `specs/` - Keep for documentation reference

### Don't Move
- `package.json` - Stays at root (project-level)
- `playwright.config.js` - Stays at root
- `.env.example` - Stays at root
- `README.md` - Stays at root (will update)

---

## Step 5: Update .gitignore

Add to `.gitignore`:
```
# MCP Server compiled output
.playwright-test-mcp/mcp-server/dist/
.playwright-test-mcp/mcp-server/node_modules/

# Keep source files
!.playwright-test-mcp/mcp-server/src/
```

---

## Step 6: Create .playwright-test-mcp/README.md

Create documentation explaining:
1. What this directory contains
2. How consuming projects use it
3. How to customize prompts
4. Login helper setup requirements

**Key sections**:
- Overview
- Directory Structure
- Setup Instructions for Consuming Projects
- Prompt Customization
- Login Helper Configuration

---

## Verification Steps

After migration:

1. **Test auth.js import**:
   ```bash
   node -e "const auth = require('./.playwright-test-mcp/log-in-helper/auth'); console.log(typeof auth.login);"
   ```
   Expected: `function`

2. **Test menu-mapping.json load**:
   ```bash
   node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync('./.playwright-test-mcp/config/menu-mapping.json')); console.log(Object.keys(data).length);"
   ```
   Expected: `8` (8 sections)

3. **Test badge.test.js imports**:
   ```bash
   npm test tests/badge.test.js
   ```
   Expected: Login helper loads successfully

---

## Rollback Plan

If migration fails:
1. Keep original `helpers/` and `config/` directories
2. Copy (don't move) files initially
3. Once verified working, remove old files

---

## Critical Path Dependencies

**Before this phase**:
- Nothing (first phase)

**After this phase**:
- Phase 2 (login-helper.md) - Enhance auth.js validation
- Phase 3 (mcp-server.md) - MCP server needs auth.js and menu-mapping.json paths

---

## File Change Summary

| Action | File | New Location |
|--------|------|--------------|
| Move | `helpers/auth.js` | `.playwright-test-mcp/log-in-helper/auth.js` |
| Move | `config/menu-mapping.json` | `.playwright-test-mcp/config/menu-mapping.json` |
| Update | `tests/badge.test.js` | Import path change |
| Update | `helpers/quick-test.js` | Import path change |
| Update | `playwright.config.js` | Remove globalSetup |
| Create | `.playwright-test-mcp/README.md` | New file |
| Update | `.gitignore` | Add MCP server entries |

**Total**: 2 moves, 3 updates, 2 creates
