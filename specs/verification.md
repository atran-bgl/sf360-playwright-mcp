# Phase 5: Verification & Testing

## Objective
Verify all components work together: file migration, login helper, MCP server, and test generation.

---

## Verification Checklist

### 1. File Structure ✓
```bash
tree .playwright-test-mcp -L 3
```

**Expected**:
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
│   ├── src/index.ts
│   ├── dist/index.js
│   ├── package.json
│   ├── tsconfig.json
│   └── build.sh
└── README.md
```

---

### 2. Login Helper ✓

**Test A: .env Missing**
```bash
mv .env .env.backup
npm test tests/badge.test.js
```
Expected: Clear error with setup instructions

**Test B: .env Incomplete**
```bash
echo "USERNAME=test@example.com" > .env.test
node -e "require('./.playwright-test-mcp/log-in-helper/auth').checkEnvExists('.env.test')"
```
Expected: Lists missing fields

**Test C: Valid .env**
```bash
mv .env.backup .env
npm test tests/badge.test.js
```
Expected: Login succeeds, test runs

---

### 3. MCP Server Build ✓

**Build**:
```bash
cd .playwright-test-mcp/mcp-server
./build.sh
```
Expected: Compiles successfully, dist/index.js exists

**Start Server**:
```bash
node dist/index.js
```
Expected: "SF360 Test Gen MCP Server running on stdio"
Press Ctrl+C to stop

---

### 4. MCP Server Integration ✓

**Add to Claude Config**:

Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "sf360-test-gen": {
      "command": "node",
      "args": ["/Users/atran/SFsourceCode/sf360-playwright-mcp/.playwright-test-mcp/mcp-server/dist/index.js"]
    }
  }
}
```

**Restart Claude**

**Test in Claude**:
```
List MCP tools from sf360-test-gen
```
Expected: 4 tools listed (generate-test, discover-page, update-login-helper, add-page-mapping)

---

### 5. Tool Invocation ✓

**Test generate-test tool**:
```
Use sf360-test-gen generate-test tool with:
- spec: "Test that badge settings page loads correctly"
- testName: "badge-page-load-test"
```

Expected: Returns prompt with instructions to generate test

**Verify prompt**:
- Contains login setup in beforeEach
- References correct paths
- Includes variable replacements

---

### 6. End-to-End Test Generation ✓

**Generate a complete test**:
```
Generate a Playwright test for the Badge settings page that:
1. Navigates to badge settings
2. Verifies the page title contains "Badge"
3. Takes a screenshot

Save it as badge-verification.test.js
```

**Expected Claude Actions**:
1. Invokes generate-test tool
2. Reads menu-mapping.json
3. Reads auth.js
4. Generates test file with:
   - Login in beforeEach
   - navigateToPage() call
   - Assertions
   - Screenshot
5. Saves to tests/badge-verification.test.js

**Run generated test**:
```bash
npm test tests/badge-verification.test.js
```
Expected: Test passes

---

### 7. Page Discovery ✓

**Discover elements on a page**:
```
Use discover-page tool to explore settings.badges page
```

Expected:
1. Claude invokes discover-page
2. Logs in automatically
3. Navigates to page
4. Captures page snapshot
5. Documents elements with selectors
6. Suggests test scenarios

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot find module auth" | Wrong import path | Check path is `.playwright-test-mcp/log-in-helper/auth` |
| "Prompt file not found" | Prompts not created | Create all 4 .md files in prompts/ |
| MCP tool not found | Config path wrong | Use absolute path in Claude config |
| Login fails | .env missing/invalid | Verify .env has all required fields |
| TypeScript errors | Wrong tsconfig | Check module: "Node16", moduleResolution: "Node16" |

---

## Success Criteria

**All of these must pass**:

- [ ] `.playwright-test-mcp/` directory structure correct
- [ ] auth.js validates .env properly
- [ ] auth.js auto-detects .env in project root
- [ ] MCP server compiles without errors
- [ ] MCP server starts successfully
- [ ] All 4 tools discoverable in Claude
- [ ] generate-test returns valid prompt
- [ ] Generated test includes login in beforeEach
- [ ] Generated test uses correct import paths
- [ ] Generated test runs and passes
- [ ] Prompts are editable by users
- [ ] badge.test.js works with new paths

---

## Final Validation Script

Create `verify.sh`:
```bash
#!/bin/bash
set -e

echo "1. Checking directory structure..."
test -f .playwright-test-mcp/log-in-helper/auth.js || exit 1
test -f .playwright-test-mcp/config/menu-mapping.json || exit 1
test -f .playwright-test-mcp/prompts/generate-test-prompt.md || exit 1

echo "2. Building MCP server..."
cd .playwright-test-mcp/mcp-server
npm install
npm run build
cd ../..

echo "3. Testing auth helper..."
node -e "const auth = require('./.playwright-test-mcp/log-in-helper/auth'); console.log('✓ Auth helper loaded')"

echo "4. Running existing tests..."
npm test tests/badge.test.js

echo "✓ All verifications passed!"
```

Run: `chmod +x verify.sh && ./verify.sh`

---

## Dependencies

**Requires**: Phases 1-4 complete
**Enables**: Production use of MCP server

---

## Post-Verification

Once verified:
1. Update main README.md with new structure
2. Document .env setup for consuming projects
3. Add examples of using MCP tools
4. Create quickstart guide
5. Tag release v0.1.0
