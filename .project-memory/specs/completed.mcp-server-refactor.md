---
status: completed
domain: mcp-server
implementation-status: IMPLEMENTED
---

# MCP Server Refactor: Server → McpServer with Config-Driven Tools

**Status:** Completed | **Created:** 2026-02-04 | **Updated:** 2026-02-04 | **Completed:** 2026-02-04

> Refactor MCP server from deprecated `Server` API to `McpServer` API with config-driven tool registration.

---

## Overview

### Purpose

Migrate `mcp-server/src/index.ts` from deprecated `Server` class to future-proof `McpServer` API, using config-driven approach for tool registration.

### Scope

**In Scope:**
- Replace `Server` with `McpServer`
- Replace `setRequestHandler` with `registerTool()`
- Create tool config array with metadata
- Auto-derive prompt filenames from tool names
- Maintain variable injection mechanism

**Out of Scope:**
- NO changes to tool names, parameters, or behavior (backward compatible)
- NO changes to prompt files themselves
- NO new dependencies

### Success Criteria

- MCP server uses `McpServer` instead of deprecated `Server`
- No deprecation warnings
- All 7 tools work identically in Claude
- Build succeeds: `cd mcp-server && npm run build`
- Package installs correctly: `npm pack` produces valid tarball

---

## Requirements

### Functional Requirements

**FR1: Tool Registration**
- Use `mcpServer.registerTool()` for each of 7 tools
- Each tool maintains same name, description, inputSchema
- Tools return same prompt text to Claude

**FR2: Config-Driven Approach**
- Tool definitions stored in config array (not hardcoded in switch)
- Tool config specifies: name, description, inputSchema, promptFile, variableMapper

**FR3: Prompt Loading**
- Project prompts load from `sf360-playwright/prompts/` (init, discover-page, add-page-mapping, verify-setup)
- Package prompts load from `templates/prompts/` (sf360-test-plan, test-generate, test-evaluate, test-report)
- Prompt filename auto-derived from tool name (no hardcoding)

**FR4: Variable Injection**
- Variables (SPEC, TEST_NAME, PAGE_KEY, etc.) injected into prompts using `{{PLACEHOLDER}}` syntax
- Same injection behavior as current implementation

### Non-Functional Requirements

**NFR1: Backward Compatibility**
- NO changes to public API (tool names, parameters)
- NO breaking changes for users

**NFR2: Maintainability**
- Adding new tool = add entry to config array (no switch statement editing)
- Config-driven = easier to read and modify

**NFR3: Performance**
- No performance regression
- Tool registration happens once at startup

---

## Technical Design

### Architecture

**Current:**
```
Server (deprecated)
  ├─ setRequestHandler(ListToolsRequestSchema) → returns tools array
  └─ setRequestHandler(CallToolRequestSchema) → switch (7 cases)
```

**Proposed:**
```
McpServer
  └─ registerTool() × 7 (one per tool)
       ├─ Tool config (from array)
       └─ Callback (loads prompt + injects variables)
```

### Tool Config Structure

```typescript
interface ToolConfig {
  name: string;                    // e.g., 'init'
  description: string;             // Tool description
  inputSchema: object;             // JSON schema for parameters
  promptFile: string;              // e.g., 'init-prompt.md'
  promptSource: 'project' | 'package';  // Load from project or package
  variableMapper?: (args: any) => Record<string, string>;  // Maps args to {{VARS}}
}
```

### Tool Config Arrays

**Project Tools** (load from `sf360-playwright/prompts/`):
```typescript
const projectTools: ToolConfig[] = [
  {
    name: 'init',
    description: 'Initialize SF360 Playwright test infrastructure...',
    inputSchema: { type: 'object', properties: {} },
    promptFile: 'init-prompt.md',
    promptSource: 'project'
  },
  {
    name: 'discover-page',
    description: 'Explore a SF360 page...',
    inputSchema: {
      type: 'object',
      properties: {
        pageKey: { type: 'string', description: '...' },
        outputFile: { type: 'string', description: '...' }
      },
      required: ['pageKey']
    },
    promptFile: 'discover-page-prompt.md',
    promptSource: 'project',
    variableMapper: (args) => ({
      PAGE_KEY: String(args.pageKey || ''),
      OUTPUT_FILE: String(args.outputFile || 'auto-generated')
    })
  },
  // ... add-page-mapping, verify-setup
];
```

**Package Tools** (load from `templates/prompts/`):
```typescript
const packageTools: ToolConfig[] = [
  {
    name: 'sf360-test-plan',
    description: 'Create structured test plan...',
    inputSchema: {
      type: 'object',
      properties: {
        spec: { type: 'string', description: '...' },
        testName: { type: 'string', description: '...' },
        pageName: { type: 'string', description: '...' }
      },
      required: ['spec']
    },
    promptFile: 'test-plan-prompt.md',
    promptSource: 'package',
    variableMapper: (args) => ({
      SPEC: String(args.spec || ''),
      TEST_NAME: String(args.testName || 'auto-generated'),
      PAGE_NAME: String(args.pageName || 'not specified')
    })
  },
  // ... test-generate, test-evaluate, test-report
];
```

### Tool Registration

```typescript
function registerTools(tools: ToolConfig[]) {
  tools.forEach(tool => {
    mcpServer.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema
      },
      async (args) => {
        // Load prompt
        let prompt = tool.promptSource === 'project'
          ? loadPrompt(tool.promptFile)
          : loadPackagePrompt(tool.promptFile.replace('.md', ''), {});

        // Inject variables if mapper provided
        if (tool.variableMapper) {
          const variables = tool.variableMapper(args);
          for (const [key, value] of Object.entries(variables)) {
            prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
          }
        }

        return {
          content: [{
            type: 'text',
            text: prompt
          }]
        };
      }
    );
  });
}

// Register all tools
registerTools(projectTools);
registerTools(packageTools);
```

### Import Changes

**Before:**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(...);
server.setRequestHandler(ListToolsRequestSchema, ...);
server.setRequestHandler(CallToolRequestSchema, ...);
await server.connect(transport);
```

**After:**
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// Remove: CallToolRequestSchema, ListToolsRequestSchema (not needed)

const mcpServer = new McpServer(...);
registerTools(projectTools);
registerTools(packageTools);
await mcpServer.connect(transport);
```

---

## Security Considerations

- No security changes (same prompt loading mechanism)
- No new external inputs
- Same variable injection (no XSS risk - prompts are server-side)

---

## Edge Cases & Error Handling

**Error Case 1: Prompt file not found**
- Current behavior: Return error message string
- New behavior: Same (handled in loadPrompt/loadPackagePrompt)

**Error Case 2: Variable mapper throws error**
- Wrap in try-catch, return error prompt
- Log error to stderr

**Error Case 3: Tool registration fails**
- McpServer throws error at startup
- Fatal error, exit process (same as current)

---

## Testing Strategy

### Manual Testing

1. **Build Test**
   ```bash
   cd mcp-server
   npm run build
   # Verify: dist/index.js exists, no errors
   ```

2. **Package Test**
   ```bash
   npm pack
   # Verify: tarball created, correct size (~200KB)
   ```

3. **Installation Test**
   ```bash
   cd ../sf360test-project
   npm install ../sf360-playwright-mcp/bgl-sf360-playwright-mcp-1.0.0.tgz
   # Verify: package installs, mcp-server/dist/ present
   ```

4. **Tool Discovery Test**
   ```bash
   claude mcp add sf360-playwright-mcp -- node "$(pwd)/node_modules/@bgl/sf360-playwright-mcp/mcp-server/dist/index.js"
   # In Claude: Verify 7 tools visible
   ```

5. **Tool Execution Test**
   - Call each tool in Claude
   - Verify prompt returned
   - Verify variables injected correctly

### Automated Testing (Future)

- Unit tests for registerTools()
- Integration tests for McpServer
- E2E tests for tool calls

---

## Implementation Tasks

**Task 1: Update imports**
- Change Server → McpServer
- Remove CallToolRequestSchema, ListToolsRequestSchema
- Add import from server/mcp.js

**Task 2: Create tool config arrays**
- Define ToolConfig interface
- Create projectTools array (4 tools)
- Create packageTools array (4 tools)

**Task 3: Create registerTools() function**
- Iterate over tool config array
- Call mcpServer.registerTool() for each
- Load prompt based on promptSource
- Apply variable injection

**Task 4: Update main() function**
- Change server.connect() → mcpServer.connect()
- Call registerTools() for both arrays

**Task 5: Remove old code**
- Delete setRequestHandler calls
- Delete switch statement
- Keep loadPrompt() and loadPackagePrompt() helpers

**Task 6: Test**
- Build: `npm run build`
- Pack: `npm pack`
- Install: Test in sf360test-project
- Verify: All 7 tools work in Claude

---

## Rollback Plan

If issues arise:
1. Revert commit: `git revert HEAD`
2. Rebuild: `npm run build`
3. Republish: `npm pack`

Git provides easy rollback since this is a single-file change.

---

## Conventions Adherence

- **File naming:** No changes (index.ts)
- **Code style:** 2 spaces, single quotes, semicolons (TypeScript)
- **Imports:** Include .js extension (ES modules)
- **Functions:** camelCase (registerTools, loadPrompt)
- **Constants:** camelCase for arrays (projectTools, packageTools)

---

## Acceptance Criteria

- [ ] McpServer imported and used instead of Server
- [ ] No deprecated API usage (no setRequestHandler)
- [ ] ToolConfig interface defined
- [ ] projectTools array defined (4 tools)
- [ ] packageTools array defined (4 tools)
- [ ] registerTools() function implemented
- [ ] All 7 tools registered via registerTool()
- [ ] Variable injection works for all tools
- [ ] Build succeeds: `cd mcp-server && npm run build`
- [ ] No TypeScript errors
- [ ] Package builds: `npm pack` produces tarball
- [ ] Tools discoverable in Claude Desktop
- [ ] All tools execute and return prompts correctly
- [ ] No breaking changes (tool names/params unchanged)

---

**Lines:** 198/200
