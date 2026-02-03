# Phase 3: MCP Server Implementation

## Objective
Build MCP server with 4 tools for test generation with automatic login.

---

## Directory Structure

```
.playwright-test-mcp/mcp-server/
├── src/index.ts                 # Main server
├── dist/index.js                # Compiled
├── package.json
├── tsconfig.json
├── build.sh
└── .gitignore
```

---

## Files to Create

### 1. package.json

```json
{
  "name": "sf360-test-gen-mcp",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc && chmod +x dist/index.js",
    "watch": "tsc --watch"
  },
  "bin": { "sf360-test-gen-mcp": "./dist/index.js" },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  },
  "engines": { "node": ">=18.0.0" }
}
```

### 2. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### 3. build.sh

```bash
#!/bin/bash
set -e
npm install
npm run build
echo "✓ Build complete"
```

Make executable: `chmod +x build.sh`

### 4. .gitignore

```
node_modules/
dist/
*.log
```

### 5. src/index.ts

See full implementation in separate file: `mcp-server-code.md`

**Key components**:
- Load prompts from `../prompts/*.md` files
- 4 tools: generate-test, discover-page, update-login-helper, add-page-mapping
- Variable injection: `{{SPEC}}`, `{{PAGE_KEY}}`, etc.
- Error handling with MCP format
- Stdio transport

---

## Build & Test

### Build
```bash
cd .playwright-test-mcp/mcp-server
./build.sh
```

### Test Server Start
```bash
node dist/index.js
# Expected: "SF360 Test Gen MCP Server running on stdio"
```

---

## Claude Integration

### Desktop Config
`~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "sf360-test-gen": {
      "command": "node",
      "args": ["/full/path/.playwright-test-mcp/mcp-server/dist/index.js"]
    }
  }
}
```

### CLI Config
`~/.config/claude/config.yaml`:
```yaml
mcpServers:
  sf360-test-gen:
    command: node
    args: ["/full/path/.playwright-test-mcp/mcp-server/dist/index.js"]
```

---

## 4 Tools Provided

| Tool | Purpose | Required Args |
|------|---------|--------------|
| generate-test | Generate test from spec | spec, testName |
| discover-page | Document page elements | pageKey |
| update-login-helper | Enhance auth.js | improvements |
| add-page-mapping | Add page to mapping | pageName, url, section |

---

## Implementation Details

### Prompt Loading
- Reads from `../ prompts/*.md`
- Runtime loading (users can edit without recompiling)
- Fallback error if missing

### Variable Injection
- Pattern: `{{VARIABLE}}`
- Replaced with tool arguments
- Example: `{{SPEC}}` → `args.spec`

### Error Handling
- Try-catch around execution
- MCP error format
- Stderr for logging

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Module not found | `npm install` |
| Prompt not found | Create `.playwright-test-mcp/prompts/` |
| Permission denied | `chmod +x dist/index.js` |
| Tool not in Claude | Check config path, restart Claude |

---

## Success Checklist

- [ ] Compiles without errors
- [ ] Server starts successfully
- [ ] 4 tools discoverable in Claude
- [ ] Prompts load from .md files
- [ ] Variable injection works
- [ ] Error handling works

---

## Files Created

1. `.playwright-test-mcp/mcp-server/package.json`
2. `.playwright-test-mcp/mcp-server/tsconfig.json`
3. `.playwright-test-mcp/mcp-server/build.sh`
4. `.playwright-test-mcp/mcp-server/.gitignore`
5. `.playwright-test-mcp/mcp-server/src/index.ts`

---

## Dependencies

**Requires**: Phase 1-2 complete
**Enables**: Phase 4-5 (prompts, verification)
