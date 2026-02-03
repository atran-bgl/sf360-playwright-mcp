# Architecture - SF360 Test Generator MCP

## Overview

The SF360 Test Generator MCP is a **pure prompt provider** that never executes operations directly. Instead, it returns structured prompts that instruct Claude on what to do using its existing tools.

## Architectural Pattern: Pure Prompt Provider

### How It Works

```
User Request
    ↓
Claude invokes MCP tool
    ↓
MCP returns structured prompt
    ↓
Claude reads prompt and executes:
  - Read files (menu mapping, auth helper)
  - Use Playwright MCP (login, navigate, discover elements)
  - Ask user questions (AskUserQuestion)
  - Generate test code (Write tool)
  - Save test file
    ↓
User receives generated test
```

### Why This Pattern?

1. **No File Access**: MCP never touches project files directly
2. **Interface Agnostic**: Works with Claude Desktop, Claude Code CLI, or custom clients
3. **No API Costs**: Uses your existing Claude subscription
4. **User Approval**: Claude asks before making changes
5. **Leverages Existing Tools**: Reuses Playwright MCP, Read/Write tools, etc.

## Technology Stack

### MCP Server
- **SDK**: `@modelcontextprotocol/sdk` ^1.25.2
- **Language**: TypeScript (ESM modules)
- **Transport**: stdio (StdioServerTransport)
- **Node**: >=18.0.0
- **Pattern**: Based on project-memory-mcp

### Integration Points
- **Playwright MCP**: Browser automation (login, navigate, snapshot)
- **Auth Helper**: Existing `helpers/auth.js` for SF360 login
- **Menu Mapping**: `config/menu-mapping.json` for page navigation
- **Claude Tools**: Read, Write, Edit, Bash, AskUserQuestion

## Project Structure

```
/sf360-playwright-mcp/
├── mcp-server/                      # NEW: MCP server
│   ├── src/
│   │   ├── index.ts                 # Main entry point
│   │   ├── prompts/                 # Prompt templates
│   │   │   ├── generate-test-prompt.ts
│   │   │   ├── discover-page-prompt.ts
│   │   │   ├── update-login-helper-prompt.ts
│   │   │   └── add-page-mapping-prompt.ts
│   │   └── utils/
│   │       └── helpers.ts           # Utility functions
│   ├── dist/                        # Compiled JS output
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── config/                          # EXISTING
│   ├── menu-mapping.json            # 37 SF360 pages
│   └── page-elements/               # NEW: Element inventories
│       └── [page-name].json
├── helpers/                         # EXISTING
│   ├── auth.js                      # Login helper with TOTP
│   └── global-setup.js
├── tests/                           # EXISTING - generated tests go here
│   └── badge.test.js
├── specs/                           # NEW: This specification
│   ├── README.md
│   ├── 1-architecture.md (this file)
│   └── ...
├── screenshots/                     # EXISTING
├── package.json                     # EXISTING
├── playwright.config.js             # EXISTING
└── README.md                        # EXISTING - will update
```

## Component Architecture

### 1. MCP Server (mcp-server/src/index.ts)

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Initialize server
const server = new Server({
  name: 'sf360-test-gen-mcp',
  version: '0.1.0'
}, {
  capabilities: { tools: {} }
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [
    { name: 'generate-test', ... },
    { name: 'discover-page', ... },
    { name: 'update-login-helper', ... },
    { name: 'add-page-mapping', ... }
  ]};
});

// Handle tool calls - return prompts
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'generate-test':
      return { content: [{ type: 'text', text: GENERATE_TEST_PROMPT }] };
    case 'discover-page':
      return { content: [{ type: 'text', text: DISCOVER_PAGE_PROMPT }] };
    // ... other tools
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. Prompt Templates (mcp-server/src/prompts/*.ts)

Each prompt is a detailed markdown document that instructs Claude:

```typescript
export const GENERATE_TEST_PROMPT = `
# Generate Playwright Test

You are generating a Playwright test from a natural language specification.

## Step 1: Read Configuration
- Read menu-mapping.json from config/
- Read auth helper from helpers/auth.js

## Step 2: Parse Specification
- Understand test requirements
- Identify target page
- Extract test steps
- Identify expected outcomes

## Step 3: Use Playwright MCP
... detailed instructions ...
`;
```

### 3. Auth Helper Integration

Generated tests automatically include login setup:

```javascript
const { test, expect } = require('@playwright/test');
const { login, navigateToPage } = require('../helpers/auth');
const path = require('path');

test.describe('Test Name', () => {
  test.beforeEach(async ({ page }) => {
    // Login executed before each test
    await login(page, {
      envPath: path.join(__dirname, '../../../superstream_dashboard/.env')
    });
  });

  test('should do something', async ({ page }) => {
    await navigateToPage(page, 'settings.badges');
    // Test steps...
  });
});
```

## Data Flow

### Generate Test Flow

```
1. User: "Generate test for Badge settings..."
   ↓
2. Claude invokes: mcp__sf360-test-gen__generate-test
   Parameters: { spec: "...", testName: "badge-create" }
   ↓
3. MCP returns: Comprehensive prompt with instructions
   ↓
4. Claude executes prompt:
   a. Read config/menu-mapping.json
   b. Read helpers/auth.js
   c. Parse spec into steps
   d. Use Playwright MCP: browser_navigate (login URL)
   e. Use Playwright MCP: Fill credentials
   f. Navigate to page using menu mapping
   g. Use Playwright MCP: browser_snapshot
   h. Analyze snapshot for elements
   i. If ambiguous: AskUserQuestion
   j. Generate test code
   k. Write test file to tests/
   ↓
5. User receives: tests/badge-create.test.js
```

### Discover Page Flow

```
1. User: "Discover elements on SuperStream Dashboard"
   ↓
2. Claude invokes: mcp__sf360-test-gen__discover-page
   Parameters: { pageKey: "connect.superstream_dashboard" }
   ↓
3. MCP returns: Discovery prompt
   ↓
4. Claude executes:
   a. Use Playwright MCP: Login
   b. Navigate to page
   c. Use browser_snapshot: Get page structure
   d. Use browser_take_screenshot: Capture visual
   e. Parse snapshot for interactive elements
   f. Extract data-testid attributes
   g. Document element roles
   h. Generate element inventory JSON
   i. Save to config/page-elements/superstream-dashboard.json
   j. Suggest test scenarios
   ↓
5. User receives: Element inventory + test suggestions
```

## Security Considerations

### Credential Management
- Credentials stored in .env (never in MCP)
- Auth helper reads .env at test runtime
- TOTP secrets handled securely by otplib
- MCP never accesses credentials directly

### Code Generation Safety
- Generated code follows established patterns
- Uses existing auth helper (no credential hardcoding)
- Validates selectors before generating test
- User reviews generated code before running

## Scalability

### Adding New Tools
1. Create prompt template in `src/prompts/`
2. Register tool in `index.ts`
3. Add tool handler that returns prompt
4. Document in specs

### Supporting New Pages
- Add entry to menu-mapping.json
- Generate element inventory with discover-page tool
- Tests automatically work with new pages

### Extending Prompts
- Prompts are just TypeScript string exports
- Easy to modify and version control
- Can include project-specific patterns
- User feedback improves prompts over time

## Dependencies

### Runtime
- `@modelcontextprotocol/sdk` - MCP server functionality

### Development
- `@types/node` - TypeScript types
- `typescript` - TypeScript compiler

### External (Used by Claude, not MCP)
- Playwright MCP - Browser automation
- Claude's built-in tools - Read, Write, Edit, Bash, AskUserQuestion
- sf360-playwright-mcp project - Test framework and helpers

## Comparison with Direct Implementation

### Without MCP (Current)
```
User → Claude → Manual test writing → Review → Save
```

### With MCP
```
User → Claude → MCP Tool → Structured Prompt →
Claude executes → Generated test with login → Save
```

### Benefits
- ✅ Consistent test structure
- ✅ Always includes login setup
- ✅ Reuses auth helper correctly
- ✅ Follows project conventions
- ✅ Interactive clarification
- ✅ Element discovery guidance
- ✅ Assertion patterns
