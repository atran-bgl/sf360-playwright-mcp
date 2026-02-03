# Plan: Create Specification for SF360 Test Generator MCP

## Overview
Create a comprehensive specification document for an MCP (Model Context Protocol) server that will generate Playwright tests from natural language specifications. This spec will be saved in the sf360-playwright-mcp project as a discovery/design document.

## What We're Creating
A specification file that documents:
- MCP server architecture (pure prompt provider pattern)
- Tool definitions and functionality
- Implementation approach
- Example workflows
- Integration with existing Playwright setup

## Key Architecture Insight
The MCP server will NOT execute operations directly. Instead, it:
1. Returns structured prompts that instruct Claude on what to do
2. Claude uses its existing tools to execute: Read, Write, Edit, Bash, and **Playwright MCP tools**
3. Login setup is embedded in generated test code via beforeEach hooks
4. Interactive guidance happens naturally through Claude's conversation

## User Requirements
- **Input Format**: Natural language test descriptions/specifications (provided inline)
- **Element Strategy**: Prefer test IDs (data-testid), fall back to AI-inferred elements
- **Automation**: Interactive guided generation (ask questions during process)
- **Assertions**: Generate expect() statements from expected outcomes
- **Login**: Automatically include login setup in generated tests using existing auth helper
- **Session**: Maintain persistent browser session across test generation (handled by test framework)

## MCP Architecture (Based on project-memory-mcp)

### Technology Stack
- **SDK**: `@modelcontextprotocol/sdk` ^1.25.2
- **Language**: TypeScript (ESM modules)
- **Transport**: stdio (StdioServerTransport)
- **Node**: >=18.0.0

### Tool Design
The MCP will provide these tools (all return prompts, not execute operations):

#### 1. `generate-test`
**Purpose**: Generate a complete Playwright test from natural language specification

**Input Schema**:
```json
{
  "spec": "string (required) - Natural language test description",
  "pageName": "string (optional) - Target page from menu mapping",
  "testName": "string (required) - Name for the test file"
}
```

**Returned Prompt**: Instructs Claude to:
1. Read the menu mapping and auth helper
2. Parse the spec to understand test requirements
3. Use Playwright MCP to login and navigate to the page
4. Use browser_snapshot to discover page elements
5. Identify correct selectors (prefer data-testid)
6. Ask user for confirmation on ambiguous elements
7. Generate test file with login setup in beforeEach
8. Include assertions based on expected outcomes
9. Save test to `/sf360-playwright-mcp/tests/`

#### 2. `discover-page`
**Purpose**: Explore a page and document all testable elements

**Input Schema**:
```json
{
  "pageKey": "string (required) - Page key from menu-mapping.json",
  "outputFile": "string (optional) - Save element inventory to file"
}
```

**Returned Prompt**: Instructs Claude to:
1. Use Playwright MCP to login and navigate to page
2. Capture page snapshot and screenshot
3. Identify all interactive elements (buttons, inputs, links)
4. Extract data-testid attributes
5. Document element roles and accessibility labels
6. Generate element inventory JSON
7. Suggest potential test scenarios

#### 3. `update-login-helper`
**Purpose**: Update the auth.js helper with improvements

**Input Schema**:
```json
{
  "improvements": "string (required) - Describe what to improve"
}
```

**Returned Prompt**: Instructs Claude to:
1. Read current helpers/auth.js
2. Apply requested improvements
3. Ensure backward compatibility
4. Update documentation

#### 4. `add-page-mapping`
**Purpose**: Add a new page to menu-mapping.json

**Input Schema**:
```json
{
  "pageName": "string (required)",
  "url": "string (required)",
  "section": "string (required)"
}
```

**Returned Prompt**: Instructs Claude to:
1. Read menu-mapping.json
2. Add new page entry with proper structure
3. Validate URL format
4. Save updated mapping

## Implementation Plan

### Project Structure
```
/sf360-playwright-mcp/
├── mcp-server/              # NEW: MCP server directory
│   ├── src/
│   │   ├── index.ts         # Main server entry point
│   │   ├── prompts/         # Prompt templates
│   │   │   ├── generate-test-prompt.ts
│   │   │   ├── discover-page-prompt.ts
│   │   │   ├── update-login-helper-prompt.ts
│   │   │   └── add-page-mapping-prompt.ts
│   │   └── utils/
│   │       └── helpers.ts   # Utility functions
│   ├── dist/                # Compiled JS
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── config/                  # EXISTING
│   └── menu-mapping.json
├── helpers/                 # EXISTING
│   └── auth.js
├── tests/                   # EXISTING
│   └── badge.test.js
└── README.md               # EXISTING - will update
```

### Critical Files to Create

#### 1. `/sf360-playwright-mcp/mcp-server/package.json`
```json
{
  "name": "@atran-bgl/sf360-test-generator-mcp",
  "version": "0.1.0",
  "description": "MCP server for SF360 Playwright test generation",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "sf360-test-gen-mcp": "./dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.2"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
```

#### 2. `/sf360-playwright-mcp/mcp-server/src/index.ts`
- Import Server and StdioServerTransport from MCP SDK
- Register 4 tools: generate-test, discover-page, update-login-helper, add-page-mapping
- Each tool handler returns the corresponding prompt
- Use stdio transport for communication

#### 3. `/sf360-playwright-mcp/mcp-server/src/prompts/generate-test-prompt.ts`
**Comprehensive prompt that instructs Claude to**:
1. Read menu-mapping.json and helpers/auth.js
2. Parse natural language spec into test steps
3. Use Playwright MCP browser_navigate to login
4. Navigate to target page using menu mapping
5. Use browser_snapshot to discover elements
6. Ask user via AskUserQuestion when multiple element matches found
7. Generate test file with structure:
   ```javascript
   const { test, expect } = require('@playwright/test');
   const { login, navigateToPage } = require('../helpers/auth');

   test.describe('Test Name', () => {
     test.beforeEach(async ({ page }) => {
       await login(page, {
         envPath: path.join(__dirname, '../../../superstream_dashboard/.env')
       });
     });

     test('should...', async ({ page }) => {
       await navigateToPage(page, 'pageKey');
       // Test steps with assertions
     });
   });
   ```
8. Prefer data-testid selectors, fall back to roles/text
9. Add expect() assertions based on expected outcomes in spec
10. Save test to tests/ directory

#### 4. `/sf360-playwright-mcp/mcp-server/src/prompts/discover-page-prompt.ts`
**Prompt that instructs Claude to**:
1. Use Playwright MCP to login
2. Navigate to specified page
3. Use browser_snapshot to get page structure
4. Take screenshot with browser_take_screenshot
5. Extract all interactive elements
6. Document data-testid attributes
7. Create element inventory JSON with:
   - Element type (button, input, link, etc.)
   - Selector options (testid, role, css)
   - Accessible name
   - Location context
8. Save inventory to config/page-elements/[page-name].json
9. Suggest test scenarios based on discovered elements

#### 5. `/sf360-playwright-mcp/mcp-server/src/prompts/update-login-helper-prompt.ts`
- Read helpers/auth.js
- Apply requested improvements
- Maintain backward compatibility
- Update documentation

#### 6. `/sf360-playwright-mcp/mcp-server/src/prompts/add-page-mapping-prompt.ts`
- Read menu-mapping.json
- Add new entry in proper format
- Validate and save

#### 7. `/sf360-playwright-mcp/mcp-server/tsconfig.json`
Copy from project-memory-mcp with proper ES2022 target

### Files to Update

#### 1. `/sf360-playwright-mcp/README.md`
Add section:
- Installing and configuring the MCP server
- Using the test generation tools
- Example workflows
- Troubleshooting

#### 2. `/sf360-playwright-mcp/mcp-server/README.md` (new)
- Installation instructions
- MCP configuration for Claude Desktop and Claude Code
- Tool descriptions and usage examples

## Implementation Steps

### Phase 1: MCP Server Foundation (30 min)
1. Create `/sf360-playwright-mcp/mcp-server/` directory structure
2. Copy package.json, tsconfig.json from project-memory-mcp
3. Update package.json with sf360-test-gen-mcp naming
4. Create basic index.ts with Server setup
5. Test MCP server starts correctly

### Phase 2: Prompt Development (2 hours)
1. Create generate-test-prompt.ts
   - Include complete instructions for test generation
   - Define test template structure
   - Specify Playwright MCP tool usage
   - Include interactive confirmation points
   - Add element discovery logic
   - Define assertion patterns
2. Create discover-page-prompt.ts
   - Page exploration instructions
   - Element inventory format
   - Screenshot and snapshot commands
3. Create update-login-helper-prompt.ts
4. Create add-page-mapping-prompt.ts

### Phase 3: Server Implementation (1 hour)
1. Implement tool registration in index.ts
2. Add tool handlers that return prompts
3. Test each tool returns correct prompt
4. Build TypeScript to dist/

### Phase 4: Installation & Configuration (30 min)
1. Build MCP server: `npm run build`
2. Install globally or link locally
3. Add to Claude Code config:
   ```json
   {
     "mcpServers": {
       "sf360-test-gen": {
         "type": "stdio",
         "command": "sf360-test-gen-mcp",
         "cwd": "/Users/atran/SFsourceCode/sf360-playwright-mcp"
       }
     }
   }
   ```
4. Restart Claude Code CLI

### Phase 5: Testing & Validation (1 hour)
1. Test tool discovery in Claude
2. Generate simple test from spec
3. Verify login setup is included
4. Run generated test with `npm run test`
5. Test discover-page tool on Badge page
6. Validate element discovery accuracy

### Phase 6: Documentation (30 min)
1. Update main README.md with MCP usage
2. Create mcp-server/README.md
3. Add example workflows
4. Document troubleshooting

## Example Workflows

### Workflow 1: Generate Test from Spec
```
User: "Generate a test for the Badge settings page. The test should:
- Navigate to Badge settings
- Click 'Create New Badge' button
- Fill in badge name as 'Test Badge'
- Click save
- Verify the badge appears in the list"

Claude calls: mcp__sf360-test-gen__generate-test
MCP returns: Detailed prompt
Claude executes:
  1. Reads menu-mapping.json
  2. Uses Playwright MCP to login
  3. Navigates to settings.badges
  4. Uses browser_snapshot to find elements
  5. Asks user: "Found 2 buttons: 'Save Draft' and 'Save & Publish'. Which to use?"
  6. Generates test file
  7. Saves to tests/badge-create.test.js
```

### Workflow 2: Discover Page Elements
```
User: "Discover all elements on the SuperStream Dashboard page"

Claude calls: mcp__sf360-test-gen__discover-page
MCP returns: Discovery prompt
Claude executes:
  1. Uses Playwright MCP to login
  2. Navigates to connect.superstream_dashboard
  3. Takes snapshot and screenshot
  4. Identifies 23 interactive elements
  5. Saves inventory to config/page-elements/superstream-dashboard.json
  6. Suggests 5 test scenarios
```

### Workflow 3: Update Login Helper
```
User: "Add support for custom timeout in login helper"

Claude calls: mcp__sf360-test-gen__update-login-helper
MCP returns: Update prompt
Claude executes:
  1. Reads helpers/auth.js
  2. Adds timeout parameter to login function
  3. Updates function signature and logic
  4. Updates documentation
  5. Ensures backward compatibility
```

## MCP Configuration

### For Claude Code CLI
Add to `~/.claude.json`:
```json
{
  "mcpServers": {
    "sf360-test-gen": {
      "type": "stdio",
      "command": "sf360-test-gen-mcp",
      "cwd": "/Users/atran/SFsourceCode/sf360-playwright-mcp"
    }
  }
}
```

### For Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "sf360-test-gen": {
      "type": "stdio",
      "command": "sf360-test-gen-mcp",
      "cwd": "/Users/atran/SFsourceCode/sf360-playwright-mcp"
    }
  }
}
```

## Verification Plan

### Test 1: Tool Registration
- Start Claude Code CLI
- List available tools
- Verify 4 sf360-test-gen tools appear

### Test 2: Generate Simple Test
- Provide simple spec: "Test login page loads"
- Verify generated test includes:
  - Login setup in beforeEach
  - Correct imports
  - Test structure
  - Basic assertions

### Test 3: Element Discovery
- Run discover-page on Badge settings
- Verify element inventory is comprehensive
- Check data-testid extraction
- Validate suggested scenarios

### Test 4: Run Generated Test
- Generate test for existing page (Badge)
- Run: `npm test tests/generated-test.js`
- Verify test passes
- Check screenshots on failure

### Test 5: Interactive Flow
- Generate test with ambiguous elements
- Verify Claude asks for clarification
- Provide answer via AskUserQuestion
- Verify test uses selected element

## Success Criteria

✅ MCP server installs and runs successfully
✅ All 4 tools are discoverable in Claude
✅ Generated tests include proper login setup
✅ Generated tests use auth helper correctly
✅ Element discovery finds data-testid attributes
✅ Interactive prompts work for ambiguous cases
✅ Generated tests are runnable and pass
✅ Documentation is complete and clear

## Expected Timeline

- **Phase 1**: 30 minutes - Server foundation
- **Phase 2**: 2 hours - Prompt development
- **Phase 3**: 1 hour - Server implementation
- **Phase 4**: 30 minutes - Installation
- **Phase 5**: 1 hour - Testing
- **Phase 6**: 30 minutes - Documentation

**Total**: ~5.5 hours for complete implementation

---

## What We'll Actually Do (Immediate Action)

Instead of implementing immediately, we'll create a specification document that captures all this planning work:

### File to Create
**`/Users/atran/SFsourceCode/sf360-playwright-mcp/specs/mcp-test-generator.md`**

### Spec Content Structure
1. **Overview** - What the MCP does and why
2. **Architecture** - Pure prompt provider pattern, based on project-memory-mcp
3. **Requirements** - User requirements gathered from questions
4. **Tool Definitions** - All 4 tools with input/output specs
5. **Prompt Design** - What each prompt should instruct Claude to do
6. **Implementation Guide** - Step-by-step implementation phases
7. **Project Structure** - Directory layout and critical files
8. **Example Workflows** - 3 concrete usage examples
9. **Configuration** - How to install and configure the MCP
10. **Verification Plan** - How to test the implementation
11. **Success Criteria** - What "done" looks like
12. **Timeline Estimate** - ~5.5 hours

### Purpose of the Spec
- Document the design before implementation
- Provide clear reference for future implementation
- Allow for review and refinement of approach
- Serve as implementation blueprint when ready to build

### Next Steps After Spec Creation
1. Review spec with stakeholders
2. Refine based on feedback
3. Use spec to guide implementation
4. Update spec as implementation progresses
