# SF360 Playwright MCP Implementation Plan

**Project Goal**: Create an MCP server that guides Claude to generate Playwright test suites with automatic SF360 login integration.

---

## Plan Structure

This plan is split into multiple files for clarity:

1. **[THIS FILE]** - Overview and execution order
2. **migration.md** - File migration and restructuring
3. **mcp-server.md** - MCP server implementation
4. **login-helper.md** - Login helper enhancements
5. **prompts.md** - Prompt template creation
6. **verification.md** - Testing and verification

---

## High-Level Overview

### Current State
- Working Playwright test framework at project root
- Auth helper with SF360 login + TOTP support
- Menu mapping with 37 pages
- Example test (badge.test.js)
- MCP specifications (in specs/ folder)

### Target State
```
.playwright-test-mcp/
├── log-in-helper/
│   └── auth.js                     # Enhanced login helper
├── config/
│   └── menu-mapping.json           # Page navigation mapping
├── prompts/                         # User-editable prompts
│   ├── generate-test-prompt.md
│   ├── discover-page-prompt.md
│   ├── update-login-helper-prompt.md
│   └── add-page-mapping-prompt.md
├── mcp-server/
│   ├── src/
│   │   └── index.ts                # MCP server
│   ├── dist/                       # Compiled JS
│   ├── package.json
│   ├── tsconfig.json
│   └── build.sh                    # Build script
└── README.md                        # Setup instructions

# At consuming project root:
tests/                               # Generated tests go here
.env                                 # Consuming project provides this
playwright.config.js                 # Consuming project provides this
```

### Key Design Decisions

1. **Login is Always First Step**: All generated tests include login in `beforeEach` hook
2. **User-Editable Prompts**: Prompts stored as `.md` files for easy customization
3. **Consuming Project Pattern**: This MCP is added to other projects via npm/git
4. **Enhanced Validation**: Login helper validates .env exists and contains required fields
5. **Clear Test Naming**: Generated tests have descriptive, unique names

---

## Execution Order

Execute sub-plans in this order:

### Phase 1: Restructure (migration.md)
- Create `.playwright-test-mcp/` directory structure
- Move existing files to new locations
- Update all import paths
- Update playwright.config.js references

### Phase 2: Enhance Login Helper (login-helper.md)
- Add robust .env validation
- Improve error messages for consuming projects
- Update path resolution logic
- Add consuming project detection

### Phase 3: Create MCP Server (mcp-server.md)
- Initialize TypeScript project
- Implement MCP server with 4 tools
- Add prompt loading logic
- Create build system

### Phase 4: Write Prompt Templates (prompts.md)
- Create generate-test-prompt.md
- Create discover-page-prompt.md
- Create update-login-helper-prompt.md
- Create add-page-mapping-prompt.md

### Phase 5: Verification (verification.md)
- Test login helper with/without .env
- Build and test MCP server
- Test tool invocations
- Generate sample test

---

## Critical Files to Modify

### Files to Move
- `helpers/auth.js` → `.playwright-test-mcp/log-in-helper/auth.js`
- `config/menu-mapping.json` → `.playwright-test-mcp/config/menu-mapping.json`

### Files to Create
- `.playwright-test-mcp/prompts/*.md` (4 files)
- `.playwright-test-mcp/mcp-server/src/index.ts`
- `.playwright-test-mcp/mcp-server/package.json`
- `.playwright-test-mcp/mcp-server/tsconfig.json`
- `.playwright-test-mcp/README.md`

### Files to Update
- `tests/badge.test.js` (update import paths)
- `helpers/quick-test.js` (update import paths)
- `README.md` (update documentation)

---

## Success Criteria

- [ ] All files moved to `.playwright-test-mcp/` structure
- [ ] Login helper validates .env in consuming projects
- [ ] MCP server starts without errors
- [ ] All 4 tools are discoverable
- [ ] Prompts are user-editable markdown files
- [ ] Generated tests always include login in beforeEach
- [ ] Example test runs successfully with new paths
- [ ] Build script compiles MCP server to dist/

---

## Next Steps

Proceed to detailed sub-plans in order:
1. migration.md
2. login-helper.md
3. mcp-server.md
4. prompts.md
5. verification.md
